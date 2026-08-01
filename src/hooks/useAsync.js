import { useState, useEffect, useCallback, useRef } from 'react';

const ABORTED = Symbol('aborted');

export function useAsync(fn, deps = []) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);
  const requestRef = useRef({ id: 0, controller: null });

  const execute = useCallback(async () => {
    if (!mountedRef.current) return undefined;

    requestRef.current.controller?.abort();
    const controller = new AbortController();
    const id = requestRef.current.id + 1;
    requestRef.current = { id, controller };
    setLoading(true);
    setError(null);

    try {
      const operation = Promise.resolve().then(() => fn(controller.signal));
      const aborted = new Promise((resolve) => {
        controller.signal.addEventListener('abort', () => resolve(ABORTED), { once: true });
      });
      const result = await Promise.race([operation, aborted]);
      if (result === ABORTED) return undefined;
      return requestRef.current.id === id && !controller.signal.aborted
        ? result
        : undefined;
    } catch (err) {
      if (requestRef.current.id === id && !controller.signal.aborted && mountedRef.current) {
        setError(err?.message || String(err));
      }
      return undefined;
    } finally {
      if (requestRef.current.id === id && mountedRef.current) {
        setLoading(false);
      }
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current.id += 1;
      requestRef.current.controller?.abort();
    };
  }, []);

  useEffect(() => {
    execute();
    return () => {
      requestRef.current.id += 1;
      requestRef.current.controller?.abort();
    };
  }, [execute]);

  return { loading, error, refetch: execute };
}
