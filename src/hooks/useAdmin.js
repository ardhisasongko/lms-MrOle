import { useAuth } from '../contexts/AuthContext';

export function useAdmin() {
  const { isAdmin, checkingAdmin } = useAuth();
  return { isAdmin, checking: checkingAdmin };
}
