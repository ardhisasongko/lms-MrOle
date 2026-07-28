import { supabase } from './supabase';

export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getProfileRole(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data?.role;
}

export async function updateProfileRole(userId, role) {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);
  if (error) throw error;
}

export async function deleteUser(userId) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function upsertProfile(userId, { fullName, avatarUrl }) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: fullName,
    avatar_url: avatarUrl || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getStatsCounts() {
  const [usersRes, questionsRes, categoriesRes, attemptsRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
  ]);
  for (const res of [usersRes, questionsRes, categoriesRes, attemptsRes]) {
    if (res.error) throw res.error;
  }
  return {
    users: usersRes.count || 0,
    questions: questionsRes.count || 0,
    categories: categoriesRes.count || 0,
    attempts: attemptsRes.count || 0,
  };
}

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard_ranking')
    .select('user_id, full_name, avatar_url, avg_score, sessions, total_questions')
    .limit(50);
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.user_id,
    name: r.full_name || 'User',
    avatarUrl: r.avatar_url || '',
    avgScore: Math.round(r.avg_score),
    sessions: r.sessions,
    totalQuestions: r.total_questions,
  }));
}

export async function getAdminActivityLog() {
  const { data, error } = await supabase
    .from('admin_logs')
    .select('id, action, table_name, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
}
