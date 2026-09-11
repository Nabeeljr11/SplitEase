import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api, ApiError } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, avatarUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const me = await api.get<User>('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
      localStorage.removeItem('splitease_access_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await api.post<{ user: User; accessToken: string }>('/auth/login', {
      email,
      password: pass,
    });
    if (data.accessToken) {
      localStorage.setItem('splitease_access_token', data.accessToken);
    }
    setUser(data.user);
  };

  const signup = async (name: string, email: string, pass: string, avatarUrl?: string) => {
    const data = await api.post<{ user: User; accessToken: string }>('/auth/signup', {
      name,
      email,
      password: pass,
      avatarUrl,
    });
    if (data.accessToken) {
      localStorage.setItem('splitease_access_token', data.accessToken);
    }
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('splitease_access_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
