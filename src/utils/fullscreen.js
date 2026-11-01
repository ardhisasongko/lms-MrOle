// Util layar penuh (Fullscreen API) — dipakai tombol layar penuh global.
// Mengikuti pola yang sudah ada di halaman Quiz: requestFullscreen pada
// documentElement + listener fullscreenchange. Semua fungsi aman dipanggil
// di browser tanpa dukungan (mis. iPhone Safari): mengembalikan false,
// tidak pernah melempar error.

function getDoc(doc) {
  if (doc) return doc;
  return typeof document !== 'undefined' ? document : null;
}

export function isFullscreenSupported(doc) {
  const resolved = getDoc(doc);
  const el = resolved?.documentElement;
  return !!el && typeof el.requestFullscreen === 'function';
}

export function getFullscreenElement(doc) {
  return getDoc(doc)?.fullscreenElement ?? null;
}

export function isFullscreenActive(doc) {
  return getFullscreenElement(doc) !== null;
}

export async function enterFullscreen(doc) {
  const resolved = getDoc(doc);
  const el = resolved?.documentElement;
  if (!el || typeof el.requestFullscreen !== 'function') return false;
  try {
    await el.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen(doc) {
  const resolved = getDoc(doc);
  if (!resolved?.fullscreenElement || typeof resolved.exitFullscreen !== 'function') return false;
  try {
    await resolved.exitFullscreen();
    return true;
  } catch {
    return false;
  }
}

export async function toggleFullscreen(doc) {
  return isFullscreenActive(doc) ? exitFullscreen(doc) : enterFullscreen(doc);
}
