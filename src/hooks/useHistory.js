import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from './useCategories';
import { getAttempts, HISTORY_PAGE_SIZE } from '../services/quiz';

export function useHistory() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchAttempts = useCallback(async (pageNum = 0, catFilter = categoryFilter) => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getAttempts(user.id, { page: pageNum, categoryFilter: catFilter });
      setAttempts(result.data);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user, categoryFilter]);

  useEffect(() => {
    setPage(0);
    fetchAttempts(0);
  }, [fetchAttempts]);

  const goToPage = (newPage) => {
    setPage(newPage);
    fetchAttempts(newPage);
  };

  const applyFilter = (catId) => {
    setCategoryFilter(catId);
    setPage(0);
  };

  return { attempts, loading, error, page, hasMore, categories, categoryFilter, goToPage, applyFilter };
}
