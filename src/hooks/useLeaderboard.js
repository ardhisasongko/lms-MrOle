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
          .from('leaderboard_ranking')
          .select('user_id, full_name, avatar_url, avg_score, sessions, total_questions')
          .limit(50);
        if (cancelled) return;
        if (error) throw error;

        setRankings((data || []).map((r) => ({
          id: r.user_id,
          name: r.full_name || 'User',
          avatarUrl: r.avatar_url || '',
          avgScore: Math.round(r.avg_score),
          sessions: r.sessions,
          totalQuestions: r.total_questions,
        })));
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
