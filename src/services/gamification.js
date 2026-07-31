const DAILY_KEY = 'mr_ole_daily';

function today() {
  return new Date().toISOString().split('T')[0];
}

export function getDailyProgress() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return { date: today(), answered: 0, correct: 0, streakFrozen: false };
    const data = JSON.parse(raw);
    if (data.date !== today()) return { date: today(), answered: 0, correct: 0, streakFrozen: false };
    return data;
  } catch {
    return { date: today(), answered: 0, correct: 0, streakFrozen: false };
  }
}

export function saveDailyProgress({ answered = 0, correct = 0 } = {}) {
  const current = getDailyProgress();
  current.answered += answered;
  current.correct += correct;
  localStorage.setItem(DAILY_KEY, JSON.stringify(current));
}

export const BADGES = [
  { id: 'first_quiz', label: 'Pertama Kali', desc: 'Selesaikan quiz pertama', icon: '🎯', check: ({ total }) => total >= 1 },
  { id: 'streak_3', label: 'Semangat 45', desc: 'Streak 3 hari', icon: '🔥', check: ({ streak }) => streak >= 3 },
  { id: 'streak_7', label: 'Sepekan Penuh', desc: 'Streak 7 hari', icon: '💪', check: ({ streak }) => streak >= 7 },
  { id: 'streak_30', label: 'Bulan Penuh', desc: 'Streak 30 hari', icon: '🏆', check: ({ streak }) => streak >= 30 },
  { id: 'soal_50', label: 'Rajin', desc: 'Kerjakan 50 soal', icon: '📚', check: ({ total }) => total >= 50 },
  { id: 'soal_200', label: 'Tekun', desc: 'Kerjakan 200 soal', icon: '📖', check: ({ total }) => total >= 200 },
  { id: 'soal_500', label: 'Gila Belajar', desc: 'Kerjakan 500 soal', icon: '🧠', check: ({ total }) => total >= 500 },
  { id: 'score_80', label: 'Pintar', desc: 'Rata-rata nilai ≥ 80', icon: '⭐', check: ({ avgScore }) => avgScore >= 80 },
  { id: 'score_90', label: 'Jenius', desc: 'Rata-rata nilai ≥ 90', icon: '🌟', check: ({ avgScore }) => avgScore >= 90 },
  { id: 'perfect', label: 'Sempurna', desc: 'Dapat nilai 100 dalam satu quiz', icon: '💎', check: ({ hasPerfect }) => hasPerfect },
  { id: 'all_categories', label: 'Serba Bisa', desc: 'Coba semua kategori', icon: '🌈', check: ({ categoryCount }) => categoryCount >= 6 },
  { id: 'daily_quest', label: 'Rutinitas', desc: 'Selesaikan quest harian', icon: '📅', check: ({ dailyDone }) => dailyDone },
];

export function checkBadges(stats) {
  return BADGES.map((b) => ({ ...b, earned: b.check(stats) }));
}

export function getRecommendations(scoreByCategory) {
  if (!scoreByCategory || scoreByCategory.length === 0) return [];
  const sorted = [...scoreByCategory].sort((a, b) => a.score - b.score);
  return sorted.slice(0, 3);
}
