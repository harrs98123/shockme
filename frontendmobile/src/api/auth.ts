import { api, request } from '@/api/client';
import type { AuthToken, User } from '@/types';

/**
 * `/auth` endpoints. Request and response shapes mirror `backend/auth/router.py`
 * exactly — `login_id` accepts either an email or a username, and both login and
 * register require a Turnstile token.
 */

export interface LoginPayload {
  login_id: string;
  password: string;
  turnstile_token: string;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  turnstile_token: string;
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
    request<AuthToken>(() => api.post('/auth/login', payload)),

  register: (payload: RegisterPayload) =>
    request<AuthToken>(() => api.post('/auth/register', payload)),

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
