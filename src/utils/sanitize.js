import DOMPurify from 'dompurify';

export function sanitize(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
