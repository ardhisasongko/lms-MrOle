import { useState, useEffect, useCallback } from 'react';
import { getCategories } from '../services/categories';

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
  const [loading, setLoading] = useState(!getCached());
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCache(data);
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getCached()) return; // skip fetch if cache hit
    let cancelled = false;
    (async () => {
      try {
        const data = await getCategories();
        if (!cancelled) { setCache(data); setCategories(data); }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { categories, loading, error, refetch };
}
