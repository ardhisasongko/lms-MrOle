-- Normalize free-text answers consistently while preserving meaningful
-- punctuation inside an answer (for example contractions).
CREATE OR REPLACE FUNCTION public.normalize_quiz_answer(p_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = pg_catalog
AS $$
  SELECT regexp_replace(
    regexp_replace(lower(btrim(replace(p_value, '’', ''''))), '[[:space:]]+', ' ', 'g'),
    '[.]$',
    ''
  );
$$;

REVOKE ALL ON FUNCTION public.normalize_quiz_answer(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_quiz_session(
  p_session_id UUID,
  p_answers JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.quiz_sessions%ROWTYPE;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_answer_count INTEGER;
  v_distinct_count INTEGER;
  v_correct_count INTEGER;
  v_attempt_id UUID;
  v_score NUMERIC(5,2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_session
  FROM public.quiz_sessions AS session
  WHERE session.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND OR v_session.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Quiz session not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_session.status = 'submitted' THEN
    RETURN jsonb_build_object(
      'session_id', v_session.id,
      'attempt_id', v_session.attempt_id,
      'score', v_session.score,
      'correct', v_session.correct_answers,
      'total', v_session.question_count,
      'mode', v_session.mode,
      'already_submitted', TRUE,
      'status', v_session.status
    );
  END IF;

  IF v_session.status = 'expired'
     OR (v_session.expires_at <= v_now AND NOT (
       v_session.mode = 'timed'
       AND v_now <= v_session.expires_at + INTERVAL '30 seconds'
     )) THEN
    RAISE EXCEPTION 'Quiz session has expired' USING ERRCODE = '55000';
  END IF;
  IF v_session.status <> 'active' THEN
    RAISE EXCEPTION 'Quiz session cannot be submitted' USING ERRCODE = '55000';
  END IF;

  IF p_answers IS NOT NULL THEN
    IF jsonb_typeof(p_answers) <> 'array' THEN
      RAISE EXCEPTION 'Answers must be a JSON array' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_answers) AS answer_rows(answer)
      WHERE jsonb_typeof(answer) <> 'object'
        OR NOT (answer ? 'question_id')
        OR NOT (answer ? 'user_answer')
        OR jsonb_typeof(answer->'question_id') <> 'string'
        OR jsonb_typeof(answer->'user_answer') <> 'string'
    ) THEN
      RAISE EXCEPTION 'Each answer requires question_id and user_answer strings'
        USING ERRCODE = '22023';
    END IF;

    SELECT COUNT(*), COUNT(DISTINCT answer->>'question_id')
    INTO v_answer_count, v_distinct_count
    FROM jsonb_array_elements(p_answers) AS answer_rows(answer);

    IF v_answer_count <> v_distinct_count THEN
      RAISE EXCEPTION 'Duplicate question_id in answers' USING ERRCODE = '22023';
    END IF;
    IF v_answer_count <> v_session.question_count THEN
      RAISE EXCEPTION 'Exactly % answers are required', v_session.question_count
        USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_answers) AS answer_rows(answer)
      LEFT JOIN public.quiz_session_questions AS session_question
        ON session_question.session_id = p_session_id
       AND session_question.question_id = (answer->>'question_id')::UUID
      WHERE session_question.question_id IS NULL
    ) THEN
      RAISE EXCEPTION 'Answer contains a question outside this session'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.quiz_session_questions AS session_question
    SET user_answer = answer_rows.answer->>'user_answer',
        answered_at = v_now
    FROM jsonb_array_elements(p_answers) AS answer_rows(answer)
    WHERE session_question.session_id = p_session_id
      AND session_question.question_id = (answer_rows.answer->>'question_id')::UUID;
  END IF;

  SELECT COUNT(*) INTO v_answer_count
  FROM public.quiz_session_questions AS session_question
  WHERE session_question.session_id = p_session_id
    AND session_question.user_answer IS NOT NULL;

  IF v_answer_count <> v_session.question_count THEN
    RAISE EXCEPTION 'All % session questions must be answered', v_session.question_count
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.quiz_session_questions AS session_question
    WHERE session_question.session_id = p_session_id
      AND session_question.question_type = 'multiple_choice'
      AND session_question.user_answer <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(session_question.options) = 'array' THEN session_question.options
            ELSE '[]'::JSONB
          END
        ) AS option_rows(option_value)
        WHERE option_value->>'label' = session_question.user_answer
      )
  ) THEN
    RAISE EXCEPTION 'A multiple-choice answer is not a valid snapshot option label'
      USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*) INTO v_correct_count
  FROM public.quiz_session_questions AS session_question
  WHERE session_question.session_id = p_session_id
    AND public.normalize_quiz_answer(session_question.correct_answer)
      = public.normalize_quiz_answer(session_question.user_answer);

  v_score := ROUND((v_correct_count::NUMERIC / v_session.question_count) * 100, 2);

  INSERT INTO public.quiz_attempts (
    user_id, category_id, difficulty, total_questions,
    correct_answers, score, completed_at
  ) VALUES (
    v_user_id, v_session.category_id, v_session.difficulty,
    v_session.question_count, v_correct_count, v_score, v_now
  ) RETURNING id INTO v_attempt_id;

  INSERT INTO public.quiz_answers (
    attempt_id, question_id, user_answer, is_correct
  )
  SELECT
    v_attempt_id,
    session_question.question_id,
    session_question.user_answer,
    public.normalize_quiz_answer(session_question.correct_answer)
      = public.normalize_quiz_answer(session_question.user_answer)
  FROM public.quiz_session_questions AS session_question
  WHERE session_question.session_id = p_session_id
  ORDER BY session_question.position;

  IF v_session.mode <> 'retry' THEN
    INSERT INTO public.learning_streaks AS streak (user_id, date, questions_done)
    VALUES (v_user_id, CURRENT_DATE, v_session.question_count)
    ON CONFLICT (user_id, date) DO UPDATE
    SET questions_done = streak.questions_done + EXCLUDED.questions_done;
  END IF;

  UPDATE public.quiz_sessions AS session
  SET status = 'submitted',
      submitted_at = v_now,
      attempt_id = v_attempt_id,
      correct_answers = v_correct_count,
      score = v_score
  WHERE session.id = p_session_id;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'attempt_id', v_attempt_id,
    'score', v_score,
    'correct', v_correct_count,
    'total', v_session.question_count,
    'mode', v_session.mode,
    'already_submitted', FALSE,
    'status', 'submitted'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz_session(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz_session(UUID, JSONB) TO authenticated;
