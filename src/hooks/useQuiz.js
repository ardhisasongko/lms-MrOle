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
      let correct = 0;
      const answerRows = questions.map((q) => {
        const userAnswer = answers[q.id] || '';
        const isCorrect = userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
        if (isCorrect) correct++;
        return {
          question_id: q.id,
          user_answer: userAnswer,
          is_correct: isCorrect,
        };
      });

      const score = (correct / questions.length) * 100;

      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          difficulty,
          total_questions: questions.length,
          correct_answers: correct,
          score,
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      const { error: answersError } = await supabase.from('quiz_answers').insert(
        answerRows.map((r) => ({ ...r, attempt_id: attempt.id }))
      );

      if (answersError) throw answersError;

      await supabase.from('learning_streaks').upsert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        questions_done: questions.length,
      }, { onConflict: 'user_id,date', ignoreDuplicates: false });

      return { attemptId: attempt.id, score, correct, total: questions.length };
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  return { submitQuiz, submitting };
}
