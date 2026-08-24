// Shared SEO/AEO helpers: canonical site URL, absolute URL builder, and
// schema.org JSON-LD builders used across metadata and structured-data blocks.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://cinematch-movie.vercel.app'
).replace(/\/$/, '');

export const SITE_NAME = 'plotmint';

export const TMDB_IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
export const TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMG_W780 = 'https://image.tmdb.org/t/p/w780';

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  return path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function posterAbsoluteUrl(posterPath: string | null | undefined, size: 'w500' | 'w780' | 'original' = 'w500'): string | null {
  if (!posterPath) return null;
  const base = size === 'original' ? TMDB_IMG_ORIGINAL : size === 'w780' ? TMDB_IMG_W780 : TMDB_IMG_W500;
  return `${base}${posterPath}`;
}

/** Truncate text to a clean SEO-friendly meta description length. */
export function toDescription(text: string | null | undefined, fallback: string, maxLen = 160): string {
  const source = (text || '').trim();
  if (!source) return fallback;
  if (source.length <= maxLen) return source;
  return `${source.slice(0, maxLen - 1).trimEnd()}…`;
}

export function jsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    __html: JSON.stringify(data),
  };
}

interface MovieLike {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
  genres?: { id: number; name: string }[];
  credits?: {
    cast?: { name: string }[];
    crew?: { name: string; job: string }[];
  };
  original_language?: string;
}

/** Builds a schema.org Movie node for movie detail pages. */
export function buildMovieJsonLd(movie: MovieLike, path: string) {
  const title = movie.title || movie.name || 'Untitled';
  const director = movie.credits?.crew?.find((c) => c.job === 'Director');
  const actors = (movie.credits?.cast || []).slice(0, 8);
  const image = posterAbsoluteUrl(movie.poster_path, 'w780');

  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: title,
    url: absoluteUrl(path),
    ...(movie.overview ? { description: movie.overview } : {}),
    ...(image ? { image } : {}),
    ...(movie.release_date ? { dateCreated: movie.release_date, datePublished: movie.release_date } : {}),
    ...(movie.genres?.length ? { genre: movie.genres.map((g) => g.name) } : {}),
    ...(director ? { director: { '@type': 'Person', name: director.name } } : {}),
    ...(actors.length ? { actor: actors.map((a) => ({ '@type': 'Person', name: a.name })) } : {}),
    ...(movie.runtime ? { duration: `PT${movie.runtime}M` } : {}),
    ...(typeof movie.vote_average === 'number' && movie.vote_average > 0 && movie.vote_count
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: movie.vote_average.toFixed(1),
            ratingCount: movie.vote_count,
            bestRating: '10',
            worstRating: '0',
          },
        }
      : {}),
  };

  return node;
}

/** Builds a schema.org TVSeries node for TV detail pages. */
export function buildTvSeriesJsonLd(tv: MovieLike, path: string) {
  const title = tv.title || tv.name || 'Untitled';
  const image = posterAbsoluteUrl(tv.poster_path, 'w780');
  const actors = (tv.credits?.cast || []).slice(0, 8);

  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: title,
    url: absoluteUrl(path),
    ...(tv.overview ? { description: tv.overview } : {}),
    ...(image ? { image } : {}),
    ...(tv.first_air_date ? { datePublished: tv.first_air_date } : {}),
    ...(tv.genres?.length ? { genre: tv.genres.map((g) => g.name) } : {}),
    ...(actors.length ? { actor: actors.map((a) => ({ '@type': 'Person', name: a.name })) } : {}),
    ...(typeof tv.vote_average === 'number' && tv.vote_average > 0 && tv.vote_count
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: tv.vote_average.toFixed(1),
            ratingCount: tv.vote_count,
            bestRating: '10',
            worstRating: '0',
          },
        }
      : {}),
  };

  return node;
}

interface PersonLike {
  id: number;
  name: string;
  biography?: string;
  profile_path?: string | null;
  birthday?: string | null;
  place_of_birth?: string | null;
  known_for_department?: string;
}

export function buildPersonJsonLd(person: PersonLike, path: string) {
  const image = posterAbsoluteUrl(person.profile_path, 'w500');
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: absoluteUrl(path),
    ...(person.biography ? { description: toDescription(person.biography, '', 500) } : {}),
    ...(image ? { image } : {}),
    ...(person.birthday ? { birthDate: person.birthday } : {}),
    ...(person.place_of_birth ? { birthPlace: person.place_of_birth } : {}),
    ...(person.known_for_department ? { jobTitle: person.known_for_department } : {}),
  };
  return node;
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
