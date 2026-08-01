CREATE OR REPLACE FUNCTION public.has_active_quiz_question(p_question_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quiz_session_questions AS session_question
    JOIN public.quiz_sessions AS session ON session.id = session_question.session_id
    WHERE session_question.question_id = p_question_id
      AND session.user_id = (SELECT auth.uid())
      AND session.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_quiz_question(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_quiz_question(UUID) TO authenticated;

DROP POLICY IF EXISTS questions_select_authorized ON public.questions;
CREATE POLICY questions_select_authorized
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      EXISTS (
        SELECT 1
        FROM public.quiz_answers AS answer
        JOIN public.quiz_attempts AS attempt ON attempt.id = answer.attempt_id
        WHERE answer.question_id = questions.id
          AND attempt.user_id = (SELECT auth.uid())
      )
      AND NOT public.has_active_quiz_question(questions.id)
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
          'question', CASE
            WHEN review_access.answer_available THEN completed.legacy_question
            ELSE question.question
          END,
          'stimulus', CASE
            WHEN review_access.answer_available THEN completed.stimulus
            ELSE question.stimulus
          END,
          'prompt', CASE
            WHEN review_access.answer_available THEN completed.prompt
            ELSE question.prompt
          END,
          'options', CASE
            WHEN review_access.answer_available THEN completed.options
            ELSE question.options
          END,
          'correct_answer', CASE
            WHEN review_access.answer_available THEN completed.correct_answer
          END,
          'explanation', CASE
            WHEN review_access.answer_available THEN question.explanation
          END,
          'answer_available', review_access.answer_available,
          'difficulty', CASE
            WHEN review_access.answer_available THEN completed.difficulty
            ELSE question.difficulty
          END,
          'type', CASE
            WHEN review_access.answer_available THEN completed.question_type
            ELSE question.type
          END,
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
  LEFT JOIN LATERAL (
    SELECT TRUE AS is_active
    FROM public.quiz_session_questions AS session_question
    JOIN public.quiz_sessions AS session ON session.id = session_question.session_id
    WHERE session_question.question_id = bookmark.question_id
      AND session.user_id = (SELECT auth.uid())
      AND session.status = 'active'
    LIMIT 1
  ) AS active ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      session_question.session_id,
      session_question.question_type,
      session_question.legacy_question,
      session_question.stimulus,
      session_question.prompt,
      session_question.options,
      session_question.correct_answer,
      session.difficulty
    FROM public.quiz_session_questions AS session_question
    JOIN public.quiz_sessions AS session ON session.id = session_question.session_id
    WHERE session_question.question_id = bookmark.question_id
      AND session.user_id = (SELECT auth.uid())
      AND session.status = 'submitted'
    ORDER BY session.submitted_at DESC
    LIMIT 1
  ) AS completed ON TRUE
  CROSS JOIN LATERAL (
    SELECT completed.session_id IS NOT NULL
      AND NOT COALESCE(active.is_active, FALSE) AS answer_available
  ) AS review_access
  WHERE bookmark.user_id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_bookmark_reviews() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_bookmark_reviews() TO authenticated;
