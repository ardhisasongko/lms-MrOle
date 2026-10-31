// Logika murni ulangan terjadwal (spaced repetition) untuk jawaban salah.
// Status review per soal (stage & lastReviewedAt) disimpan terpisah
// (localStorage, lihat useReviewDeck) — modul ini hanya menghitung jadwal.

export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];
export const MAX_STAGE = REVIEW_INTERVALS_DAYS.length; // stage == MAX_STAGE berarti tuntas

const DAY_MS = 24 * 60 * 60 * 1000;

function toTime(value) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function clampStage(stage) {
  const n = Number(stage);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), MAX_STAGE);
}

// Gabungkan satu catatan jawaban salah dengan status review tersimpan
// menjadi item deck yang lengkap.
export function normalizeReviewItem(wrong = {}, stored = {}) {
  return {
    questionId: wrong.questionId ?? stored.questionId ?? null,
    lastWrongAt: wrong.lastWrongAt || stored.lastWrongAt || null,
    stage: clampStage(stored.stage ?? wrong.stage ?? 0),
    lastReviewedAt: stored.lastReviewedAt || wrong.lastReviewedAt || null,
  };
}

// Kapan item ini jatuh tempo berikutnya. Basisnya review terakhir;
// bila belum pernah direview, basisnya waktu salah terakhir.
export function getNextReviewAt(item) {
  if (!item || clampStage(item.stage) >= MAX_STAGE) return null;
  const base = toTime(item.lastReviewedAt) ?? toTime(item.lastWrongAt);
  if (base === null) return null;
  const interval = REVIEW_INTERVALS_DAYS[clampStage(item.stage)];
  return new Date(base + interval * DAY_MS);
}

export function isDue(item, now = new Date()) {
  const next = getNextReviewAt(item);
  if (!next) return false;
  const t = toTime(now);
  return t !== null && t >= next.getTime();
}

export function isMastered(item) {
  return clampStage(item?.stage) >= MAX_STAGE;
}

// Terapkan hasil review: ingat → naik satu tahap (jadwal makin jauh),
// lupa → kembali ke tahap 0 (jadwal paling dekat). Mengembalikan item
// baru; item asal tidak diubah.
export function applyReviewResult(item, remembered, now = new Date()) {
  const current = normalizeReviewItem(item);
  const nowIso = new Date(now).toISOString();
  return {
    ...current,
    stage: remembered ? Math.min(current.stage + 1, MAX_STAGE) : 0,
    lastReviewedAt: nowIso,
  };
}

// Bangun deck dari daftar jawaban salah + peta status review tersimpan.
// Item diurutkan: yang jatuh tempo lebih dulu (paling lama menunggu
// paling depan), lalu yang belum jatuh tempo berdasarkan jadwalnya.
export function buildReviewDeck(wrongItems = [], reviewState = {}, now = new Date()) {
  const wrongByQuestion = new Map();
  for (const wrong of Array.isArray(wrongItems) ? wrongItems : []) {
    const questionId = wrong?.questionId;
    if (!questionId) continue;
    const prev = wrongByQuestion.get(questionId);
    // Simpan kesalahan paling baru per soal.
    if (!prev || (toTime(wrong.lastWrongAt) ?? 0) > (toTime(prev.lastWrongAt) ?? 0)) {
      wrongByQuestion.set(questionId, wrong);
    }
  }

  const items = [...wrongByQuestion.values()].map((wrong) => {
    const item = normalizeReviewItem(wrong, reviewState?.[wrong.questionId] || {});
    return {
      ...wrong,
      stage: item.stage,
      lastReviewedAt: item.lastReviewedAt,
      nextReviewAt: getNextReviewAt(item),
      due: isDue(item, now),
      mastered: isMastered(item),
    };
  });

  items.sort((a, b) => {
    if (a.due !== b.due) return a.due ? -1 : 1;
    const at = a.nextReviewAt ? a.nextReviewAt.getTime() : Number.POSITIVE_INFINITY;
    const bt = b.nextReviewAt ? b.nextReviewAt.getTime() : Number.POSITIVE_INFINITY;
    return at - bt;
  });

  const dueItems = items.filter((i) => i.due);
  return {
    items,
    dueItems,
    dueCount: dueItems.length,
    totalCount: items.length,
    masteredCount: items.filter((i) => i.mastered).length,
  };
}
