-- ============================================================
-- FULL SCHEMA: LMS Mr Ole
-- Gabungan Migration 001-007
-- Jalankan di Supabase SQL Editor untuk setup database baru
-- ============================================================

-- ============================================================
-- MIGRATION 001: Initial Schema
-- ============================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic user policies
DO $$ BEGIN
  CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "categories_select_all" ON categories
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. QUESTIONS
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'short_answer')),
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "questions_select_all" ON questions
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. QUIZ_ATTEMPTS
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_category ON quiz_attempts(category_id);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "quiz_attempts_insert_own" ON quiz_attempts
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "quiz_attempts_select_own" ON quiz_attempts
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. QUIZ_ANSWERS
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON quiz_answers(attempt_id);

ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "quiz_answers_insert_own" ON quiz_answers
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM quiz_attempts WHERE id = attempt_id AND user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "quiz_answers_select_own" ON quiz_answers
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM quiz_attempts WHERE id = attempt_id AND user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. LEARNING_STREAKS
CREATE TABLE IF NOT EXISTS learning_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  questions_done INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON learning_streaks(user_id);

ALTER TABLE learning_streaks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "learning_streaks_insert_own" ON learning_streaks
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "learning_streaks_select_own" ON learning_streaks
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- MIGRATION 002: Admin Role (role column)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
-- Note: CHECK constraint handled by is_admin() function instead


-- ============================================================
-- MIGRATION 003: Avatars Storage
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- MIGRATION 006 (PART 1): is_admin() Helper Function
-- Must be created BEFORE admin policies
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;


-- ============================================================
-- MIGRATION 004: Server-Side Business Logic
-- ============================================================

-- 1. SUBMIT QUIZ FUNCTION
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
  SELECT v_attempt_id, (a->>'question_id')::UUID, a->>'user_answer',
         lower(trim(ques.correct_answer)) = lower(trim(a->>'user_answer'))
  FROM jsonb_array_elements(p_answers) a
  JOIN questions ques ON ques.id = (a->>'question_id')::UUID;

  INSERT INTO learning_streaks (user_id, date, questions_done)
  VALUES (p_user_id, CURRENT_DATE, total_count)
  ON CONFLICT (user_id, date) DO UPDATE SET questions_done = learning_streaks.questions_done + total_count;

  RETURN QUERY SELECT v_attempt_id,
    ROUND((correct_count::DECIMAL / total_count) * 100, 2),
    correct_count, total_count;
END;
$$;

-- 2. LEADERBOARD RANKING VIEW
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

-- 3. CALCULATE STREAK FUNCTION
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


-- ============================================================
-- MIGRATION 005 + 006: Admin RLS Policies (Final State)
-- Using is_admin() helper to avoid recursion
-- ============================================================

-- Profiles: admin can read all
DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
  CREATE POLICY "profiles_select_admin" ON profiles
    FOR SELECT USING (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Profiles: admin can update any
DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
  CREATE POLICY "profiles_update_admin" ON profiles
    FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Profiles: upsert own (for demo/auth)
DO $$ BEGIN
  CREATE POLICY "profiles_upsert_own" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Quiz attempts: admin can read all
DO $$ BEGIN
  DROP POLICY IF EXISTS "quiz_attempts_select_admin" ON quiz_attempts;
  CREATE POLICY "quiz_attempts_select_admin" ON quiz_attempts
    FOR SELECT USING (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Quiz answers: admin can read all
DO $$ BEGIN
  DROP POLICY IF EXISTS "quiz_answers_select_admin" ON quiz_answers;
  CREATE POLICY "quiz_answers_select_admin" ON quiz_answers
    FOR SELECT USING (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Learning streaks: admin can read all
DO $$ BEGIN
  DROP POLICY IF EXISTS "learning_streaks_select_admin" ON learning_streaks;
  CREATE POLICY "learning_streaks_select_admin" ON learning_streaks
    FOR SELECT USING (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Categories: admin CRUD
DO $$ BEGIN
  DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
  CREATE POLICY "categories_insert_admin" ON categories
    FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "categories_update_admin" ON categories;
  CREATE POLICY "categories_update_admin" ON categories
    FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
  CREATE POLICY "categories_delete_admin" ON categories
    FOR DELETE USING (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Questions: admin CRUD
DO $$ BEGIN
  DROP POLICY IF EXISTS "questions_insert_admin" ON questions;
  CREATE POLICY "questions_insert_admin" ON questions
    FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "questions_update_admin" ON questions;
  CREATE POLICY "questions_update_admin" ON questions
    FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "questions_delete_admin" ON questions;
  CREATE POLICY "questions_delete_admin" ON questions
    FOR DELETE USING (public.is_admin());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;


-- ============================================================
-- MIGRATION 007: Admin Audit Log
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "admin_logs_select" ON admin_logs
    FOR SELECT USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_logs_insert" ON admin_logs
    FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Log helper function
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO admin_logs (admin_id, action, table_name, record_id, details)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_details)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


-- ============================================================
-- SETUP SELESAI
-- ============================================================
-- Untuk set admin pertama, uncomment dan jalankan:
-- UPDATE profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'email-kamu@example.com');
