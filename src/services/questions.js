import { supabase } from './supabase';

const publicQuestionFields = 'id, category_id, difficulty, type, question, options';
const structuredPublicFields = `${publicQuestionFields}, stimulus, prompt, status, content_metadata`;
const adminQuestionFields = `${structuredPublicFields}, correct_answer, explanation`;

function isMissingStructuredColumn(error) {
  return error?.code === '42703' || error?.code === 'PGRST204';
}

export async function getQuestions(categoryId, difficulty) {
  let { data, error } = await supabase
    .from('questions_public')
    .select(structuredPublicFields)
    .eq('category_id', categoryId)
    .eq('difficulty', difficulty);
  if (error && isMissingStructuredColumn(error)) {
    ({ data, error } = await supabase
      .from('questions_public')
      .select(publicQuestionFields)
      .eq('category_id', categoryId)
      .eq('difficulty', difficulty));
  }
  if (error) throw error;
  return data || [];
}

export const ADMIN_QUESTION_PAGE_SIZE = 50;

export async function getAllQuestions({ page = 0 } = {}) {
  let { data, error, count } = await supabase
    .from('questions')
    .select(`${adminQuestionFields}, created_at, categories(name)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * ADMIN_QUESTION_PAGE_SIZE, (page + 1) * ADMIN_QUESTION_PAGE_SIZE - 1);
  if (error && isMissingStructuredColumn(error)) {
    const fallback = await supabase
      .from('questions')
      .select(`${publicQuestionFields}, correct_answer, explanation, created_at, categories(name)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * ADMIN_QUESTION_PAGE_SIZE, (page + 1) * ADMIN_QUESTION_PAGE_SIZE - 1);
    data = fallback.data;
    error = fallback.error;
    count = fallback.count;
  }
  if (error) throw error;
  return { data: data || [], count: count || 0 };
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
  let { data, error } = await supabase.rpc('get_published_question_counts');
  if (error?.code === 'PGRST202' || error?.code === '42883') {
    ({ data, error } = await supabase
      .from('questions')
      .select('category_id, difficulty, status')
      .eq('status', 'published'));
    if (error && isMissingStructuredColumn(error)) {
      ({ data, error } = await supabase
        .from('questions')
        .select('category_id, difficulty'));
    }
  }
  if (error) throw error;
  // Aggregate client-side into { "uuid:easy": 7, "uuid:medium": 7, ... }
  const counts = {};
  for (const q of data || []) {
    const key = `${q.category_id}:${q.difficulty}`;
    counts[key] = q.question_count === undefined
      ? (counts[key] || 0) + 1
      : Number(q.question_count);
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
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) throw error;
}
