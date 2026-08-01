-- Keep legacy rows available for historical results and bookmarks while the
-- active pool is the validated 2,000-question bank.
UPDATE public.questions
SET status = 'archived'
WHERE batch_id IS DISTINCT FROM 'english-bank-2000-v1'
  AND status = 'published';
