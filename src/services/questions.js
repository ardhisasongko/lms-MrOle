import { supabase } from './supabase';

export async function getQuestions(categoryId, difficulty) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, category_id, difficulty, type, question, options, correct_answer, explanation')
    .eq('category_id', categoryId)
    .eq('difficulty', difficulty);
  if (error) throw error;
  return data || [];
}

export async function getAllQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, category_id, difficulty, type, question, options, correct_answer, explanation, created_at, categories(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createQuestion(payload) {
  const { data, error } = await supabase
    .from('questions')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function getQuestionCountsByCategory() {
  const { data, error } = await supabase
    .from('questions')
    .select('category_id, difficulty');
  if (error) throw error;
  // Aggregate client-side into { "uuid:easy": 7, "uuid:medium": 7, ... }
  const counts = {};
  for (const q of data || []) {
    const key = `${q.category_id}:${q.difficulty}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export async function updateQuestion(id, payload) {
  const { error } = await supabase
    .from('questions')
    .update(payload)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteQuestion(id) {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
