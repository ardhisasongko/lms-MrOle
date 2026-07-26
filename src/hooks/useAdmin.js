import { useState, useEffect } from 'react';
import { getProfileRole } from '../services/users';
import { useAuth } from '../contexts/AuthContext';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const role = await getProfileRole(user.id);
        if (!cancelled) setIsAdmin(role === 'admin');
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { isAdmin, checking };
}
