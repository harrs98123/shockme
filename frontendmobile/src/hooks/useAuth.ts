import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { authApi, type LoginPayload, type RegisterPayload } from '@/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthToken, User } from '@/types';

/**
 * Session API for screens. Replaces `useAuth()` from
 * `frontend/lib/auth-context.tsx`, with two differences:
 * refresh tokens are persisted and used, and the Query cache is cleared on
 * sign-out so one user's data can never appear under another's session.
 */
export function useAuth() {
  const queryClient = useQueryClient();

  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const signInToStore = useAuthStore((s) => s.signIn);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const persist = useCallback(
    async (result: AuthToken) => {
      await signInToStore({
        accessToken: result.access_token,
        // A null refresh token still yields a usable session; it just cannot be
        // renewed, so the user is asked to sign in again when it expires.
        refreshToken: result.refresh_token ?? '',
        user: result.user,
      });
    },
    [signInToStore]
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await authApi.login(payload);
      await persist(result);
      return result.user;
    },
    [persist]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await authApi.register(payload);
      await persist(result);
      return result.user;
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      // Best effort: revoke server-side. A failure here (offline, already
      // expired) must not block clearing the local session.
      await authApi.logout();
    } catch {
      // Intentionally ignored.
    }
    await clear();
    queryClient.clear();
  }, [clear, queryClient]);

  const updateUser = useCallback((next: User) => setUser(next), [setUser]);

  return {
    status,
    user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    login,
    register,
    logout,
    updateUser,
  };
}
