import { create } from 'zustand';

import { StorageKeys } from '@/config/env';
import { cache, secureStorage } from '@/lib/storage';
import type { User } from '@/types';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  /** Reads persisted tokens on launch. Call once, from the root layout. */
  restore: () => Promise<void>;
  /** Persists a fresh login/registration result. */
  signIn: (params: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => Promise<void>;
  /** Swaps in a rotated token pair after a successful /auth/refresh. */
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  /** Updates the cached user (profile edit, /auth/me revalidation). */
  setUser: (user: User) => Promise<void>;
  /** Clears the session locally. The network logout call lives in useAuth. */
  clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  refreshToken: null,

  restore: async () => {
    const [accessToken, refreshToken, user] = await Promise.all([
      secureStorage.get(StorageKeys.accessToken),
      secureStorage.get(StorageKeys.refreshToken),
      cache.getJson<User>(StorageKeys.user),
    ]);

    // A token with no cached user is still a valid session — `/auth/me` fills
    // in the user shortly after boot.
    if (accessToken) {
      set({ status: 'authenticated', accessToken, refreshToken, user });
    } else {
      set({ status: 'guest', accessToken: null, refreshToken: null, user: null });
    }
  },

  signIn: async ({ accessToken, refreshToken, user }) => {
    await Promise.all([
      secureStorage.set(StorageKeys.accessToken, accessToken),
      secureStorage.set(StorageKeys.refreshToken, refreshToken),
      cache.setJson(StorageKeys.user, user),
    ]);
    set({ status: 'authenticated', accessToken, refreshToken, user });
  },

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      secureStorage.set(StorageKeys.accessToken, accessToken),
      secureStorage.set(StorageKeys.refreshToken, refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },

  setUser: async (user) => {
    await cache.setJson(StorageKeys.user, user);
    set({ user });
  },

  clear: async () => {
    await Promise.all([
      secureStorage.remove(StorageKeys.accessToken),
      secureStorage.remove(StorageKeys.refreshToken),
      cache.remove(StorageKeys.user),
    ]);
    set({ status: 'guest', user: null, accessToken: null, refreshToken: null });
  },
}));

/**
 * Non-hook accessors. The axios interceptor runs outside React, which is the
 * reason the session lives in Zustand rather than in a Context.
 */
export const authStore = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: (access: string, refresh: string) =>
    useAuthStore.getState().setTokens(access, refresh),
  clear: () => useAuthStore.getState().clear(),
};
