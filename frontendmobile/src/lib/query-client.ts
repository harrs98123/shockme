import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/api/client';

/**
 * Shared query defaults.
 *
 * The web app has no server-state layer — each screen refetches on every mount.
 * These defaults reproduce the freshness the web gets from Next.js's 300s
 * `revalidate` on the movie endpoints, while adding the retry and offline
 * behaviour a mobile client needs.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Matches REVALIDATE_SECONDS in `frontend/app/page.tsx`.
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        // Never retry a request that will fail identically — a 404, a 401, or
        // a rate limit. Only transient failures are worth a second attempt.
        if (error instanceof ApiError && !error.retryable) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      // React Native has no window focus; refetching on app foreground is
      // wired up separately where a screen actually needs it.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});
