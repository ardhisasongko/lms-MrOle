import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../features/auth/AuthContext';

export function useProgress() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    averageScore: 0,
    streak: 0,
    lastSession: null,
  });
  const [scoreByCategory, setScoreByCategory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const [attemptsRes, streakRes] = await Promise.all([
          supabase
            .from('quiz_attempts')
            .select('score, total_questions, completed_at, category_id, categories(name)')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })
            .limit(100),
          supabase.rpc('calculate_streak', { p_user_id: user.id }),
        ]);

        if (cancelled) return;

        const attempts = attemptsRes.data || [];
        const streak = streakRes.data || 0;

        const totalQuestions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
        const avgScore = attempts.length > 0
          ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
          : 0;

        setStats({
          totalQuestions,
          averageScore: Math.round(avgScore),
          streak,
          lastSession: attempts[0]?.completed_at || null,
        });

        const cats = {};
        attempts.forEach((a) => {
          const name = a.categories?.name || 'Unknown';
          if (!cats[name]) cats[name] = { total: 0, sum: 0, count: 0 };
          cats[name].sum += a.score;
          cats[name].count++;
        });
        setScoreByCategory(
          Object.entries(cats).map(([name, d]) => ({
            name,
            score: Math.round(d.sum / d.count),
          }))
        );

        const today = new Date();
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayAttempts = attempts.filter(
            (a) => a.completed_at?.startsWith(dateStr)
          );
          last7.push({
            date: dateStr,
            score: dayAttempts.length > 0
              ? Math.round(dayAttempts.reduce((s, a) => s + a.score, 0) / dayAttempts.length)
              : 0,
          });
        }
        setChartData(last7);
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  return { stats, scoreByCategory, chartData, loading };
}
