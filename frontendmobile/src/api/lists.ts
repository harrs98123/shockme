import { api, request } from '@/api/client';
import type {
  FavoriteItem,
  Media,
  MoviePayload,
  WatchedItem,
  WatchlistItem,
} from '@/types';
import { posterUrl } from '@/lib/images';
import { getEnglishTitle, releaseYear, resolveMediaType } from '@/lib/format';

/**
 * `/favorites`, `/watchlist` and `/watched` — three routers with an identical
 * surface (`GET ""`, `POST ""`, `DELETE /{movie_id}`, `GET /ids`), so they share
 * one factory here rather than three near-copies of the same file.
 */

export type ListName = 'favorites' | 'watchlist' | 'watched';

/**
 * Builds the POST body these endpoints expect. The web app assembles this
 * inline at four different call sites and drops `backdrop_path` in two of them,
 * so saved rows are inconsistent; deriving it once here fixes that.
 */
export function toMoviePayload(media: Media): MoviePayload {
  return {
    movie_id: media.id,
    media_type: resolveMediaType(media),
    title: getEnglishTitle(media),
    poster_path: media.poster_path,
    backdrop_path: media.backdrop_path,
    release_year: releaseYear(media),
    vote_average: media.vote_average ?? null,
  };
}

function createListApi<T>(name: ListName) {
  const base = `/${name}`;
  return {
    all: () => request<T[]>(() => api.get(base)),

    /** Just the movie ids, for card membership checks. */
    ids: () => request<number[]>(() => api.get(`${base}/ids`)),

    /**
     * Adds an item. The backend answers 400 when the row already exists; the
     * web app treats that as success, and so do we — the desired end state
     * (the item is on the list) holds either way.
     */
    add: async (media: Media): Promise<void> => {
      try {
        await api.post(base, toMoviePayload(media));
      } catch (error) {
        const status =
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
        if (status !== 400) throw error;
      }
    },

    /** Removes an item. Responds 204. */
    remove: (movieId: number) => request<void>(() => api.delete(`${base}/${movieId}`)),
  };
}

export const favoritesApi = createListApi<FavoriteItem>('favorites');
export const watchlistApi = createListApi<WatchlistItem>('watchlist');
export const watchedApi = createListApi<WatchedItem>('watched');

/** Poster URL for a saved list row, which stores only the TMDB path. */
export function listItemPoster(item: FavoriteItem): string | null {
  return posterUrl(item.poster_path);
}

// ─── Interests (upcoming titles) ─────────────────────────────────────────────

export interface InterestPayload {
  movie_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
}

export const interestsApi = {
  /** Count plus whether the caller is interested. Works unauthenticated. */
  get: (movieId: number, userId?: number) =>
    request<{ count: number; user_interested: boolean }>(() =>
      api.get(`/interests/${movieId}`, { params: userId ? { user_id: userId } : undefined })
    ),

  toggle: (payload: InterestPayload) =>
    request<{ count: number; user_interested: boolean }>(() =>
      api.post('/interests/toggle', payload)
    ),

  userAll: () =>
    request<any[]>(() => api.get('/interests/user/all')),
};

// ─── User Profile Social & Content APIs ──────────────────────────────────────

export const reviewsApi = {
  my: () => request<any[]>(() => api.get('/moctale/my')),
  delete: (movieId: number) => request<void>(() => api.delete(`/moctale/${movieId}`)),
};

export const userCollectionsApi = {
  my: () => request<any[]>(() => api.get('/collections/my')),
};

export const userPostsApi = {
  my: () => request<any[]>(() => api.get('/groups/my/posts')),
};

export const tierlistsApi = {
  all: () => request<any[]>(() => api.get('/tierlist/all')),
};

