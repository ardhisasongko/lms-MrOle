-- Migration 010: Replace leaderboard_ranking view (SECURITY DEFINER) with RPC function
-- Fixes Supabase security advisory: view runs with owner privileges, bypassing RLS.

-- RPC function with controlled search_path (same pattern as submit_quiz)
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  avg_score NUMERIC,
  sessions BIGINT,
  total_questions BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    ROUND(AVG(qa.score), 2),
    COUNT(qa.id),
    SUM(qa.total_questions)
  FROM profiles p
  JOIN quiz_attempts qa ON qa.user_id = p.id
  GROUP BY p.id, p.full_name, p.avatar_url
  ORDER BY AVG(qa.score) DESC, SUM(qa.total_questions) DESC
  LIMIT 50;
$$;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

-- Keep the view for backward compatibility but mark it invoker-based so it no longer bypasses RLS
ALTER VIEW leaderboard_ranking SET (security_invoker = on);
