import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from './useAsync';
import { getRecentAttempts } from '../services/quiz';
import { getDailyMissions } from '../utils/missions';

const EMPTY = { activity: { quizzes: 0, questions: 0, bestScore: 0 }, missions: [], completedCount: 0, allDone: false };

// Misi harian diturunkan dari attempt terbaru yang sama seperti progres —
// tidak ada tabel atau query jenis baru, cukup agregasi di sisi klien.
export function useDailyMissions() {
  const { user } = useAuth();
  const userId = user?.id;
  const [daily, setDaily] = useState(EMPTY);

  const { loading } = useAsync(async (signal) => {
    setDaily(EMPTY);
    if (!userId) return;

    const attempts = await getRecentAttempts(userId, 100, signal);
    if (signal.aborted) return;
    setDaily(getDailyMissions(attempts));
  }, [userId]);

  return { ...daily, loading };
}
