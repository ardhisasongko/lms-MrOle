import { useState, useEffect, useCallback } from 'react';
import { getQuestions } from '../services/questions';

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
    let cancelled = false;
    (async () => {
      if (!categoryId || !difficulty) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getQuestions(categoryId, difficulty);
        if (!cancelled) setQuestions(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [categoryId, difficulty]);

  return { questions, loading, error, refetch: fetchQuestions };
}
