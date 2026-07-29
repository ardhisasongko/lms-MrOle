import { useState } from 'react';
import { getQuestions } from '../services/questions';
import { useAsync } from './useAsync';

export function useQuestions(categoryId, difficulty) {
  const [questions, setQuestions] = useState([]);
  const { loading, error, refetch } = useAsync(async () => {
    if (!categoryId || !difficulty) return;
    setQuestions([]);
    const data = await getQuestions(categoryId, difficulty);
    setQuestions(data);
  }, [categoryId, difficulty]);

  return { questions, loading, error, refetch };
}
