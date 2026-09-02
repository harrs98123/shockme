import HomeContent from '@/components/HomeContent';
import { Movie } from '@/lib/types';
import { BACKEND_FETCH_HEADERS } from '@/lib/backendFetch';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// How long Next.js caches each fetch on the server before revalidating.
// Shared across every visitor — far more effective than the old per-browser
// sessionStorage cache, and the data is already in the HTML on first paint.
// 1 hour: trending/popular lists shift on a daily cadence at most, so a
// 5-minute window was regenerating and re-transferring this route ~12x/hour
// for no freshness benefit.
const REVALIDATE_SECONDS = 3600;

// Serve the whole route as ISR from the CDN between revalidations.
export const revalidate = 3600;

async function fetchMovies(endpoint: string): Promise<Movie[]> {
  try {
    const res = await fetch(`${API_BASE}/movies/${endpoint}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: BACKEND_FETCH_HEADERS,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [trending, trendingIndian, popular, topRated, anime, series] = await Promise.all([
    fetchMovies('trending'),
    fetchMovies('trending-indian'),
    fetchMovies('popular'),
    fetchMovies('top-rated'),
    fetchMovies('anime'),
    fetchMovies('tv/popular'),
  ]);

  return (
    <HomeContent
      trending={trending}
      trendingIndian={trendingIndian}
      popular={popular}
      topRated={topRated}
      anime={anime}
      series={series}
    />
  );
}
