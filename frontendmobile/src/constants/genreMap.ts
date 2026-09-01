/**
 * TMDB genre-id → human-readable name map.
 * Covers both movie and TV genre IDs (they differ for some IDs).
 * Ported from the inline map in `frontend/components/MovieCard.tsx`.
 */
export const GENRE_MAP: Record<number, string> = {
  // Movie genres
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  // TV-specific genres
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
} as const;

/** Returns the first 1–2 genre names for a media item. */
export function getGenreNames(
  genreIds: number[] | undefined,
  limit = 2
): string[] {
  if (!genreIds || genreIds.length === 0) return [];
  return genreIds
    .map((id) => GENRE_MAP[id])
    .filter(Boolean)
    .slice(0, limit);
}
