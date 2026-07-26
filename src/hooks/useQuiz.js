import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { submitQuiz as submitQuizService } from '../services/quiz';

export function useQuiz() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const submitQuiz = useCallback(async ({ categoryId, difficulty, questions, answers }) => {
    if (!user) throw new Error('Not authenticated');
    setSubmitting(true);

    try {
      return await submitQuizService({
        userId: user.id,
        categoryId,
        difficulty,
        questions,
        answers,
      });
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  return { submitQuiz, submitting };
}
