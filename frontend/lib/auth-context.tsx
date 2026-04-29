'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('cinematch_token');
    const savedUser = localStorage.getItem('cinematch_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('cinematch_token');
        localStorage.removeItem('cinematch_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (tok: string, u: User) => {
    setToken(tok);
    setUser(u);
    localStorage.setItem('cinematch_token', tok);
    localStorage.setItem('cinematch_user', JSON.stringify(u));
    // Also set cookie for proxy.ts auth guard
    document.cookie = `cinematch_token=${tok}; path=/; max-age=${7 * 24 * 3600}`;
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cinematch_token');
    localStorage.removeItem('cinematch_user');
    document.cookie = 'cinematch_token=; path=/; max-age=0';
    window.location.href = '/';
  };

  const updateUser = (u: User) => {
    setUser(u);
    localStorage.setItem('cinematch_user', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
