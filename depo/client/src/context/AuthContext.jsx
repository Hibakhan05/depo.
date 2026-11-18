import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('depo_token'));

  useEffect(() => {
    if (!localStorage.getItem('depo_token')) return;
    api.get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('depo_token'))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (path, body) => {
    const { data } = await api.post(path, body);
    localStorage.setItem('depo_token', data.token);
    setUser(data.user);
    return data.user;
  };
  const value = {
    user,
    loading,
    login: (b) => authenticate('/auth/login', b),
    register: (b) => authenticate('/auth/register', b),
    logout: () => { localStorage.removeItem('depo_token'); setUser(null); },
    refresh: async () => setUser((await api.get('/auth/me')).data),
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
