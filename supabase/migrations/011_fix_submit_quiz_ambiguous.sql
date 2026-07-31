-- Migration 011: Fix "column reference ans is ambiguous" in submit_quiz
-- Cause: PL/pgSQL variable `ans` collides with the SQL range alias `ans`
-- in the quiz_answers INSERT..SELECT. Rename loop variable to v_ans.

CREATE OR REPLACE FUNCTION submit_quiz(
  p_user_id UUID,
  p_category_id UUID,
  p_difficulty TEXT,
  p_answers JSONB
)
RETURNS TABLE (
  attempt_id UUID,
  score DECIMAL(5,2),
  correct INT,
  total INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  q RECORD;
  v_ans JSONB;
  correct_count INT := 0;
  total_count INT;
  v_attempt_id UUID;
  v_question_ids UUID[];
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'User ID mismatch';
  END IF;

  total_count := jsonb_array_length(p_answers);

  IF total_count = 0 THEN
    RAISE EXCEPTION 'No answers provided';
  END IF;

  -- Deduplicate question_ids
  SELECT ARRAY_AGG(DISTINCT (ans->>'question_id')::UUID)
  INTO v_question_ids
  FROM jsonb_array_elements(p_answers) ans;

  -- Validate all questions exist and match category+difficulty
  IF EXISTS (
    SELECT 1 FROM UNNEST(v_question_ids) qid
    WHERE NOT EXISTS (
      SELECT 1 FROM questions
      WHERE id = qid AND category_id = p_category_id AND difficulty = p_difficulty
    )
  ) THEN
    RAISE EXCEPTION 'Invalid question_id for given category/difficulty';
  END IF;

  FOR v_ans IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    SELECT * INTO q FROM questions WHERE id = (v_ans->>'question_id')::UUID;
    IF FOUND AND lower(trim(q.correct_answer)) = lower(trim(v_ans->>'user_answer')) THEN
      correct_count := correct_count + 1;
    END IF;
  END LOOP;

  INSERT INTO quiz_attempts (user_id, category_id, difficulty, total_questions, correct_answers, score)
  VALUES (p_user_id, p_category_id, p_difficulty, total_count, correct_count,
          ROUND((correct_count::DECIMAL / total_count) * 100, 2))
  RETURNING id INTO v_attempt_id;

  INSERT INTO quiz_answers (attempt_id, question_id, user_answer, is_correct)
  SELECT v_attempt_id, (ans->>'question_id')::UUID, ans->>'user_answer',
         lower(trim(q.correct_answer)) = lower(trim(ans->>'user_answer'))
  FROM jsonb_array_elements(p_answers) ans
  JOIN questions q ON q.id = (ans->>'question_id')::UUID;

  INSERT INTO learning_streaks (user_id, date, questions_done)
  VALUES (p_user_id, CURRENT_DATE, total_count)
  ON CONFLICT (user_id, date) DO UPDATE SET questions_done = learning_streaks.questions_done + total_count;

  RETURN QUERY SELECT v_attempt_id,
    ROUND((correct_count::DECIMAL / total_count) * 100, 2),
    correct_count, total_count;
END;
$$;
