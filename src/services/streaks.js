import { supabase } from './supabase';

export async function getCurrentStreak(userId, signal) {
  const { data, error } = await supabase
    .rpc('calculate_streak', { p_user_id: userId })
    .abortSignal(signal);
  if (error) throw error;
  return data || 0;
}

export async function getStreakActivity(userId, limitDays = 30, signal) {
  const { data, error } = await supabase
    .from('learning_streaks')
    .select('date, questions_done')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limitDays)
    .abortSignal(signal);
  if (error) throw error;
  return data || [];
}
