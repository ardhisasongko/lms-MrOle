import { useState, useEffect, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categories';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCategories();
        if (!cancelled) setCategories(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const create = useCallback(async (form) => {
    const result = await createCategory(form);
    await refetch();
    return result;
  }, [refetch]);

  const update = useCallback(async (id, form) => {
    await updateCategory(id, form);
    await refetch();
  }, [refetch]);

  const remove = useCallback(async (id) => {
    await deleteCategory(id);
    await refetch();
  }, [refetch]);

  return { categories, loading, error, refetch, create, update, remove };
}
