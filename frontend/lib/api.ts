import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearSession, getToken, refreshAccessToken } from '@/lib/session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type RetriableConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
  _skipAuthRefresh?: boolean;
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401, try a silent token refresh and replay the request once. Only when
// that fails (no refresh token, or it's expired/revoked) do we end the session.
// A single transient 401 no longer logs the user out.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (
      status !== 401 ||
      typeof window === 'undefined' ||
      !config ||
      config._retried ||
      config._skipAuthRefresh
    ) {
      return Promise.reject(error);
    }

    config._retried = true;
    const newToken = await refreshAccessToken();

    if (newToken) {
      config.headers.Authorization = `Bearer ${newToken}`;
      return api(config);
    }

    const isAuthRoute =
      window.location.pathname.startsWith('/login') ||
      window.location.pathname.startsWith('/register');
    clearSession();
    if (!isAuthRoute) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── TMDB image helpers ────────────────────────────────────────────────────
export const TMDB_IMG = 'https://image.tmdb.org/t/p';

export function posterUrl(path: string | null | undefined, size = 'w500'): string {
  if (!path) return '/no-poster.png';
  return `${TMDB_IMG}/${size}${path}`;
}

export function backdropUrl(path: string | null | undefined, size = 'w1280'): string {
  if (!path) return '/no-backdrop.jpg';
  return `${TMDB_IMG}/${size}${path}`;
}

export function releaseYear(date: string | undefined | null): string {
  if (!date) return 'N/A';
  return date.slice(0, 4);
}

// ─── Admin Services ─────────────────────────────────────────────────────────

export const adminApi = {
  tmdbSearch: (query: string) => api.get(`/admin/tmdb/search?q=${encodeURIComponent(query)}`).then(res => res.data),
  searchMovies: (query: string) => api.get(`/admin/tmdb/search?q=${encodeURIComponent(query)}`).then(res => res.data),
  getMustWatch: () => api.get('/admin/must-watch').then(res => res.data),
  addMustWatch: (data: any) => api.post('/admin/must-watch', payloadToMustWatch(data)).then(res => res.data),
  removeMustWatch: (movieId: number) => api.delete(`/admin/must-watch/${movieId}`).then(res => res.data),
};

// Helper for converting TMDB/Media object to MustWatch Create shape
function payloadToMustWatch(m: any) {
  return {
    movie_id: m.id || m.movie_id,
    title: m.title || m.name,
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    vote_average: m.vote_average,
    release_date: m.release_date || m.first_air_date,
    overview: m.overview
  };
}

// ─── Public Services ────────────────────────────────────────────────────────

export const publicApi = {
  getMustWatch: () => api.get('/admin/must-watch/public').then(res => res.data),
  getPersonDetails: (id: string) => api.get(`/movies/person/${id}`).then(res => res.data),
  getCustomInfo: (id: number) => api.get(`/movies/${id}/custom-info`).then(res => res.data),
};
