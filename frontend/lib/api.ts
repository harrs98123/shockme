import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cinematch_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthRoute =
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register');
      if (!isAuthRoute) {
        localStorage.removeItem('cinematch_token');
        localStorage.removeItem('cinematch_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── TMDB image helpers ────────────────────────────────────────────────────
export const TMDB_IMG = 'https://image.tmdb.org/t/p';

export function posterUrl(path: string | null, size = 'w500'): string {
  if (!path) return '/no-poster.png';
  return `${TMDB_IMG}/${size}${path}`;
}

export function backdropUrl(path: string | null, size = 'w1280'): string {
  if (!path) return '/no-backdrop.jpg';
  return `${TMDB_IMG}/${size}${path}`;
}

export function releaseYear(date: string | undefined | null): string {
  if (!date) return 'N/A';
  return date.slice(0, 4);
}

// ─── Admin Services ─────────────────────────────────────────────────────────

export const adminApi = {
  tmdbSearch: (query: string) => api.get(`/admin/tmdb/search?q=${query}`).then(res => res.data),
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
