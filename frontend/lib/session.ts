import axios from 'axios';
import { User } from '@/lib/types';

/**
 * Single source of truth for the browser-side session: token storage, the
 * 30-day cookie the proxy reads, and the silent refresh used to keep an active
 * user signed in for a rolling 30 days.
 *
 * This lives outside React (the axios interceptor in `api.ts` uses it) so it
 * touches `localStorage` / `document.cookie` directly, the same way the rest of
 * the app already does.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const TOKEN_KEY = 'cinematch_token';
export const REFRESH_KEY = 'cinematch_refresh_token';
export const USER_KEY = 'cinematch_user';

/** Renew the access token once it drops below this much remaining lifetime. */
const REFRESH_THRESHOLD_MS = 7 * 24 * 3600 * 1000;
const COOKIE_MAX_AGE = 30 * 24 * 3600;

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

function setSessionCookie(token: string): void {
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function persistSession(token: string, user: User, refreshToken?: string | null): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  setSessionCookie(token);
}

/** Swap in a freshly rotated token pair without touching the cached user. */
export function persistTokens(token: string, refreshToken?: string | null): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  setSessionCookie(token);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

/** ms-since-epoch of a JWT's `exp`, or null if it can't be read. */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

// A refresh rotates the token server-side, so overlapping calls would revoke
// each other. Every caller awaits the same in-flight promise.
let refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    persistTokens(data.access_token, data.refresh_token);
    return data.access_token as string;
  } catch {
    // Expired, revoked, or offline — the caller decides whether to sign out.
    return null;
  }
}

/**
 * Called on app load: if the access token is close to expiring, rotate it now
 * so an active user's 30-day window keeps sliding forward and they never hit a
 * hard logout mid-session.
 */
export async function ensureFreshToken(): Promise<void> {
  const token = getToken();
  if (!token || !getRefreshToken()) return;
  const exp = getTokenExpiry(token);
  if (exp === null) return;
  if (exp - Date.now() < REFRESH_THRESHOLD_MS) {
    await refreshAccessToken();
  }
}
