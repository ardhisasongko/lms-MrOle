-- Migration 202608030001: Mode Kelas (Fase 4)
-- Guru/pembuat kelas membuat kelas, membagikan kode gabung 6 karakter,
-- memberi tugas (kategori + difficulty + tenggat), dan melihat
-- leaderboard khusus anggota kelasnya.
--
-- Model kepemilikan berbasis OWNER (bukan role): siapa pun yang membuat
-- kelas adalah pemiliknya. Role di tabel profiles tidak dijamin memiliki
-- nilai 'guru', jadi mode kelas tidak bergantung pada role.
--
-- File ini IDEMPOTEN sebisa mungkin dan HARUS dijalankan manual di
-- Supabase SQL Editor (migrasi repo tidak ter-deploy otomatis).
-- Frontend bersifat defensif: bila tabel/RPC ini belum ada, halaman
-- kelas menampilkan status "belum diaktifkan" dan situs tetap normal.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- 1. TABEL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  join_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT classes_join_code_length CHECK (char_length(join_code) = 6),
  CONSTRAINT classes_name_not_blank CHECK (char_length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS public.class_members (
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (class_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  question_count INT NOT NULL DEFAULT 20,
  due_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT class_assignments_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard')),
  CONSTRAINT class_assignments_question_count CHECK (question_count BETWEEN 1 AND 100),
  CONSTRAINT class_assignments_title_not_blank CHECK (char_length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_classes_owner_created
  ON public.classes(owner_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_join_code
  ON public.classes(join_code);
CREATE INDEX IF NOT EXISTS idx_class_members_student
  ON public.class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_class_created
  ON public.class_assignments(class_id, created_at DESC);

-- ============================================================
-- 2. HELPER KEPEMILIKAN/KEANGGOTAAN (SECURITY DEFINER)
-- Dipakai di dalam policy agar tidak terjadi rekursi RLS antar
-- tabel classes <-> class_members (preseden: public.is_admin()).
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_class_owner(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = p_class_id AND student_id = auth.uid()
  );
$$;

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;

-- classes: pemilik CRUD kelasnya; anggota hanya membaca.
DROP POLICY IF EXISTS "classes_select_owner_or_member" ON public.classes;
CREATE POLICY "classes_select_owner_or_member" ON public.classes
  FOR SELECT USING (
    owner_id = auth.uid() OR public.is_class_member(id)
  );

DROP POLICY IF EXISTS "classes_insert_own" ON public.classes;
CREATE POLICY "classes_insert_own" ON public.classes
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "classes_update_owner" ON public.classes;
CREATE POLICY "classes_update_owner" ON public.classes
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "classes_delete_owner" ON public.classes;
CREATE POLICY "classes_delete_owner" ON public.classes
  FOR DELETE USING (owner_id = auth.uid());

-- class_members: TIDAK ada policy INSERT untuk klien — satu-satunya
-- jalan masuk adalah RPC join_class_by_code (yang memvalidasi kode),
-- sehingga tidak ada yang bisa gabung kelas tanpa kode.
DROP POLICY IF EXISTS "class_members_select_involved" ON public.class_members;
CREATE POLICY "class_members_select_involved" ON public.class_members
  FOR SELECT USING (
    student_id = auth.uid()
    OR public.is_class_owner(class_id)
    OR public.is_class_member(class_id)
  );

DROP POLICY IF EXISTS "class_members_delete_self_or_owner" ON public.class_members;
CREATE POLICY "class_members_delete_self_or_owner" ON public.class_members
  FOR DELETE USING (
    student_id = auth.uid() OR public.is_class_owner(class_id)
  );

-- class_assignments: pemilik CRUD; anggota membaca tugas kelasnya.
DROP POLICY IF EXISTS "class_assignments_select_owner_or_member" ON public.class_assignments;
CREATE POLICY "class_assignments_select_owner_or_member" ON public.class_assignments
  FOR SELECT USING (
    public.is_class_owner(class_id) OR public.is_class_member(class_id)
  );

DROP POLICY IF EXISTS "class_assignments_insert_owner" ON public.class_assignments;
CREATE POLICY "class_assignments_insert_owner" ON public.class_assignments
  FOR INSERT WITH CHECK (
    public.is_class_owner(class_id) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "class_assignments_update_owner" ON public.class_assignments;
CREATE POLICY "class_assignments_update_owner" ON public.class_assignments
  FOR UPDATE USING (public.is_class_owner(class_id))
  WITH CHECK (public.is_class_owner(class_id));

DROP POLICY IF EXISTS "class_assignments_delete_owner" ON public.class_assignments;
CREATE POLICY "class_assignments_delete_owner" ON public.class_assignments
  FOR DELETE USING (public.is_class_owner(class_id));

-- Grant eksplisit untuk role aplikasi (RLS di atas tetap yang membatasi).
REVOKE ALL ON TABLE public.classes FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.class_members FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.class_assignments FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.class_assignments TO authenticated;
-- class_members: tanpa INSERT/UPDATE untuk klien (gabung hanya via RPC).
GRANT SELECT, DELETE ON TABLE public.class_members TO authenticated;

-- ============================================================
-- 4. RPC: GABUNG KELAS DENGAN KODE
-- ============================================================

CREATE OR REPLACE FUNCTION public.join_class_by_code(p_code TEXT)
RETURNS TABLE (
  class_id UUID,
  name TEXT,
  description TEXT,
  owner_id UUID,
  member_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_code TEXT := upper(trim(COALESCE(p_code, '')));
  v_class public.classes%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_code = '' THEN
    RAISE EXCEPTION 'Kode kelas wajib diisi';
  END IF;

  SELECT * INTO v_class FROM public.classes WHERE join_code = v_code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kode kelas tidak ditemukan';
  END IF;

  IF v_class.owner_id = v_user_id THEN
    RAISE EXCEPTION 'Kamu adalah pemilik kelas ini';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_members.class_id = v_class.id
      AND class_members.student_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Kamu sudah menjadi anggota kelas ini';
  END IF;

  INSERT INTO public.class_members (class_id, student_id)
  VALUES (v_class.id, v_user_id);

  RETURN QUERY
  SELECT
    v_class.id,
    v_class.name,
    v_class.description,
    v_class.owner_id,
    (SELECT COUNT(*) FROM public.class_members cm WHERE cm.class_id = v_class.id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_class_by_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(TEXT) TO authenticated;

-- ============================================================
-- 5. RPC: LEADERBOARD KELAS
-- Hanya pemilik/anggota yang boleh melihat. XP konsisten dengan
-- Dashboard: total jawaban benar x 10.
-- ============================================================

CREATE OR REPLACE FUNCTION public.class_leaderboard(p_class_id UUID)
RETURNS TABLE (
  student_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  quizzes BIGINT,
  avg_score NUMERIC,
  total_questions BIGINT,
  total_xp BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (public.is_class_owner(p_class_id) OR public.is_class_member(p_class_id)) THEN
    RAISE EXCEPTION 'Akses ditolak: bukan pemilik atau anggota kelas ini';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    COUNT(qa.id),
    ROUND(AVG(qa.score), 2),
    COALESCE(SUM(qa.total_questions), 0),
    COALESCE(SUM(qa.correct_answers), 0) * 10
  FROM public.class_members cm
  JOIN public.profiles p ON p.id = cm.student_id
  LEFT JOIN public.quiz_attempts qa ON qa.user_id = cm.student_id
  WHERE cm.class_id = p_class_id
  GROUP BY p.id, p.full_name, p.avatar_url
  ORDER BY AVG(qa.score) DESC NULLS LAST, COUNT(qa.id) DESC, p.full_name ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.class_leaderboard(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.class_leaderboard(UUID) TO authenticated;
