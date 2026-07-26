-- Migration 007: Admin audit log + rate limit notes
-- Logs all admin CRUD actions for accountability.

-- 1. AUDIT LOG TABLE
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

-- Only admins can read audit logs
CREATE POLICY "admin_logs_select" ON admin_logs
  FOR SELECT USING (public.is_admin());

-- Only admins can insert audit logs
CREATE POLICY "admin_logs_insert" ON admin_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- 2. LOG HELPER FUNCTION (SECURITY DEFINER so it works from the app)
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

-- 3. Set admin by email (uncomment and replace with your email)
-- UPDATE profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
