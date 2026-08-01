import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from './useAsync';
import { getCurrentStreak, getStreakActivity } from '../services/streaks';

export function useStreak() {
  const { user } = useAuth();
  const userId = user?.id;
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    todayDone: false,
    weekActivity: [],
    totalDays: 0,
  });

  const { loading } = useAsync(async (signal) => {
    setStreakData({ currentStreak: 0, longestStreak: 0, todayDone: false, weekActivity: [], totalDays: 0 });
    if (!userId) {
      return;
    }

    const [currentStreak, activity] = await Promise.all([
      getCurrentStreak(userId, signal),
      getStreakActivity(userId, 30, signal),
    ]);
    if (signal.aborted) return;

    const today = new Date().toISOString().split('T')[0];
    const todayDone = activity.some((a) => a.date === today);

    const weekActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = activity.find((a) => a.date === dateStr);
      weekActivity.push({
        date: dateStr,
        done: !!dayData,
        questions: dayData?.questions_done || 0,
      });
    }

    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = activity.map((a) => a.date).sort().reverse();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    setStreakData({
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      todayDone,
      weekActivity,
      totalDays: activity.length,
    });
  }, [userId]);

  return { ...streakData, loading };
}
