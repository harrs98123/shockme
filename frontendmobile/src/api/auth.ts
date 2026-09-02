import { api, request } from '@/api/client';
import type { AuthToken, User } from '@/types';

/**
 * `/auth` endpoints. Request and response shapes mirror `backend/auth/router.py`
 * exactly — `login_id` accepts either an email or a username.
 *
 * The mobile app does not run Cloudflare Turnstile: there is no native SDK and
 * the WebView-hosted widget was a poor fit on a phone form. `/register` and
 * `/login` still require a non-empty `turnstile_token` field (the web app mints
 * a real one), so the client sends `CAPTCHA_TOKEN` — a literal `validate_turnstile`
 * accepts without calling Cloudflare. Abuse protection on mobile comes from the
 * server instead: per-IP rate limits (5/min register, 10/min login), account
 * lockout after repeated failures, and password-strength enforcement.
 */

/** Backend sentinel accepted by `validate_turnstile` without a Cloudflare call. */
const CAPTCHA_TOKEN = 'PASSTHROUGH_FALLBACK';

export interface LoginPayload {
  login_id: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface UsernameCheck {
  available: boolean;
  /** Alternatives when the name is taken; always present, often empty. */
  suggestions: string[];
}

export interface ProfileUpdate {
  name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<AuthToken>(() =>
      api.post('/auth/login', { ...payload, turnstile_token: CAPTCHA_TOKEN })
    ),

  register: (payload: RegisterPayload) =>
    request<AuthToken>(() =>
      api.post('/auth/register', { ...payload, turnstile_token: CAPTCHA_TOKEN })
    ),

  /** Current user for the bearer token. Used to validate a restored session. */
  me: () => request<User>(() => api.get('/auth/me')),

  checkUsername: (username: string) =>
    request<UsernameCheck>(() =>
      api.get('/auth/check-username', { params: { username } })
    ),

  updateProfile: (payload: ProfileUpdate) =>
    request<User>(() => api.patch('/auth/profile', payload)),

  /** Blacklists the access token and revokes every refresh token server-side. */
  logout: () => request<{ message: string }>(() => api.post('/auth/logout')),

  forgotPassword: (email: string) =>
    request<{ message: string }>(() => api.post('/auth/forgot-password', { email })),

  verifyCode: (email: string, code: string) =>
    request<{ message: string }>(() => api.post('/auth/verify-code', { email, code })),

  resetPassword: (email: string, code: string, new_password: string) =>
    request<{ message: string }>(() =>
      api.post('/auth/reset-password', { email, code, new_password })
    ),
};
