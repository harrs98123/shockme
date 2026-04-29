'use client';

import { useState, useEffect, useRef } from 'react';
import HeroSection from '@/components/HeroSection';
import HeroSkeleton from '@/components/HeroSkeleton';
import FeaturedCollections from '@/components/FeaturedCollections';
import MovieRow from '@/components/MovieRow';
import TrendingRankedRow from '@/components/TrendingRankedRow';

import { Movie } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const CACHE_KEY = 'cinematch_home_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface HomeData {
  trending: Movie[];
  trendingIndian: Movie[];
  popular: Movie[];
  topRated: Movie[];
  anime: Movie[];
  series: Movie[];
  favIds: number[];
  watchlistIds: number[];
  watchedIds: number[];
  cachedAt: number;
}

const INITIAL_DATA: HomeData = {
  trending: [],
  trendingIndian: [],
  popular: [],
  topRated: [],
  anime: [],
  series: [],
  favIds: [],
  watchlistIds: [],
  watchedIds: [],
  cachedAt: 0,
};

async function fetchMovies(endpoint: string): Promise<Movie[]> {
  try {
    const res = await fetch(`${API_BASE}/movies/${endpoint}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

async function fetchUserLists() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cinematch_token') : null;
  if (!token) return { favIds: [], watchlistIds: [], watchedIds: [] };
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const [favRes, watchRes, watchedRes] = await Promise.all([
      fetch(`${API_BASE}/favorites/ids`, { headers }),
      fetch(`${API_BASE}/watchlist/ids`, { headers }),
      fetch(`${API_BASE}/watched/ids`, { headers }),
    ]);
    return {
      favIds: favRes.ok ? await favRes.json() : [],
      watchlistIds: watchRes.ok ? await watchRes.json() : [],
      watchedIds: watchedRes.ok ? await watchedRes.json() : [],
    };
  } catch {
    return { favIds: [], watchlistIds: [], watchedIds: [] };
  }
}

function getCache(): HomeData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: HomeData = JSON.parse(raw);
    if (Date.now() - data.cachedAt > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    // Relaxed validation: just ensure the object is somewhat valid
    if (!data.trending) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(data: HomeData) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage quota exceeded – silently ignore
  }
}

export default function HomePage() {
  const [data, setData] = useState<HomeData>(INITIAL_DATA);
  const [sectionLoading, setSectionLoading] = useState({
    trending: true,
    trendingIndian: true,
    popular: true,
    topRated: true,
    anime: true,
    series: true,
  });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const cached = getCache();
    if (cached) {
      setData(cached);
      setSectionLoading({
        trending: false,
        trendingIndian: false,
        popular: false,
        topRated: false,
        anime: false,
        series: false,
      });
      return;
    }

    // Incremental Fetching
    const loadSection = async (key: keyof HomeData, endpoint: string) => {
      const results = await fetchMovies(endpoint);
      setData(prev => ({ ...prev, [key]: results }));
      setSectionLoading(prev => ({ ...prev, [key]: false }));
    };

    // Load User Lists first (fast, usually)
    (async () => {
      const lists = await fetchUserLists();
      setData(prev => ({ ...prev, ...lists }));
    })();

    // Priority 1: Trending for Hero
    loadSection('trending', 'trending');

    // Priority 2: Other rows in parallel
    loadSection('trendingIndian', 'trending-indian');
    loadSection('popular', 'popular');
    loadSection('topRated', 'top-rated');
    loadSection('anime', 'anime');
    loadSection('series', 'tv/popular');

  }, []);

  // Update cache whenever data changes (debounced or just when everything is loaded)
  useEffect(() => {
    const isDone = !Object.values(sectionLoading).some(l => l);
    if (isDone && data.cachedAt === 0) {
      const finalData = { ...data, cachedAt: Date.now() };
      setData(finalData);
      setCache(finalData);
    }
  }, [sectionLoading, data]);

  const handleToggle = (movieId: number, listType: 'favIds' | 'watchlistIds' | 'watchedIds') => {
    const newList = data[listType].includes(movieId)
      ? data[listType].filter(id => id !== movieId)
      : [...data[listType], movieId];

    const newData = { ...data, [listType]: newList };
    setData(newData);
    setCache(newData);
  };

  const heroMovies = data.trending.slice(0, 5);
  const remainingTrending = data.trending.slice(5);

  return (
    <>
      {sectionLoading.trending ? (
        <HeroSkeleton />
      ) : (
        heroMovies.length > 0 && <HeroSection movies={heroMovies} />
      )}

      <div style={{ marginTop: -20, position: 'relative', zIndex: 10 }}>

        <MovieRow
          title="Trending Now"
          movies={remainingTrending}
          favIds={data.favIds}
          watchlistIds={data.watchlistIds}
          watchedIds={data.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          seeMoreLink="/catalog/trending"
          loading={sectionLoading.trending}
        />

        <FeaturedCollections />
        <TrendingRankedRow
          title="Trending in India"
          movies={data.trendingIndian}
          favIds={data.favIds}
          watchlistIds={data.watchlistIds}
          watchedIds={data.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          loading={sectionLoading.trendingIndian}
        />

        <MovieRow
          title="Popular Movies"
          movies={data.popular}
          favIds={data.favIds}
          watchlistIds={data.watchlistIds}
          watchedIds={data.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          seeMoreLink="/catalog/popular"
          loading={sectionLoading.popular}
        />

        <MovieRow
          title="Top Rated Features"
          movies={data.topRated}
          favIds={data.favIds}
          watchlistIds={data.watchlistIds}
          watchedIds={data.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          seeMoreLink="/catalog/top-rated"
          loading={sectionLoading.topRated}
        />

        <MovieRow
          title="Japanese Anime"
          subtitle="Top picks from the world of animation"
          movies={data.anime}
          favIds={data.favIds}
          watchlistIds={data.watchlistIds}
          watchedIds={data.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          seeMoreLink="/catalog/anime"
          loading={sectionLoading.anime}
        />

        <MovieRow
          title="Popular TV Series"
          subtitle="Binge-worthy shows you can't miss"
          movies={data.series}
          favIds={data.favIds}
          watchlistIds={data.watchlistIds}
          watchedIds={data.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          seeMoreLink="/catalog/series"
          loading={sectionLoading.series}
        />
      </div>
    </>
  );
}
