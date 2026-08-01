-- Compatibility expansion applied before the frontend cutover. It adds only
-- submitted-session reads, so legacy and session frontends can coexist.
DROP POLICY IF EXISTS quiz_session_questions_select_submitted_own
  ON public.quiz_session_questions;
CREATE POLICY quiz_session_questions_select_submitted_own
  ON public.quiz_session_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quiz_sessions AS session
      WHERE session.id = quiz_session_questions.session_id
        AND session.user_id = (SELECT auth.uid())
        AND session.status = 'submitted'
    )
  );
GRANT SELECT ON public.quiz_session_questions TO authenticated;
