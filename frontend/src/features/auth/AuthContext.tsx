import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, clearTokens, hasAccessToken, saveTokens, type TokenPair } from '../../lib/api';

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AuthValue {
  authenticated: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [authenticated, setAuthenticated] = useState(hasAccessToken);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const expire = () => {
      setAuthenticated(false);
      setUser(null);
      queryClient.clear();
    };
    window.addEventListener('auth:expired', expire);
    if (hasAccessToken()) {
      api.get<AuthUser>('/users/me').then(({ data }) => setUser(data)).catch(() => undefined);
    }
    return () => window.removeEventListener('auth:expired', expire);
  }, [queryClient]);

  async function signIn(email: string, password: string) {
    const { data } = await api.post<TokenPair>('/auth/login', { email, password });
    saveTokens(data);
    setAuthenticated(true);
    try {
      const profile = await api.get<AuthUser>('/users/me');
      setUser(profile.data);
    } catch {
      setUser({ email });
    }
  }

  async function signUp(name: string, email: string, password: string) {
    await api.post('/auth/register', { name, email, password, role: 'customer' });
    await signIn(email, password);
  }

  async function signOut() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
      setAuthenticated(false);
      setUser(null);
      queryClient.clear();
    }
  }

  const value = useMemo(() => ({ authenticated, user, signIn, signUp, signOut }), [authenticated, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
