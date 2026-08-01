import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  saveQuizSessionAnswer,
  startQuizSession,
  submitQuizSession,
} from '../services/quiz';

export function useQuiz() {
  const { user } = useAuth();
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startSession = useCallback(async (options) => {
    if (!user) throw new Error('Not authenticated');
    setStarting(true);

    try {
      return await startQuizSession(options);
    } finally {
      setStarting(false);
    }
  }, [user]);

  const saveAnswer = useCallback(async (options) => {
    if (!user) throw new Error('Not authenticated');
    return saveQuizSessionAnswer(options);
  }, [user]);

  const submitSession = useCallback(async (options) => {
    if (!user) throw new Error('Not authenticated');
    setSubmitting(true);

    try {
      return await submitQuizSession(options);
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  return { startSession, saveAnswer, submitSession, starting, submitting };
}
