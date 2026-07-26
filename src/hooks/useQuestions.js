import { useState, useEffect, useCallback } from 'react';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../services/questions';

export function useQuestions(categoryId, difficulty) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuestions = useCallback(async () => {
    if (!categoryId || !difficulty) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getQuestions(categoryId, difficulty);
      setQuestions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [categoryId, difficulty]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const create = useCallback(async (payload) => {
    const result = await createQuestion(payload);
    await fetchQuestions();
    return result;
  }, [fetchQuestions]);

  const update = useCallback(async (id, payload) => {
    await updateQuestion(id, payload);
    await fetchQuestions();
  }, [fetchQuestions]);

  const remove = useCallback(async (id) => {
    await deleteQuestion(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  return { questions, loading, error, refetch: fetchQuestions, create, update, remove };
}
