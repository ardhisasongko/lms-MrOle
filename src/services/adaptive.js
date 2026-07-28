import { supabase } from './supabase';

/**
 * Get recommended difficulty for a category based on user's recent performance.
 * Logic:
 * - If avg score >= 80% → suggest harder
 * - If avg score < 50% → suggest easier
 * - Otherwise → keep current
 */
export async function getRecommendedDifficulty(userId, categoryId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('difficulty, score')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .order('completed_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const avgScore = data.reduce((sum, a) => sum + a.score, 0) / data.length;
  const latestDifficulty = data[0].difficulty;

  if (avgScore >= 80) {
    if (latestDifficulty === 'easy') return 'medium';
    if (latestDifficulty === 'medium') return 'hard';
    return 'hard'; // already max
  }
  if (avgScore < 50) {
    if (latestDifficulty === 'hard') return 'medium';
    if (latestDifficulty === 'medium') return 'easy';
    return 'easy'; // already min
  }
  return latestDifficulty;
}

/**
 * Get performance stats for a category+difficulty combo.
 */
export async function getPerformanceStats(userId, categoryId, difficulty) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('score, total_questions, correct_answers, completed_at')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('difficulty', difficulty)
    .order('completed_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const avgScore = data.reduce((sum, a) => sum + a.score, 0) / data.length;
  const totalSessions = data.length;
  const bestScore = Math.max(...data.map((a) => a.score));
  const recentTrend = data.length >= 2
    ? data[0].score - data[1].score
    : 0;

  return {
    avgScore: Math.round(avgScore),
    totalSessions,
    bestScore: Math.round(bestScore),
    recentTrend, // positive = improving, negative = declining
    lastAttempt: data[0].completed_at,
  };
}

/**
 * Get all category performance summaries for adaptive dashboard.
 */
export async function getAdaptiveOverview(userId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('category_id, difficulty, score, categories(name)')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  const categoryMap = {};
  for (const a of data) {
    const catName = a.categories?.name || 'Unknown';
    if (!categoryMap[catName]) categoryMap[catName] = {};
    if (!categoryMap[catName][a.difficulty]) categoryMap[catName][a.difficulty] = [];
    categoryMap[catName][a.difficulty].push(a.score);
  }

  const result = [];
  for (const [catName, difficulties] of Object.entries(categoryMap)) {
    const allScores = Object.values(difficulties).flat();
    const avgScore = allScores.reduce((s, v) => s + v, 0) / allScores.length;

    let recommended = 'medium';
    if (avgScore >= 80) recommended = 'hard';
    else if (avgScore < 50) recommended = 'easy';

    result.push({
      categoryName: catName,
      avgScore: Math.round(avgScore),
      totalAttempts: allScores.length,
      recommended,
    });
  }

  return result;
}
