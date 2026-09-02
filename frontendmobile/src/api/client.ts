import { AxiosError, create, isAxiosError, type AxiosInstance } from 'axios';

import { env } from '@/config/env';
import { authStore } from '@/stores/auth.store';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Set once a request has been retried after a token refresh. */
    _retried?: boolean;
    /** Set on the refresh call itself so a 401 there cannot recurse. */
    _skipAuthRefresh?: boolean;
  }
}

export const api: AxiosInstance = create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  // Mobile networks are slower and flakier than a desktop browser; the web app
  // relies on the browser default, which is effectively unbounded.
  timeout: 20_000,
});

// ─── Request: attach the bearer token ────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = authStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response: single-flight refresh on 401 ──────────────────────────────────

/**
 * While a refresh is in flight every other 401 waits on the same promise, so a
 * screen firing six parallel requests rotates the token once rather than six
 * times. Rotation is destructive server-side (the old refresh token is revoked),
 * so concurrent refreshes would invalidate each other.
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = authStore.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await api.post<{
      access_token: string;
      refresh_token: string;
    }>(
      '/auth/refresh',
      { refresh_token: refreshToken },
      { _skipAuthRefresh: true }
    );
    await authStore.setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    // The refresh token is expired, revoked, or the network is down. Either way
    // this session cannot be recovered.
    return null;
  }
}

/** ms-since-epoch of a JWT's `exp` claim, or null if it can't be parsed. */
function readJwtExpiry(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    const json = JSON.parse(
      // RN's atob (Hermes) handles standard base64; JWT uses base64url.
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

const PROACTIVE_REFRESH_THRESHOLD_MS = 7 * 24 * 3600 * 1000;

/**
 * Rotates the token pair ahead of expiry. Call on cold start and whenever the
 * app returns to the foreground, so a session that has been idle for weeks is
 * renewed before the access token lapses rather than after a user-visible 401.
 * Cheap and safe to call often: it no-ops unless the token is within a week of
 * expiring, and shares the single-flight promise with the 401 path.
 */
export async function maybeRefreshSession(): Promise<void> {
  const token = authStore.getAccessToken();
  if (!token || !authStore.getRefreshToken()) return;

  const expiry = readJwtExpiry(token);
  if (expiry !== null && expiry - Date.now() > PROACTIVE_REFRESH_THRESHOLD_MS) {
    return;
  }

  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  const next = await refreshPromise;

  // Only tear down the session if the access token is genuinely dead. A failed
  // refresh while merely offline must not sign out a user whose token is still
  // valid for weeks — the reactive 401 path will retry later.
  if (!next && expiry !== null && expiry <= Date.now()) {
    await authStore.clear();
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config;

    const shouldRefresh =
      error.response?.status === 401 &&
      config != null &&
      !config._retried &&
      !config._skipAuthRefresh &&
      authStore.getRefreshToken() != null;

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    config._retried = true;

    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const newToken = await refreshPromise;

    if (!newToken) {
      // Signing out flips the auth store to `guest`; the root AuthGate reacts
      // by redirecting to the login screen. Navigation is deliberately not
      // triggered from here, so this module stays free of router imports.
      await authStore.clear();
      return Promise.reject(error);
    }

    config.headers.Authorization = `Bearer ${newToken}`;
    return api(config);
  }
);

// ─── Error normalization ─────────────────────────────────────────────────────

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'rateLimited'
  | 'server'
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** True when retrying the same request could plausibly succeed. */
  readonly retryable: boolean;

  constructor(message: string, kind: ApiErrorKind, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.retryable = kind === 'network' || kind === 'timeout' || kind === 'server';
  }
}

/** FastAPI returns `{ detail: string }`, or a validation array on 422. */
function readDetail(data: unknown): string | null {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const first = detail[0];
      if (first && typeof first === 'object' && 'msg' in first) {
        const msg = (first as { msg: unknown }).msg;
        if (typeof msg === 'string') return msg;
      }
    }
  }
  return null;
}

/**
 * Turns anything thrown by axios into an `ApiError` with a message worth
 * showing a user. Screens render `error.message` directly.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError('That took too long. Check your connection and try again.', 'timeout');
    }
    if (!error.response) {
      return new ApiError("Can't reach plotmint. Check your internet connection.", 'network');
    }

    const status = error.response.status;
    const detail = readDetail(error.response.data);

    if (status === 401) {
      return new ApiError(detail ?? 'Please sign in to continue.', 'unauthorized', status);
    }
    if (status === 403) {
      return new ApiError(detail ?? "You don't have access to this.", 'forbidden', status);
    }
    if (status === 404) {
      return new ApiError(detail ?? "We couldn't find that.", 'notFound', status);
    }
    if (status === 429) {
      return new ApiError(
        detail ?? 'Too many attempts. Please wait a moment and try again.',
        'rateLimited',
        status
      );
    }
    if (status >= 500) {
      return new ApiError(
        detail ?? 'Something went wrong on our end. Please try again.',
        'server',
        status
      );
    }
    return new ApiError(detail ?? 'Something went wrong. Please try again.', 'unknown', status);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 'unknown');
  }
  return new ApiError('Something went wrong. Please try again.', 'unknown');
}

/** Wraps a request so callers only ever have to catch `ApiError`. */
export async function request<T>(fn: () => Promise<{ data: T }>): Promise<T> {
  try {
    const { data } = await fn();
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}
