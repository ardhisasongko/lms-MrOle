import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from './useCategories';

const PAGE_SIZE = 10;

export function useHistory() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchAttempts = useCallback(async (pageNum = 0, catFilter = categoryFilter) => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('quiz_attempts')
        .select('*, categories(name)', { count: 'exact' })
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (catFilter) {
        query = query.eq('category_id', catFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setAttempts(data || []);
      setHasMore(count > (pageNum + 1) * PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching history:', err);
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

  return { attempts, loading, page, hasMore, categories, categoryFilter, goToPage, applyFilter };
}
