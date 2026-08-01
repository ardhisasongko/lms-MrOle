-- Additive foundation for resumable, server-scored quiz sessions.

-- Keep the legacy question column intact while adding structured content and
-- publication metadata. Existing questions remain available by default.
ALTER TABLE public.questions
  ADD COLUMN stimulus TEXT,
  ADD COLUMN prompt TEXT,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN content_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN content_hash TEXT,
  ADD COLUMN batch_id TEXT,
  ADD COLUMN batch_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD CONSTRAINT questions_status_check
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD CONSTRAINT questions_content_metadata_object_check
    CHECK (jsonb_typeof(content_metadata) = 'object'),
  ADD CONSTRAINT questions_content_hash_check
    CHECK (content_hash IS NULL OR content_hash ~ '^[a-f0-9]{64}$'),
  ADD CONSTRAINT questions_batch_id_check
    CHECK (batch_id IS NULL OR BTRIM(batch_id) <> ''),
  ADD CONSTRAINT questions_batch_metadata_object_check
    CHECK (jsonb_typeof(batch_metadata) = 'object');

-- Parse the legacy reading/listening convention without changing question.
UPDATE public.questions
SET
  stimulus = NULLIF(BTRIM(SUBSTRING(
    question FROM '(?is)^\s*(?:Teks|Transkrip):\s*(.*?)\s*Pertanyaan:\s*'
  )), ''),
  prompt = NULLIF(BTRIM(SUBSTRING(
    question FROM '(?is)Pertanyaan:\s*(.*?)\s*$'
  )), ''),
  content_metadata = content_metadata || jsonb_build_object(
    'stimulus_type',
    CASE
      WHEN question ~* '^\s*Transkrip:' THEN 'transcript'
      ELSE 'text'
    END
  )
WHERE question ~* '^\s*(Teks|Transkrip):'
  AND question ~* 'Pertanyaan:';

CREATE INDEX idx_questions_published_pool
  ON public.questions (category_id, difficulty, id)
  WHERE status = 'published';

CREATE UNIQUE INDEX questions_content_hash_unique
  ON public.questions (content_hash)
  WHERE content_hash IS NOT NULL;

CREATE TABLE public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  mode TEXT NOT NULL DEFAULT 'normal'
    CHECK (mode IN ('normal', 'timed', 'adaptive', 'challenge', 'retry')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'submitted', 'expired')),
  question_count INTEGER NOT NULL DEFAULT 20,
  source_attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE RESTRICT,
  challenge_token TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  attempt_id UUID UNIQUE REFERENCES public.quiz_attempts(id) ON DELETE RESTRICT,
  correct_answers INTEGER,
  score NUMERIC(5,2),
  CHECK (
    (mode = 'retry' AND question_count BETWEEN 1 AND 20)
    OR (mode <> 'retry' AND question_count = 20)
  ),
  CHECK (
    (mode = 'retry' AND source_attempt_id IS NOT NULL AND challenge_token IS NULL)
    OR (mode = 'challenge' AND source_attempt_id IS NOT NULL AND challenge_token IS NOT NULL)
    OR (mode IN ('normal', 'timed', 'adaptive')
      AND source_attempt_id IS NULL AND challenge_token IS NULL)
  ),
  CHECK (challenge_token IS NULL OR challenge_token ~ '^[A-Za-z0-9_-]{22}$'),
  CHECK (
    (mode = 'timed' AND expires_at = started_at + INTERVAL '5 minutes')
    OR (mode <> 'timed' AND expires_at = started_at + INTERVAL '30 minutes')
  ),
  CHECK (correct_answers IS NULL OR correct_answers BETWEEN 0 AND question_count),
  CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  CHECK (
    (status = 'submitted' AND submitted_at IS NOT NULL AND attempt_id IS NOT NULL
      AND correct_answers IS NOT NULL AND score IS NOT NULL)
    OR
    (status <> 'submitted' AND submitted_at IS NULL AND attempt_id IS NULL
      AND correct_answers IS NULL AND score IS NULL)
  )
);

CREATE TABLE public.quiz_session_questions (
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 20),
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer')),
  legacy_question TEXT NOT NULL,
  stimulus TEXT,
  prompt TEXT,
  options JSONB,
  content_metadata JSONB NOT NULL DEFAULT '{}'::JSONB
    CHECK (jsonb_typeof(content_metadata) = 'object'),
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  answered_at TIMESTAMPTZ,
  PRIMARY KEY (session_id, question_id),
  UNIQUE (session_id, position),
  CHECK ((user_answer IS NULL AND answered_at IS NULL)
    OR (user_answer IS NOT NULL AND answered_at IS NOT NULL))
);

