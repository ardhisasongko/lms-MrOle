-- Authorize storage cleanup, avoid role-update lock inversion, and preserve audit actors.

CREATE OR REPLACE FUNCTION public.lock_admin_role_governance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('admin-role-governance', 0));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS profiles_lock_admin_role ON public.profiles;
CREATE TRIGGER profiles_lock_admin_role
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.lock_admin_role_governance();

CREATE OR REPLACE FUNCTION public.guard_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change role';
    END IF;

    IF OLD.role = 'admin' AND NEW.role <> 'admin' AND NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE role = 'admin' AND id <> OLD.id
    ) THEN
      RAISE EXCEPTION 'The last admin cannot be demoted';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_user_deletion(
  p_actor_id UUID,
  p_target_id UUID
) RETURNS TABLE (bucket_id TEXT, object_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_role TEXT;
  v_target_role TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('admin-role-governance', 0));

  IF p_actor_id = p_target_id THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = p_actor_id;
  IF v_actor_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT role INTO v_target_role FROM public.profiles WHERE id = p_target_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_target_role = 'admin' AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin' AND id <> p_target_id
  ) THEN
    RAISE EXCEPTION 'The last admin cannot be deleted';
  END IF;

  RETURN QUERY
  SELECT objects.bucket_id, objects.name
  FROM storage.objects AS objects
  WHERE objects.owner = p_target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_user_deletion(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_user_deletion(UUID, UUID) TO service_role;

UPDATE public.admin_logs
SET details = COALESCE(details, '{}'::jsonb) || jsonb_build_object('actor_id', admin_id)
WHERE admin_id IS NOT NULL AND NOT (COALESCE(details, '{}'::jsonb) ? 'actor_id');

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can log actions';
  END IF;
  INSERT INTO public.admin_logs (admin_id, action, table_name, record_id, details)
  VALUES (
    v_actor_id,
    p_action,
    p_table_name,
    p_record_id,
    COALESCE(p_details, '{}'::jsonb) || jsonb_build_object('actor_id', v_actor_id)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
