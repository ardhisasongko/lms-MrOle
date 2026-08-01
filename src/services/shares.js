import { supabase } from './supabase';

function mapQuizShare(share) {
  if (!share) return null;

  return {
    token: share.token,
    score: share.score,
    correctAnswers: share.correct_answers,
    totalQuestions: share.total_questions,
    categoryId: share.category_id,
    categoryName: share.category_name,
    difficulty: share.difficulty,
    completedAt: share.completed_at,
    displayName: share.display_name,
    showName: share.show_name,
    createdAt: share.created_at,
  };
}

export async function createQuizShare(attemptId, showName = true) {
  const { data, error } = await supabase.rpc('create_quiz_share', {
    p_attempt_id: attemptId,
    p_show_name: showName,
  });

  if (error) throw error;
  return mapQuizShare(data?.[0]);
}

export async function getPublicQuizShare(token) {
  const { data, error } = await supabase.rpc('get_public_quiz_share', {
    p_token: token,
  });

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return mapQuizShare(data?.[0]);
}

export async function revokeQuizShare(token) {
  const { error } = await supabase.rpc('revoke_quiz_share', {
    p_token: token,
  });

  if (error) throw error;
}
