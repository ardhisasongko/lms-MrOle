// Logika murni misi harian — diturunkan dari attempt kuis yang sudah ada,
// tanpa query atau penyimpanan baru. Semua fungsi di sini mudah ditest.

export const DAILY_MISSIONS = [
  { id: 'complete_quiz', title: 'Selesaikan 1 kuis hari ini', target: 1, metric: 'quizzes' },
  { id: 'answer_questions', title: 'Jawab 10 soal hari ini', target: 10, metric: 'questions' },
  { id: 'best_score', title: 'Raih skor 80+ dalam 1 kuis hari ini', target: 80, metric: 'bestScore' },
];

function todayKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// Agregasi aktivitas hari ini dari daftar attempt (bentuk sama seperti
// yang dikembalikan service quiz: { total_questions, score, completed_at }).
// Konvensi tanggal mengikuti kode yang sudah ada (useProgress): cocokkan
// awalan tanggal UTC dari completed_at.
export function getTodayActivity(attempts = [], date = new Date()) {
  const key = todayKey(date);
  const list = Array.isArray(attempts) ? attempts : [];
  const todays = list.filter((a) => typeof a?.completed_at === 'string' && a.completed_at.startsWith(key));

  return {
    quizzes: todays.length,
    questions: todays.reduce((sum, a) => sum + (Number(a?.total_questions) || 0), 0),
    bestScore: todays.reduce((max, a) => Math.max(max, Number(a?.score) || 0), 0),
  };
}

// Bangun daftar misi dari aktivitas hari ini: progres dibatasi target,
// percent 0–100, done bila progres mencapai target.
export function buildDailyMissions(activity = {}) {
  const safe = {
    quizzes: Number(activity?.quizzes) || 0,
    questions: Number(activity?.questions) || 0,
    bestScore: Number(activity?.bestScore) || 0,
  };

  return DAILY_MISSIONS.map((mission) => {
    const raw = safe[mission.metric] || 0;
    const progress = Math.min(raw, mission.target);
    return {
      ...mission,
      progress,
      percent: Math.round((progress / mission.target) * 100),
      done: raw >= mission.target,
    };
  });
}

export function getDailyMissions(attempts = [], date = new Date()) {
  const activity = getTodayActivity(attempts, date);
  const missions = buildDailyMissions(activity);
  return {
    activity,
    missions,
    completedCount: missions.filter((m) => m.done).length,
    allDone: missions.every((m) => m.done),
  };
}
