import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { clearCache } from '../services/cache';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applySession = (nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.access_token) {
        localStorage.setItem('token', nextSession.access_token);
      } else {
        localStorage.removeItem('token');
      }
      setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        applySession(currentSession);
      })
      .catch((err) => {
        console.warn('[auth] Failed to restore session:', err);
        applySession(null);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured. Set VITE_SUPABASE_ANON_KEY to the public anon key (not service_role).'
      );
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data?.session?.access_token) {
      localStorage.setItem('token', data.session.access_token);
    }
    return data;
  };

  const signup = async (email, password, fullName) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured. Set VITE_SUPABASE_ANON_KEY to the public anon key (not service_role).'
      );
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    // Never let one account's cached data survive into the next session.
    clearCache();
    setUser(null);
    setSession(null);
  };

  const value = { user, session, loading, login, signup, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      session: null,
      loading: false,
      login: async () => {},
      signup: async () => {},
      logout: async () => {},
    };
  }
  return context;
}
