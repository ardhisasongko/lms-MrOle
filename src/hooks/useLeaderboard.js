import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export function useLeaderboard() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('user_id, score, total_questions, profiles(full_name, avatar_url)');
        if (cancelled) return;
        if (error) throw error;

        const acc = {};
        (data || []).forEach((a) => {
          const uid = a.user_id;
          if (!acc[uid]) {
            acc[uid] = { id: uid, name: a.profiles?.full_name || 'User', avatarUrl: a.profiles?.avatar_url || '', totalScore: 0, totalQuestions: 0, count: 0 };
          }
          acc[uid].totalScore += a.score;
          acc[uid].totalQuestions += a.total_questions;
          acc[uid].count++;
        });

        const sorted = Object.values(acc)
          .map((u) => ({ ...u, avgScore: Math.round(u.totalScore / u.count) }))
          .sort((a, b) => b.avgScore - a.avgScore || b.totalQuestions - a.totalQuestions)
          .slice(0, 50);

        setRankings(sorted);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { rankings, loading };
}
