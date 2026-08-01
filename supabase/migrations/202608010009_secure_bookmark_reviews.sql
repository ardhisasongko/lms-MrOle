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
  );

CREATE OR REPLACE FUNCTION public.get_bookmark_reviews()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', bookmark.id,
        'question_id', bookmark.question_id,
        'created_at', bookmark.created_at,
        'questions', jsonb_build_object(
          'id', question.id,
          'question', question.question,
          'stimulus', question.stimulus,
          'prompt', question.prompt,
          'options', question.options,
          'correct_answer', CASE WHEN completed.answer_available THEN question.correct_answer END,
          'explanation', CASE WHEN completed.answer_available THEN question.explanation END,
          'answer_available', completed.answer_available,
          'difficulty', question.difficulty,
          'type', question.type,
          'category_id', question.category_id,
          'categories', jsonb_build_object('name', category.name)
        )
      )
      ORDER BY bookmark.created_at DESC
    ),
    '[]'::JSONB
  )
  FROM public.bookmarks AS bookmark
  JOIN public.questions AS question ON question.id = bookmark.question_id
  JOIN public.categories AS category ON category.id = question.category_id
  CROSS JOIN LATERAL (
    SELECT EXISTS (
      SELECT 1
      FROM public.quiz_answers AS answer
      JOIN public.quiz_attempts AS attempt ON attempt.id = answer.attempt_id
      WHERE answer.question_id = bookmark.question_id
        AND attempt.user_id = (SELECT auth.uid())
    ) AS answer_available
  ) AS completed
  WHERE bookmark.user_id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_bookmark_reviews() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_bookmark_reviews() TO authenticated;