CREATE UNIQUE INDEX quiz_sessions_one_active_standard
  ON public.quiz_sessions (user_id, category_id, difficulty, mode)
  WHERE status = 'active' AND mode IN ('normal', 'timed', 'adaptive');

CREATE UNIQUE INDEX quiz_sessions_one_active_retry
  ON public.quiz_sessions (user_id, source_attempt_id)
  WHERE status = 'active' AND mode = 'retry';

CREATE UNIQUE INDEX quiz_sessions_one_active_challenge
  ON public.quiz_sessions (user_id, challenge_token)
  WHERE status = 'active' AND mode = 'challenge';

CREATE INDEX quiz_sessions_user_started
  ON public.quiz_sessions (user_id, started_at DESC);

CREATE INDEX quiz_session_questions_question_history
  ON public.quiz_session_questions (question_id, session_id);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_session_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY quiz_sessions_select_own
  ON public.quiz_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- quiz_session_questions contains the server-only answer-key snapshot. It has
-- RLS enabled with no client policy; clients receive sanitized rows via RPC.
REVOKE ALL ON TABLE public.quiz_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.quiz_session_questions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.quiz_sessions TO authenticated;

CREATE OR REPLACE FUNCTION public.start_quiz_session(
  p_category_id UUID,
  p_difficulty TEXT,
  p_mode TEXT DEFAULT 'normal',
  p_source_attempt_id UUID DEFAULT NULL,
  p_challenge_token TEXT DEFAULT NULL
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
  v_category_id UUID;
  v_difficulty TEXT;
  v_source_attempt_id UUID;
  v_challenge_token TEXT;
  v_question_ids UUID[];
  v_question_count INTEGER;
  v_pool_count INTEGER;
  v_inserted_count INTEGER;
  v_duration INTERVAL;
  v_questions JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF p_mode IS NULL OR p_mode NOT IN ('normal', 'timed', 'adaptive', 'challenge', 'retry') THEN
    RAISE EXCEPTION 'Invalid quiz mode' USING ERRCODE = '22023';
  END IF;

  -- Serialize every start for this user so concurrent modes cannot bypass the
  -- per-user cooldown before either transaction commits its served questions.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::TEXT, 0));

  UPDATE public.quiz_sessions AS s
  SET status = 'expired'
  WHERE s.user_id = v_user_id
    AND s.status = 'active'
    AND s.expires_at <= v_now;

  IF p_mode IN ('normal', 'timed', 'adaptive') THEN
    IF p_source_attempt_id IS NOT NULL OR p_challenge_token IS NOT NULL THEN
      RAISE EXCEPTION 'Source attempt and challenge token are not valid for % mode', p_mode
        USING ERRCODE = '22023';
    END IF;
    IF p_difficulty IS NULL OR p_difficulty NOT IN ('easy', 'medium', 'hard') THEN
      RAISE EXCEPTION 'Invalid difficulty' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.categories AS c WHERE c.id = p_category_id) THEN
      RAISE EXCEPTION 'Category not found' USING ERRCODE = 'P0002';
    END IF;
    v_category_id := p_category_id;
    v_difficulty := p_difficulty;
    v_question_count := 20;
  ELSIF p_mode = 'retry' THEN
    IF p_source_attempt_id IS NULL OR p_challenge_token IS NOT NULL THEN
      RAISE EXCEPTION 'Retry mode requires only a source attempt'
        USING ERRCODE = '22023';
    END IF;

    SELECT qa.category_id, qa.difficulty
    INTO v_category_id, v_difficulty
    FROM public.quiz_attempts AS qa
    WHERE qa.id = p_source_attempt_id
      AND qa.user_id = v_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Retry source attempt not found or unauthorized'
        USING ERRCODE = 'P0002';
    END IF;

    v_source_attempt_id := p_source_attempt_id;
    SELECT ARRAY(
      SELECT source_answers.question_id
      FROM (
        SELECT qa.question_id, MIN(qa.created_at) AS first_answered_at
        FROM public.quiz_answers AS qa
        JOIN public.questions AS q ON q.id = qa.question_id
        WHERE qa.attempt_id = v_source_attempt_id
          AND qa.is_correct = FALSE
        GROUP BY qa.question_id
        ORDER BY MIN(qa.created_at), qa.question_id
      ) AS source_answers
    ) INTO v_question_ids;

    v_question_count := CARDINALITY(v_question_ids);
    IF v_question_count = 0 THEN
      RAISE EXCEPTION 'Retry source attempt has no incorrect questions'
        USING ERRCODE = '22023';
    END IF;
    IF v_question_count > 20 THEN
      RAISE EXCEPTION 'Retry source attempt has more than 20 incorrect questions'
        USING ERRCODE = '22023';
    END IF;
  ELSE
    IF p_challenge_token IS NULL OR BTRIM(p_challenge_token) = ''
       OR p_source_attempt_id IS NOT NULL THEN
      RAISE EXCEPTION 'Challenge mode requires only an active challenge token'
        USING ERRCODE = '22023';
    END IF;

    SELECT qs.attempt_id, qs.category_id, qs.difficulty, qs.token
    INTO v_source_attempt_id, v_category_id, v_difficulty, v_challenge_token
    FROM public.quiz_shares AS qs
    WHERE qs.token = p_challenge_token
      AND qs.revoked_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Active challenge token not found' USING ERRCODE = 'P0002';
    END IF;

    SELECT ARRAY(
      SELECT source_answers.question_id
      FROM (
        SELECT qa.question_id, MIN(qa.created_at) AS first_answered_at
        FROM public.quiz_answers AS qa
        JOIN public.questions AS q ON q.id = qa.question_id
        WHERE qa.attempt_id = v_source_attempt_id
        GROUP BY qa.question_id
        ORDER BY MIN(qa.created_at), qa.question_id
        LIMIT 20
      ) AS source_answers
    ) INTO v_question_ids;

    IF CARDINALITY(v_question_ids) < 20 THEN
      RAISE EXCEPTION 'Challenge source attempt must contain at least 20 distinct questions (found %)',
        CARDINALITY(v_question_ids) USING ERRCODE = '22023';
    END IF;
    v_question_count := 20;
  END IF;

  SELECT *
  INTO v_session
  FROM public.quiz_sessions AS s
  WHERE s.user_id = v_user_id
    AND s.category_id = v_category_id
    AND s.difficulty = v_difficulty
    AND s.mode = p_mode
    AND s.source_attempt_id IS NOT DISTINCT FROM v_source_attempt_id
    AND s.challenge_token IS NOT DISTINCT FROM v_challenge_token
    AND s.status = 'active'
    AND s.expires_at > v_now
  FOR UPDATE;

  IF NOT FOUND THEN
    IF p_mode IN ('normal', 'timed', 'adaptive') THEN
      SELECT COUNT(*)
      INTO v_pool_count
      FROM public.questions AS q
      WHERE q.category_id = v_category_id
        AND q.difficulty = v_difficulty
        AND q.status = 'published';

      IF v_pool_count < 20 THEN
        RAISE EXCEPTION 'At least 20 published questions are required (found %)', v_pool_count
          USING ERRCODE = 'P0001';
      END IF;

      SELECT ARRAY(
        SELECT pool.question_id
        FROM (
          SELECT
            q.id AS question_id,
            history.last_served_at
          FROM public.questions AS q
          LEFT JOIN LATERAL (
            SELECT MAX(s.started_at) AS last_served_at
            FROM public.quiz_session_questions AS sq
            JOIN public.quiz_sessions AS s ON s.id = sq.session_id
            WHERE sq.question_id = q.id
              AND s.user_id = v_user_id
          ) AS history ON TRUE
          WHERE q.category_id = v_category_id
            AND q.difficulty = v_difficulty
            AND q.status = 'published'
        ) AS pool
        ORDER BY
          CASE
            WHEN pool.last_served_at IS NULL
              OR pool.last_served_at <= v_now - INTERVAL '5 minutes' THEN 0
            ELSE 1
          END,
          CASE
            WHEN pool.last_served_at IS NULL
              OR pool.last_served_at <= v_now - INTERVAL '5 minutes' THEN random()
          END,
          pool.last_served_at ASC NULLS FIRST,
          pool.question_id
        LIMIT 20
      ) INTO v_question_ids;
    END IF;

    v_duration := CASE
      WHEN p_mode = 'timed' THEN INTERVAL '5 minutes'
      ELSE INTERVAL '30 minutes'
    END;

    INSERT INTO public.quiz_sessions (
      user_id, category_id, difficulty, mode, question_count,
      source_attempt_id, challenge_token, started_at, expires_at
    )
    VALUES (
      v_user_id, v_category_id, v_difficulty, p_mode, v_question_count,
      v_source_attempt_id, v_challenge_token, v_now, v_now + v_duration
    )
    RETURNING * INTO v_session;

    WITH positioned AS (
      SELECT
        selected.question_id,
        ROW_NUMBER() OVER (ORDER BY random(), selected.question_id)::INTEGER AS position
      FROM unnest(v_question_ids) AS selected(question_id)
    )
    INSERT INTO public.quiz_session_questions (
      session_id, question_id, position, question_type, legacy_question,
      stimulus, prompt, options, content_metadata, correct_answer
    )
    SELECT
      v_session.id,
      q.id,
      p.position,
      q.type,
      q.question,
      q.stimulus,
      COALESCE(q.prompt, q.question),
      CASE
        WHEN q.options IS NULL OR jsonb_typeof(q.options) <> 'array' THEN q.options
        ELSE (
          SELECT COALESCE(jsonb_agg(option_value ORDER BY option_random), '[]'::JSONB)
          FROM (
            SELECT option_value, random() AS option_random
            FROM jsonb_array_elements(q.options) AS option_rows(option_value)
          ) AS randomized_options
        )
      END,
      q.content_metadata - 'correct_answer' - 'explanation',
      q.correct_answer
    FROM positioned AS p
    JOIN public.questions AS q ON q.id = p.question_id;

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    IF v_inserted_count <> v_question_count THEN
      RAISE EXCEPTION 'Failed to create a %-question session', v_question_count;
    END IF;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'question_id', sq.question_id,
      'position', sq.position,
      'type', sq.question_type,
      'question', sq.legacy_question,
      'stimulus', sq.stimulus,
      'prompt', sq.prompt,
      'options', sq.options,
      'content_metadata', sq.content_metadata,
      'user_answer', sq.user_answer
    ) ORDER BY sq.position
  ), '[]'::JSONB)
  INTO v_questions
  FROM public.quiz_session_questions AS sq
  WHERE sq.session_id = v_session.id;

  RETURN jsonb_build_object(
    'session_id', v_session.id,
    'category_id', v_session.category_id,
    'difficulty', v_session.difficulty,
    'mode', v_session.mode,
    'question_count', v_session.question_count,
    'source_attempt_id', v_session.source_attempt_id,
    'challenge_token', v_session.challenge_token,
    'status', v_session.status,
    'started_at', v_session.started_at,
    'expires_at', v_session.expires_at,
    'questions', v_questions
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.save_quiz_session_answer(
  p_session_id UUID,
  p_question_id UUID,
  p_user_answer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.quiz_sessions%ROWTYPE;
  v_answered_at TIMESTAMPTZ := clock_timestamp();
  v_question_type TEXT;
  v_options JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF p_user_answer IS NULL OR BTRIM(p_user_answer) = '' THEN
    RAISE EXCEPTION 'Answer must not be empty' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_session
  FROM public.quiz_sessions AS s
  WHERE s.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND OR v_session.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Quiz session not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_session.status <> 'active' THEN
    RAISE EXCEPTION 'Quiz session is not active' USING ERRCODE = '55000';
  END IF;
  IF v_session.expires_at <= v_answered_at THEN
    RAISE EXCEPTION 'Quiz session has expired' USING ERRCODE = '55000';
  END IF;

  SELECT sq.question_type, sq.options
  INTO v_question_type, v_options
  FROM public.quiz_session_questions AS sq
  WHERE sq.session_id = p_session_id
    AND sq.question_id = p_question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question does not belong to this session' USING ERRCODE = '22023';
  END IF;
  IF v_question_type = 'multiple_choice' AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(v_options) = 'array' THEN v_options ELSE '[]'::JSONB END
    ) AS option_rows(option_value)
    WHERE option_value->>'label' = p_user_answer
  ) THEN
    RAISE EXCEPTION 'Answer is not a valid option label for this question'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.quiz_session_questions AS sq
  SET user_answer = p_user_answer,
      answered_at = v_answered_at
  WHERE sq.session_id = p_session_id
    AND sq.question_id = p_question_id;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'question_id', p_question_id,
    'user_answer', p_user_answer,
    'answered_at', v_answered_at
  );
