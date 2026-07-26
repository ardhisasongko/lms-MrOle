import { supabase } from './supabase';

export async function submitQuiz({ userId, categoryId, difficulty, questions, answers }) {
  const pAnswers = questions.map((q) => ({
    question_id: q.id,
    user_answer: answers[q.id] || '',
  }));

  const { data, error } = await supabase.rpc('submit_quiz', {
    p_user_id: userId,
    p_category_id: categoryId,
    p_difficulty: difficulty,
    p_answers: pAnswers,
  });

  if (error) throw error;

  return {
    attemptId: data?.[0]?.attempt_id,
    score: data?.[0]?.score,
    correct: data?.[0]?.correct,
    total: data?.[0]?.total,
  };
}
