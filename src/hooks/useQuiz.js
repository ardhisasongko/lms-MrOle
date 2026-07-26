import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../features/auth/AuthContext';

export function useQuiz() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const submitQuiz = useCallback(async ({ categoryId, difficulty, questions, answers }) => {
    if (!user) throw new Error('Not authenticated');
    setSubmitting(true);

    try {
      const pAnswers = questions.map((q) => ({
        question_id: q.id,
        user_answer: answers[q.id] || '',
      }));

      const { data, error } = await supabase.rpc('submit_quiz', {
        p_user_id: user.id,
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
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  return { submitQuiz, submitting };
}
