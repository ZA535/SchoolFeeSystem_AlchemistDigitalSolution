import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setAuthToken, setOnUnauthorized } from '../api.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'school_fee_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: profile } = await api.login(email, password);
    sessionStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    setAuthToken(token);
    api
      .me()
      .then(({ user: profile }) => setUser(profile))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    canWrite: user?.role === 'admin' || user?.role === 'accountant',
    canCollect: user?.role === 'admin' || user?.role === 'accountant',
    isViewer: user?.role === 'viewer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}
