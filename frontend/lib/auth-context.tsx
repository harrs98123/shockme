'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import {
  TOKEN_KEY,
  USER_KEY,
  clearSession,
  ensureFreshToken,
  persistSession,
} from '@/lib/session';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, refreshToken?: string | null) => void;
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
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Renew now if the token is within a week of expiring, so an active
        // user's 30-day session keeps rolling and never dead-ends mid-use.
        ensureFreshToken()
          .then(() => {
            const refreshed = localStorage.getItem(TOKEN_KEY);
            if (refreshed && refreshed !== savedToken) setToken(refreshed);
          })
          .catch(() => {});
      } catch {
        clearSession();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (tok: string, u: User, refreshToken?: string | null) => {
    setToken(tok);
    setUser(u);
    persistSession(tok, u, refreshToken);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    clearSession();
    window.location.href = '/';
  };

  const updateUser = (u: User) => {
    setUser(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
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
