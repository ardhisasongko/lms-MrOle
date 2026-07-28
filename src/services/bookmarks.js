import { supabase } from './supabase';

export async function getBookmarksByUser(userId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      question_id,
      created_at,
      questions (
        id,
        question,
        options,
        correct_answer,
        explanation,
        difficulty,
        type,
        category_id,
        categories (name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addBookmark(userId, questionId) {
  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, question_id: questionId });
  if (error) throw error;
}

export async function removeBookmark(userId, questionId) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('question_id', questionId);
  if (error) throw error;
}

export async function isBookmarked(userId, questionId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function getBookmarkCount(userId) {
  const { count, error } = await supabase
    .from('bookmarks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count || 0;
}
