import { useState } from 'react';
import { getProfileRole } from '../services/users';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from './useAsync';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  const { loading: checking } = useAsync(async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const role = await getProfileRole(user.id);
    setIsAdmin(role === 'admin');
  }, [user]);

  return { isAdmin, checking };
}
