-- Fix options format: unwrap {"options": [...]} → [...]
-- Only touches rows where options starts with {"options":
UPDATE questions
SET options = options::jsonb -> 'options'
WHERE options::text LIKE '{"options":%';
