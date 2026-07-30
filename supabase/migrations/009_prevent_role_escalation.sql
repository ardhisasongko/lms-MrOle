-- Migration 009: Cegah privilege escalation lewat kolom profiles.role
--
-- Masalah: policy "profiles_update_own" (migration 001) hanya membatasi BARIS
-- (id = auth.uid()), bukan KOLOM. RLS tidak bisa membatasi kolom, jadi user biasa
-- bisa menjalankan dari browser dengan anon key:
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', <user id sendiri>)
-- dan langsung mendapat akses Panel Admin (is_admin() hanya membaca kolom ini).
--
-- Solusi: trigger yang menolak perubahan role kecuali pelakunya admin.
-- Update dari server (auth.uid() IS NULL, mis. SQL editor / service_role) tetap
-- diizinkan supaya bootstrap admin pertama seperti di migration 002/007 tetap jalan.

CREATE OR REPLACE FUNCTION public.guard_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang boleh mengubah role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_role ON profiles;
CREATE TRIGGER profiles_guard_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_role();

-- Policy update-own tanpa WITH CHECK memakai ulang ekspresi USING; dibuat eksplisit
-- supaya niatnya terbaca dan baris tidak bisa dipindah ke user lain.
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Fungsi SECURITY DEFINER tanpa search_path bisa dibajak lewat schema shadowing.
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.log_admin_action(TEXT, TEXT, UUID, JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION public.submit_quiz(UUID, UUID, TEXT, JSONB) SET search_path = public, pg_temp;
