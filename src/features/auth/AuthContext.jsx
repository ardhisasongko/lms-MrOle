import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

const AuthContext = createContext(null);

function getDemoUser() {
  const stored = localStorage.getItem('demo_user');
  return stored ? JSON.parse(stored) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => IS_DEMO ? getDemoUser() : null);
  const [loading, setLoading] = useState(false);

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
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const register = useCallback(async (email, password, fullName) => {
    if (IS_DEMO) {
      const demoUser = { id: 'demo-user-id', email, user_metadata: { full_name: fullName } };
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
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
      localStorage.removeItem('demo_user');
      setUser(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
