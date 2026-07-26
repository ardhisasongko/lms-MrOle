-- Migration 004: Server-side business logic
-- 1. submit_quiz() — validates answers & calculates score on the server
-- 2. leaderboard_ranking view — GROUP BY + AVG in SQL
-- 3. calculate_streak() — uses generate_series

-- 1. SUBMIT QUIZ
-- Validates answers server-side so scores can't be manipulated client-side.
-- Usage: SELECT * FROM submit_quiz(
--   'user-uuid', 'category-uuid', 'easy',
--   '[{"question_id":"...","user_answer":"A"}, ...]'::jsonb
-- );
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
AS $$
DECLARE
  q RECORD;
  ans JSONB;
  correct_count INT := 0;
  total_count INT;
  v_attempt_id UUID;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'User ID mismatch';
  END IF;
  total_count := jsonb_array_length(p_answers);

  FOR ans IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    SELECT * INTO q FROM questions WHERE id = (ans->>'question_id')::UUID;
    IF FOUND AND lower(trim(q.correct_answer)) = lower(trim(ans->>'user_answer')) THEN
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

-- 2. LEADERBOARD RANKING VIEW
-- Aggregates scores directly in the database.
CREATE OR REPLACE VIEW leaderboard_ranking AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.avatar_url,
  COUNT(qa.id) AS sessions,
  SUM(qa.total_questions) AS total_questions,
  ROUND(AVG(qa.score), 2) AS avg_score,
  ROW_NUMBER() OVER (ORDER BY AVG(qa.score) DESC, SUM(qa.total_questions) DESC) AS rank
FROM profiles p
JOIN quiz_attempts qa ON qa.user_id = p.id
GROUP BY p.id, p.full_name, p.avatar_url
ORDER BY avg_score DESC, total_questions DESC;

-- 3. CALCULATE STREAK
-- Returns the current streak count using generate_series.
CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  streak_count INT := 0;
  expected_date DATE := CURRENT_DATE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM learning_streaks WHERE user_id = p_user_id AND date = CURRENT_DATE) THEN
    expected_date := CURRENT_DATE - INTERVAL '1 day';
  END IF;

  WHILE EXISTS (SELECT 1 FROM learning_streaks WHERE user_id = p_user_id AND date = expected_date) LOOP
    streak_count := streak_count + 1;
    expected_date := expected_date - INTERVAL '1 day';
  END LOOP;

  RETURN streak_count;
END;
$$;
