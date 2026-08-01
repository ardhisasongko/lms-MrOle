-- Migration 013: Secure, revocable quiz-result sharing

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.quiz_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT rtrim(translate(encode(extensions.gen_random_bytes(16), 'base64'), '+/', '-_'), '='),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL UNIQUE REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  correct_answers INT NOT NULL,
  total_questions INT NOT NULL,
  category_id UUID NOT NULL,
  category_name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  display_name TEXT,
  show_name BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT quiz_shares_token_format CHECK (token ~ '^[A-Za-z0-9_-]{22}$'),
  CONSTRAINT quiz_shares_score_range CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT quiz_shares_answer_counts CHECK (
    total_questions > 0
    AND correct_answers BETWEEN 0 AND total_questions
  ),
  CONSTRAINT quiz_shares_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

CREATE INDEX idx_quiz_shares_user_created
  ON public.quiz_shares(user_id, created_at DESC);
CREATE INDEX idx_quiz_shares_active_user
  ON public.quiz_shares(user_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.quiz_shares ENABLE ROW LEVEL SECURITY;

-- Shares are available only through the RPCs below. No direct table policy or grant.
REVOKE ALL ON TABLE public.quiz_shares FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_quiz_share(
  p_attempt_id UUID,
  p_show_name BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  token TEXT,
  score DECIMAL(5,2),
  correct_answers INT,
  total_questions INT,
  category_id UUID,
  category_name TEXT,
  difficulty TEXT,
  completed_at TIMESTAMPTZ,
  display_name TEXT,
  show_name BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempt RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT
    qa.score,
    qa.correct_answers,
    qa.total_questions,
    qa.category_id,
    c.name AS category_name,
    qa.difficulty,
    qa.completed_at,
    NULLIF(split_part(trim(p.full_name), ' ', 1), '') AS display_name
  INTO v_attempt
  FROM public.quiz_attempts qa
  JOIN public.categories c ON c.id = qa.category_id
  JOIN public.profiles p ON p.id = qa.user_id
  WHERE qa.id = p_attempt_id
    AND qa.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz attempt not found or unauthorized';
  END IF;

  INSERT INTO public.quiz_shares (
    user_id,
    attempt_id,
    score,
    correct_answers,
    total_questions,
    category_id,
    category_name,
    difficulty,
    completed_at,
    display_name,
    show_name
  )
  VALUES (
    v_user_id,
    p_attempt_id,
    v_attempt.score,
    v_attempt.correct_answers,
    v_attempt.total_questions,
    v_attempt.category_id,
    v_attempt.category_name,
    v_attempt.difficulty,
    COALESCE(v_attempt.completed_at, NOW()),
    v_attempt.display_name,
    COALESCE(p_show_name, TRUE)
  )
  ON CONFLICT (attempt_id) DO UPDATE SET
    token = CASE
      WHEN quiz_shares.revoked_at IS NOT NULL
        THEN rtrim(translate(encode(extensions.gen_random_bytes(16), 'base64'), '+/', '-_'), '=')
      ELSE quiz_shares.token
    END,
    user_id = EXCLUDED.user_id,
    score = EXCLUDED.score,
    correct_answers = EXCLUDED.correct_answers,
    total_questions = EXCLUDED.total_questions,
    category_id = EXCLUDED.category_id,
    category_name = EXCLUDED.category_name,
    difficulty = EXCLUDED.difficulty,
    completed_at = EXCLUDED.completed_at,
    display_name = EXCLUDED.display_name,
    show_name = EXCLUDED.show_name,
    revoked_at = NULL,
    created_at = CASE
      WHEN quiz_shares.revoked_at IS NOT NULL THEN NOW()
      ELSE quiz_shares.created_at
    END;

  RETURN QUERY
  SELECT
    qs.token,
    qs.score,
    qs.correct_answers,
    qs.total_questions,
    qs.category_id,
    qs.category_name,
    qs.difficulty,
    qs.completed_at,
    CASE WHEN qs.show_name THEN qs.display_name ELSE NULL END,
    qs.show_name,
    qs.created_at
  FROM public.quiz_shares qs
  WHERE qs.attempt_id = p_attempt_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_quiz_share(p_token TEXT)
RETURNS TABLE (
  token TEXT,
  score DECIMAL(5,2),
  correct_answers INT,
  total_questions INT,
  category_id UUID,
  category_name TEXT,
  difficulty TEXT,
  completed_at TIMESTAMPTZ,
  display_name TEXT,
  show_name BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    qs.token,
    qs.score,
    qs.correct_answers,
    qs.total_questions,
    qs.category_id,
    qs.category_name,
    qs.difficulty,
    qs.completed_at,
    CASE WHEN qs.show_name THEN qs.display_name ELSE NULL END,
    qs.show_name,
    qs.created_at
  FROM public.quiz_shares qs
  WHERE qs.token = p_token
    AND qs.revoked_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.revoke_quiz_share(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.quiz_shares
  SET revoked_at = NOW()
  WHERE token = p_token
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz share not found or unauthorized';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_quiz_share(UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_quiz_share(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.revoke_quiz_share(TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_quiz_share(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_quiz_share(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_quiz_share(TEXT) TO authenticated;
