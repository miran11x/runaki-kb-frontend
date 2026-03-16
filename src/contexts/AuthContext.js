import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rk_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const ping = useCallback(async () => {
    if (!localStorage.getItem('rk_token')) return;
    await api.post('/auth/ping').catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    ping();
    const t = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(t);
  }, [user, ping]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('rk_token', res.data.token);
      localStorage.setItem('rk_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || 'Login failed' };
    } finally { setLoading(false); }
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('rk_token');
    localStorage.removeItem('rk_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);