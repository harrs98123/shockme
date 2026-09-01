import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';

import { LoadingState } from '@/components/layout/States';
import { Screen } from '@/components/layout/Screen';
import { useAuthStore } from '@/stores/auth.store';

interface Props {
  children: React.ReactNode;
  /** Rendered while redirecting, so guests never glimpse protected content. */
  fallback?: React.ReactNode;
}

/**
 * Guards a subtree behind a session.
 *
 * The web app has no working middleware guard (`proxy.ts` ships with an empty
 * matcher); each protected page redirects from its own `useEffect`. This
 * centralises that, and preserves the `?from=` round-trip so a user lands back
 * where they were after signing in.
 */
export function AuthGate({ children, fallback }: Props) {
  const status = useAuthStore((s) => s.status);
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'guest') {
      router.replace({
        pathname: '/(auth)/login',
        params: { from: pathname },
      });
    }
  }, [status, pathname]);

  if (status === 'authenticated') return <>{children}</>;

  return (
    <>
      {fallback ?? (
        <Screen>
          <LoadingState label={status === 'loading' ? 'Restoring your session…' : ''} />
        </Screen>
      )}
    </>
  );
}
