-- Serialize admin governance, audit deletion, and remove the auth user atomically.

ALTER TABLE public.admin_logs
  ALTER COLUMN admin_id DROP NOT NULL;

ALTER TABLE public.admin_logs
  DROP CONSTRAINT IF EXISTS admin_logs_admin_id_fkey;

ALTER TABLE public.admin_logs
  ADD CONSTRAINT admin_logs_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

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

    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      PERFORM pg_advisory_xact_lock(hashtextextended('admin-role-governance', 0));
      IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE role = 'admin' AND id <> OLD.id
      ) THEN
        RAISE EXCEPTION 'The last admin cannot be demoted';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_as_admin(
  p_actor_id UUID,
  p_target_id UUID
) RETURNS VOID
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

  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = p_actor_id;

  IF v_actor_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT role INTO v_target_role
  FROM public.profiles
  WHERE id = p_target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_target_role = 'admin' AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE role = 'admin' AND id <> p_target_id
  ) THEN
    RAISE EXCEPTION 'The last admin cannot be deleted';
  END IF;

  INSERT INTO public.admin_logs (admin_id, action, table_name, record_id, details)
  VALUES (
    p_actor_id,
    'delete',
    'profiles',
    p_target_id,
    jsonb_build_object(
      'source', 'delete-user',
      'actor_id', p_actor_id,
      'target_role', v_target_role
    )
  );

  DELETE FROM auth.users WHERE id = p_target_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_as_admin(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_as_admin(UUID, UUID) TO service_role;
