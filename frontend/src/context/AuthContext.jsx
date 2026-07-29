import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

/**
 * Stub AuthProvider — UI-only mode.
 * Provides the same interface Auth.jsx expects but performs no real authentication.
 * Replace with the real Supabase-backed provider when integrating the backend.
 */
export function AuthProvider({ children }) {
  const [user] = useState(null);
  const [session] = useState(null);
  const [loading] = useState(false);

  const login = async () => {
    console.log('[AuthContext] login() called — no backend configured');
  };

  const signup = async () => {
    console.log('[AuthContext] signup() called — no backend configured');
  };

  const logout = async () => {
    console.log('[AuthContext] logout() called — no backend configured');
  };

  const value = { user, session, loading, login, signup, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return stubs so components don't crash outside the provider
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
