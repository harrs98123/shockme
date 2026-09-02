import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { BACKEND_FETCH_HEADERS } from '@/lib/backendFetch';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SitemapMedia {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
}

async function fetchIds(endpoint: string): Promise<SitemapMedia[]> {
  try {
    const res = await fetch(`${API_BASE}/movies/${endpoint}`, {
      next: { revalidate: 3600 },
      headers: BACKEND_FETCH_HEADERS,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

interface PublicCollection {
  id: number;
  is_public?: boolean;
}

async function fetchPublicCollections(): Promise<PublicCollection[]> {
  try {
    const res = await fetch(`${API_BASE}/collections`, { next: { revalidate: 3600 }, headers: BACKEND_FETCH_HEADERS });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/browse', priority: 0.8, changeFrequency: 'daily' },
  { path: '/browse/genre', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/browse/category', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/browse/country', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/browse/language', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/browse/anime', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/browse/family', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/browse/awards', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/browse/franchise', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/mood', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/must-watch', priority: 0.8, changeFrequency: 'daily' },
  { path: '/upcoming', priority: 0.8, changeFrequency: 'daily' },
  { path: '/gems', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/tierlist', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/universe', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/finder', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/collections', priority: 0.7, changeFrequency: 'daily' },
  { path: '/predictions', priority: 0.6, changeFrequency: 'weekly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trending, trendingIndian, popular, topRated, anime, series, publicCollections] = await Promise.all([
    fetchIds('trending'),
    fetchIds('trending-indian'),
    fetchIds('popular'),
    fetchIds('top-rated'),
    fetchIds('anime'),
    fetchIds('tv/popular'),
    fetchPublicCollections(),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const seen = new Set<string>();
  const mediaEntries: MetadataRoute.Sitemap = [];

  for (const item of [...trending, ...trendingIndian, ...popular, ...topRated, ...anime, ...series]) {
    if (!item?.id) continue;
    const isTv = item.media_type === 'tv';
    const key = `${isTv ? 'tv' : 'movie'}-${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    mediaEntries.push({
      url: `${SITE_URL}/${isTv ? 'tv' : 'movie'}/${item.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  const collectionEntries: MetadataRoute.Sitemap = publicCollections
    .filter((c) => c.is_public !== false)
    .map((c) => ({
      url: `${SITE_URL}/collections/${c.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

  return [...staticEntries, ...mediaEntries, ...collectionEntries];
}
