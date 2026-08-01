-- Stable generator identities let editorial corrections update one generated
-- item without relying on a hash of its mutable content.
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS questions_source_key_unique
  ON public.questions (source_key)
  WHERE source_key IS NOT NULL;
