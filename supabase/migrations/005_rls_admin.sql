-- Migration 005: Missing admin RLS policies & storage cleanup
-- Adds admin SELECT policies, storage DELETE policy, and profile upsert policy

-- Ensure role column exists (idempotent if 002 already ran)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 1. Profiles: admin can read all (for dashboard user management)
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Profiles: admin can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Quiz attempts: admin can read all (for dashboard stats)
CREATE POLICY "quiz_attempts_select_admin" ON quiz_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Quiz answers: admin can read all
CREATE POLICY "quiz_answers_select_admin" ON quiz_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Learning streaks: admin can read all
CREATE POLICY "learning_streaks_select_admin" ON learning_streaks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Storage: users can delete own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- 7. Profiles: allow upsert via trigger (for handle_new_user + demo mode)
-- Note: the handle_new_user trigger is SECURITY DEFINER so RLS is bypassed for inserts.
-- This policy ensures demo/authenticated users can upsert their own profile.
CREATE POLICY "profiles_upsert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());
