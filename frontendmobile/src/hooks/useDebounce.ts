import { useEffect, useState } from 'react';

/**
 * Delays a rapidly changing value, ported from the inline `useDebounce` in
 * `frontend/app/search/page.tsx`. Used for search input and the
 * username-availability check.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
