// Logika murni peta level bertahap untuk Practice.
// Level adalah tingkat kesulitan yang sudah ada: easy → medium → hard.
// Sebuah level "lulus" bila ada attempt selesai pada kategori+level itu
// dengan skor >= PASS_SCORE. Level berikutnya terbuka hanya bila level
// sebelumnya lulus; hasil terbaik (bukan attempt terakhir) yang dipakai,
// supaya satu percobaan buruk tidak mengunci kembali level yang sudah
// pernah dilalui.

export const LEVEL_ORDER = ['easy', 'medium', 'hard'];
export const PASS_SCORE = 70;

// Agregasi attempt mentah ({ category_id, difficulty, score }) menjadi
// peta `${categoryId}:${difficulty}` → { bestScore, attempts, passed }.
export function aggregateLevelProgress(attempts = []) {
  const progress = {};
  for (const a of Array.isArray(attempts) ? attempts : []) {
    if (!a?.category_id || !LEVEL_ORDER.includes(a?.difficulty)) continue;
    const score = Number(a.score);
    if (!Number.isFinite(score)) continue;
    const key = `${a.category_id}:${a.difficulty}`;
    const prev = progress[key];
    progress[key] = {
      bestScore: prev ? Math.max(prev.bestScore, score) : score,
      attempts: (prev?.attempts || 0) + 1,
      passed: (prev?.passed || false) || score >= PASS_SCORE,
    };
  }
  return progress;
}

// Bangun struktur peta untuk daftar kategori:
// [{ ...category, levels: [{ difficulty, status, bestScore, attempts }] }]
// status: 'completed' (pernah lulus) | 'unlocked' (boleh dimainkan) |
//         'locked' (level sebelumnya belum lulus)
export function buildLevelMap(categories = [], attempts = []) {
  const progress = aggregateLevelProgress(attempts);
  return (Array.isArray(categories) ? categories : []).map((category) => {
    let previousPassed = true; // level pertama selalu terbuka
    const levels = LEVEL_ORDER.map((difficulty) => {
      const entry = progress[`${category.id}:${difficulty}`];
      const passed = Boolean(entry?.passed);
      const status = passed ? 'completed' : previousPassed ? 'unlocked' : 'locked';
      const level = {
        difficulty,
        status,
        bestScore: entry ? entry.bestScore : null,
        attempts: entry?.attempts || 0,
        locked: status === 'locked',
        completed: passed,
      };
      previousPassed = passed;
      return level;
    });
    return { ...category, levels };
  });
}
