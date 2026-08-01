-- Apply after the session-based frontend is deployed. Students receive active
-- questions only through start_quiz_session; this view exists for safe legacy
-- reads and non-assessment previews.
DROP VIEW IF EXISTS public.questions_public;
CREATE VIEW public.questions_public
WITH (security_invoker = on) AS
SELECT
  q.id,
  q.category_id,
  q.difficulty,
  q.type,
  q.question,
  q.prompt,
  q.stimulus,
  q.options,
  q.status
FROM public.questions AS q
WHERE q.status = 'published';

REVOKE ALL ON public.questions_public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.questions_public TO authenticated;

-- Completed results may be read, but all writes must flow through the
-- transactional session submit RPC.
REVOKE INSERT, UPDATE, DELETE ON public.quiz_attempts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.quiz_answers FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_quiz(UUID, UUID, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "questions_select_all" ON public.questions;
DROP POLICY IF EXISTS questions_select_authorized ON public.questions;
CREATE POLICY questions_select_authorized
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.quiz_answers AS answer
      JOIN public.quiz_attempts AS attempt ON attempt.id = answer.attempt_id
      WHERE answer.question_id = questions.id
        AND attempt.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.bookmarks AS bookmark
      WHERE bookmark.question_id = questions.id
        AND bookmark.user_id = (SELECT auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.get_published_question_counts()
RETURNS TABLE (category_id UUID, difficulty TEXT, question_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT q.category_id, q.difficulty, COUNT(*)
  FROM public.questions AS q
  WHERE q.status = 'published'
  GROUP BY q.category_id, q.difficulty;
$$;

REVOKE ALL ON FUNCTION public.get_published_question_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_published_question_counts() TO authenticated;
