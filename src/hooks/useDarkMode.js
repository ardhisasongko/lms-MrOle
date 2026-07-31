import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mr-ole-theme';

function getInitial() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(getInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setIsDark(e.matches);
      }
    };
    const storageHandler = (e) => {
      if (e.key === STORAGE_KEY) {
        setIsDark(e.newValue === 'dark');
      }
    };
    mq.addEventListener('change', handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      mq.removeEventListener('change', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggle };
}
