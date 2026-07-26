-- Migration 006: Fix infinite RLS recursion on profiles policies
-- Subquerying profiles FROM a policy ON profiles creates infinite recursion.
-- Fix: use a SECURITY DEFINER helper function that bypasses RLS.

-- 1. Create helper function (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 2. Drop the broken policies on profiles (they cause infinite recursion)
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- 3. Recreate using the helper function
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (public.is_admin());

-- 4. Update other admin policies to use the helper (cleaner, avoids future recursion)
DROP POLICY IF EXISTS "quiz_attempts_select_admin" ON quiz_attempts;
CREATE POLICY "quiz_attempts_select_admin" ON quiz_attempts
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "quiz_answers_select_admin" ON quiz_answers;
CREATE POLICY "quiz_answers_select_admin" ON quiz_answers
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "learning_streaks_select_admin" ON learning_streaks;
CREATE POLICY "learning_streaks_select_admin" ON learning_streaks
  FOR SELECT USING (public.is_admin());

-- 5. Categories & questions admin policies from migration 002 also subquery profiles,
--    but they are NOT on profiles so they don't recurse. Still cleaner to use helper.
DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin" ON categories
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin" ON categories
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin" ON categories
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "questions_insert_admin" ON questions;
CREATE POLICY "questions_insert_admin" ON questions
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "questions_update_admin" ON questions;
CREATE POLICY "questions_update_admin" ON questions
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "questions_delete_admin" ON questions;
CREATE POLICY "questions_delete_admin" ON questions
  FOR DELETE USING (public.is_admin());
