import toast from 'react-hot-toast';

export function normalizeError(err, fallback = 'Terjadi kesalahan') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  return err.message || fallback;
}

export function handleError(err, fallback) {
  const msg = normalizeError(err, fallback);
  toast.error(msg);
  return msg;
}
