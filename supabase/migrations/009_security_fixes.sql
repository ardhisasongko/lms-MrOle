-- Migration 009: Security fixes
-- Fixes privilege escalation, data exposure, function hardening

-- ============================================================
-- 1. FIX PRIVILEGE ESCALATION (Review 2.1)
-- ============================================================

-- Drop the vulnerable policy (allows changing any column including role)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Recreate with explicit WITH CHECK to prevent role changing
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Guard trigger: prevent non-admin from changing role column
CREATE OR REPLACE FUNCTION public.guard_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_role ON profiles;
CREATE TRIGGER profiles_guard_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_role_change();

-- ============================================================
-- 2. FIX QUESTIONS DATA EXPOSURE (Review 2.2) — partial fix
-- Create public view for student access (migration to switch later)
-- ============================================================

CREATE OR REPLACE VIEW questions_public
WITH (security_invoker = on)
AS
  SELECT id, category_id, difficulty, type, question, options
  FROM questions;

-- ============================================================
-- 3. FIX submit_quiz FUNCTION (Review 2.3)
-- ============================================================

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
  ans JSONB;
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

-- ============================================================
-- 4. FIX is_admin() — add search_path (Review 2.3)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ============================================================
-- 5. FIX handle_new_user() — add search_path (Review 2.3)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- 6. FIX log_admin_action() — add is_admin check + search_path (Review 2.3)
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can log actions';
  END IF;
  INSERT INTO admin_logs (admin_id, action, table_name, record_id, details)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_details)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ============================================================
-- 7. ADD MISSING INDEXES (Review 2.6)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_attempts_user_completed
  ON quiz_attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_user_cat_diff
  ON quiz_attempts(user_id, category_id, difficulty, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_cat_diff
  ON questions(category_id, difficulty);

-- ============================================================
-- 8. updated_at TRIGGER (Review 2.6)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_update_updated_at ON profiles;
CREATE TRIGGER profiles_update_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS questions_update_updated_at ON questions;
CREATE TRIGGER questions_update_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
