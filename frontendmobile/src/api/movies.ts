import { api, request } from '@/api/client';
import type { Media, PersonDetails, TMDBResponse } from '@/types';

/**
 * `/movies` endpoints, mirroring `backend/movies/router.py`.
 *
 * Every list endpoint takes a 1-indexed `page` and returns the raw TMDB
 * envelope (`results` / `page` / `total_pages`), which is what the paging hooks
 * expect. `/movies/{id}` already includes credits, videos, similar, images,
 * providers and certifications via `append_to_response`, so a detail screen
 * needs exactly one request.
 */

export interface DiscoverParams {
  with_genres?: string;
  with_origin_country?: string;
  with_original_language?: string;
  with_keywords?: string;
  with_companies?: string;
  vote_average_gte?: number;
  vote_count_gte?: number;
  vote_count_lte?: number;
  primary_release_year?: number;
  primary_release_date_gte?: string;
  primary_release_date_lte?: string;
  sort_by?: string;
  page?: number;
}

export interface CustomInfo {
  trailer_url: string | null;
  is_must_watch: boolean;
  is_gem: boolean;
}

export interface GenreList {
  genres: { id: number; name: string }[];
}

const list = (path: string, params?: Record<string, unknown>) =>
  request<TMDBResponse>(() => api.get(path, { params }));

export const moviesApi = {
  trending: (page = 1) => list('/movies/trending', { page }),
  trendingIndian: (page = 1) => list('/movies/trending-indian', { page }),
  popular: (page = 1) => list('/movies/popular', { page }),
  topRated: (page = 1) => list('/movies/top-rated', { page }),
  anime: (page = 1) => list('/movies/anime', { page }),
  upcoming: (params?: { region?: string; month?: number; year?: number; page?: number } | number) =>
    typeof params === 'number'
      ? list('/movies/upcoming', { page: params })
      : list('/movies/upcoming', { page: 1, ...params }),

  /** Multi-search: returns movies, TV shows and people interleaved. */
  search: (q: string, page = 1) => list('/movies/search', { q, page }),

  discover: (params: DiscoverParams = {}) => list('/movies/discover', { page: 1, ...params }),

  genres: (mediaType: 'movie' | 'tv' = 'movie') =>
    request<GenreList>(() => api.get('/movies/genres', { params: { media_type: mediaType } })),

  languages: () => request<{ iso_639_1: string; english_name: string; name: string }[]>(
    () => api.get('/movies/languages')
  ),

  countries: () => request<{ iso_3166_1: string; english_name: string }[]>(
    () => api.get('/movies/countries')
  ),

  /**
   * Full detail. `media_type` selects the TMDB path — omit it for movies, pass
   * `'tv'` for shows. The response shape differs slightly between the two
   * (`name`/`first_air_date` instead of `title`/`release_date`).
   */
  detail: (id: number | string, mediaType: 'movie' | 'tv' = 'movie') =>
    request<Media>(() => api.get(`/movies/${id}`, { params: { media_type: mediaType } })),

  /** Editor-curated trailer and badge overrides from our own DB. */
  customInfo: (id: number | string) =>
    request<CustomInfo>(() => api.get(`/movies/${id}/custom-info`)),

  person: (id: number | string) =>
    request<PersonDetails>(() => api.get(`/movies/person/${id}`)),
};

export const tvApi = {
  trending: (page = 1) => list('/movies/tv/trending', { page }),
  popular: (page = 1) => list('/movies/tv/popular', { page }),
  topRated: (page = 1) => list('/movies/tv/top-rated', { page }),
  discover: (params: DiscoverParams = {}) =>
    list('/movies/tv/discover', { page: 1, ...params }),
  season: (tvId: number | string, seasonNumber: number) =>
    request<import('@/types').SeasonDetails>(() =>
      api.get(`/movies/tv/${tvId}/season/${seasonNumber}`)
    ),
};
