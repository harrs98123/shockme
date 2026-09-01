/**
 * TMDB image helpers, ported from `frontend/lib/api.ts`.
 *
 * The web version falls back to `/no-poster.png`; on mobile a missing poster
 * returns `null` so callers can render a real fallback component instead of
 * fetching a placeholder over the network.
 */

export const TMDB_IMG = 'https://image.tmdb.org/t/p';

/** Poster widths TMDB actually serves. Requesting an unsupported size 404s. */
export type PosterSize = 'w185' | 'w342' | 'w500' | 'w780' | 'original';
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';
export type ProfileSize = 'w45' | 'w185' | 'h632' | 'original';

export function posterUrl(
  path: string | null | undefined,
  size: PosterSize = 'w342'
): string | null {
  return path ? `${TMDB_IMG}/${size}${path}` : null;
}

export function backdropUrl(
  path: string | null | undefined,
  size: BackdropSize = 'w780'
): string | null {
  return path ? `${TMDB_IMG}/${size}${path}` : null;
}

export function profileUrl(
  path: string | null | undefined,
  size: ProfileSize = 'w185'
): string | null {
  return path ? `${TMDB_IMG}/${size}${path}` : null;
}

/**
 * Picks a poster width appropriate to the rendered size. Phones render posters
 * at 120–180pt, so `w342` covers a 2x screen without pulling a 500px asset over
 * a mobile connection — the web app always requests `w500`.
 */
export function posterUrlForWidth(
  path: string | null | undefined,
  displayWidth: number,
  scale = 2
): string | null {
  const target = displayWidth * scale;
  const size: PosterSize = target <= 185 ? 'w185' : target <= 342 ? 'w342' : 'w500';
  return posterUrl(path, size);
}
