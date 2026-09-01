import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/api/client';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Validates a restored session against the server.
 *
 * On a cold start the app trusts SecureStore so the UI can paint immediately.
 * This then calls `/auth/me` in the background to confirm the token is still
 * good and to refresh the cached user (name, avatar, admin flag) if it changed
 * on another device.
 *
 * A 401 here is already handled by the axios interceptor — it attempts a
 * refresh and clears the session if that fails — so this hook only has to worry
 * about syncing the user object.
 *
 * Mount once, from the root layout.
 */
export function useSessionSync() {
  const status = useAuthStore((s) => s.status);
  const setUser = useAuthStore((s) => s.setUser);

  const { data, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: status === 'authenticated',
    // The cached user is good enough for a session; re-check on relaunch.
    staleTime: Infinity,
    retry: (failureCount, err) =>
      err instanceof ApiError && err.retryable && failureCount < 2,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    // An offline failure must not sign the user out — they keep the cached
    // session. Only an unrecoverable 401 clears it, and the interceptor owns
    // that path.
    if (error instanceof ApiError && error.kind === 'unauthorized') {
      useAuthStore.getState().clear();
    }
  }, [error]);
}
