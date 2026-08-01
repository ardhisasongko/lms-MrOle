import { useState } from 'react';
import { getQuestions } from '../services/questions';
import { useAsync } from './useAsync';

export function useQuestions(categoryId, difficulty) {
  const [questions, setQuestions] = useState([]);
  const { loading, error, refetch } = useAsync(async (signal) => {
    setQuestions([]);
    if (!categoryId || !difficulty) return;
    const data = await getQuestions(categoryId, difficulty, signal);
    if (!signal.aborted) setQuestions(data);
  }, [categoryId, difficulty]);

  return { questions, loading, error, refetch };
}
