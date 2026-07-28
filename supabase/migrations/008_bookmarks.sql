-- ============================================================
-- MIGRATION 008: Bookmarks Table
-- ============================================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_question ON bookmarks(question_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- User can insert own bookmarks
DO $$ BEGIN
  CREATE POLICY "bookmarks_insert_own" ON bookmarks
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User can select own bookmarks
DO $$ BEGIN
  CREATE POLICY "bookmarks_select_own" ON bookmarks
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User can delete own bookmarks
DO $$ BEGIN
  CREATE POLICY "bookmarks_delete_own" ON bookmarks
    FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin can read all bookmarks
DO $$ BEGIN
  CREATE POLICY "bookmarks_select_admin" ON bookmarks
    FOR SELECT USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
