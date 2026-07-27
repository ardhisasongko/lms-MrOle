import { useState } from 'react';
import { getCategories } from '../services/categories';
import { useAsync } from './useAsync';

const CACHE_KEY = 'lms_categories';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(data) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

export function useCategories() {
  const [categories, setCategories] = useState(() => getCached() || []);

  const { loading, error, refetch } = useAsync(async () => {
    const cached = getCached();
    if (cached) return;
    const data = await getCategories();
    setCache(data);
    setCategories(data);
  }, []);

  return { categories, loading, error, refetch };
}
