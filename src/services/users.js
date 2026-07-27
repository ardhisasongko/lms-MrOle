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

export async function getStatsCounts() {
  const [usersRes, questionsRes, categoriesRes, attemptsRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
  ]);
  return {
    users: usersRes.count || 0,
    questions: questionsRes.count || 0,
    categories: categoriesRes.count || 0,
    attempts: attemptsRes.count || 0,
  };
}