END;
$$;

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
  v_correct_count INTEGER;
  v_attempt_id UUID;
  v_score NUMERIC(5,2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_session
  FROM public.quiz_sessions AS s
  WHERE s.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND OR v_session.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Quiz session not found' USING ERRCODE = 'P0002';
  END IF;

  -- A repeated submission returns the original immutable result.
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
      RAISE EXCEPTION 'Each answer requires question_id and non-empty user_answer strings'
        USING ERRCODE = '22023';
    END IF;

    SELECT COUNT(*), COUNT(DISTINCT answer->>'question_id')
    INTO v_answer_count, v_correct_count
    FROM jsonb_array_elements(p_answers) AS answer_rows(answer);

    IF v_answer_count <> v_correct_count THEN
      RAISE EXCEPTION 'Duplicate question_id in answers' USING ERRCODE = '22023';
    END IF;
    IF v_answer_count <> v_session.question_count THEN
      RAISE EXCEPTION 'Exactly % answers are required', v_session.question_count
        USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_answers) AS answer_rows(answer)
      LEFT JOIN public.quiz_session_questions AS sq
        ON sq.session_id = p_session_id
       AND sq.question_id = (answer->>'question_id')::UUID
      WHERE sq.question_id IS NULL
    ) THEN
      RAISE EXCEPTION 'Answer contains a question outside this session'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.quiz_session_questions AS sq
    SET user_answer = answer_rows.answer->>'user_answer',
        answered_at = v_now
    FROM jsonb_array_elements(p_answers) AS answer_rows(answer)
    WHERE sq.session_id = p_session_id
      AND sq.question_id = (answer_rows.answer->>'question_id')::UUID;
  END IF;

  SELECT COUNT(*)
  INTO v_answer_count
  FROM public.quiz_session_questions AS sq
  WHERE sq.session_id = p_session_id
    AND sq.user_answer IS NOT NULL;

  IF v_answer_count <> v_session.question_count THEN
    RAISE EXCEPTION 'All % session questions must be answered', v_session.question_count
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.quiz_session_questions AS sq
    WHERE sq.session_id = p_session_id
      AND sq.question_type = 'multiple_choice'
      AND sq.user_answer <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(sq.options) = 'array' THEN sq.options
            ELSE '[]'::JSONB
          END
        ) AS option_rows(option_value)
        WHERE option_value->>'label' = sq.user_answer
      )
  ) THEN
    RAISE EXCEPTION 'A multiple-choice answer is not a valid snapshot option label'
      USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*)
  INTO v_correct_count
  FROM public.quiz_session_questions AS sq
  WHERE sq.session_id = p_session_id
    AND LOWER(BTRIM(sq.correct_answer)) = LOWER(BTRIM(sq.user_answer));

  v_score := ROUND((v_correct_count::NUMERIC / v_session.question_count) * 100, 2);

  INSERT INTO public.quiz_attempts (
    user_id, category_id, difficulty, total_questions,
    correct_answers, score, completed_at
  )
  VALUES (
    v_user_id, v_session.category_id, v_session.difficulty,
    v_session.question_count, v_correct_count, v_score, v_now
  )
  RETURNING id INTO v_attempt_id;

  INSERT INTO public.quiz_answers (
    attempt_id, question_id, user_answer, is_correct
  )
  SELECT
    v_attempt_id,
    sq.question_id,
    sq.user_answer,
    LOWER(BTRIM(sq.correct_answer)) = LOWER(BTRIM(sq.user_answer))
  FROM public.quiz_session_questions AS sq
  WHERE sq.session_id = p_session_id
  ORDER BY sq.position;

  IF v_session.mode <> 'retry' THEN
    INSERT INTO public.learning_streaks AS ls (user_id, date, questions_done)
    VALUES (v_user_id, CURRENT_DATE, v_session.question_count)
    ON CONFLICT (user_id, date) DO UPDATE
    SET questions_done = ls.questions_done + EXCLUDED.questions_done;
  END IF;

  UPDATE public.quiz_sessions AS s
  SET status = 'submitted',
      submitted_at = v_now,
      attempt_id = v_attempt_id,
      correct_answers = v_correct_count,
      score = v_score
  WHERE s.id = p_session_id;

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

REVOKE ALL ON FUNCTION public.start_quiz_session(UUID, TEXT, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_quiz_session_answer(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_quiz_session(UUID, JSONB) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.start_quiz_session(UUID, TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_quiz_session_answer(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz_session(UUID, JSONB) TO authenticated;
