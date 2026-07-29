import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { getProfileRole } from '../services/users';

import { IS_DEMO } from '../utils/constants';

const AuthContext = createContext(null);

function getDemoUser() {
  const stored = sessionStorage.getItem('demo_user');
  return stored ? JSON.parse(stored) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => IS_DEMO ? getDemoUser() : null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    if (IS_DEMO) return;
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    if (IS_DEMO) {
      const demoUser = { id: 'demo-user-id', email, user_metadata: { full_name: email.split('@')[0] } };
      sessionStorage.setItem('demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const register = useCallback(async (email, password, fullName) => {
    if (IS_DEMO) {
      const demoUser = { id: 'demo-user-id', email, user_metadata: { full_name: fullName } };
      sessionStorage.setItem('demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (IS_DEMO) {
      sessionStorage.removeItem('demo_user');
      setUser(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  useEffect(() => {
    if (!user || IS_DEMO) { setIsAdmin(false); return; }
    let cancelled = false;
    setCheckingAdmin(true);
    getProfileRole(user.id).then((role) => {
      if (!cancelled) setIsAdmin(role === 'admin');
    }).catch(() => {
      if (!cancelled) setIsAdmin(false);
    }).finally(() => {
      if (!cancelled) setCheckingAdmin(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, checkingAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
