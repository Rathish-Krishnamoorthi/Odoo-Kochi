import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CustomerProfile, UserRole } from '../types';
import { apiRequest, setAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: CustomerProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!getAuthToken()) {
        // Automatically default to Admin demo user if no session
        await switchDemoRole('ADMIN');
        return;
      }
      const data = await apiRequest<{ user: User; profile: any }>('/auth/me');
      setUser(data.user);
      setProfile(data.profile);
    } catch (err) {
      console.warn('Session expired or invalid, auto-logging into demo ADMIN', err);
      await switchDemoRole('ADMIN');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
      // Fetch full profile
      const meData = await apiRequest<{ user: User; profile: any }>('/auth/me');
      setProfile(meData.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
      const meData = await apiRequest<{ user: User; profile: any }>('/auth/me');
      setProfile(meData.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      let email = 'admin@brightloop.io';
      if (role === 'STAFF') email = 'staff@brightloop.io';
      if (role === 'CUSTOMER') email = 'customer@acme.com';

      const data = await apiRequest<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'Brightloop@2026!' }),
      });
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
      const meData = await apiRequest<{ user: User; profile: any }>('/auth/me');
      setProfile(meData.profile);
    } catch (err) {
      console.error('Failed to switch demo role', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
