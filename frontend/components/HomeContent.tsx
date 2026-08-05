'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/HeroSection';
import FeaturedCollections from '@/components/FeaturedCollections';
import MovieRow from '@/components/MovieRow';
import TrendingRankedRow from '@/components/TrendingRankedRow';
import { Movie } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Props {
  trending: Movie[];
  trendingIndian: Movie[];
  popular: Movie[];
  topRated: Movie[];
  anime: Movie[];
  series: Movie[];
}

interface UserLists {
  favIds: number[];
  watchlistIds: number[];
  watchedIds: number[];
}

const EMPTY_LISTS: UserLists = { favIds: [], watchlistIds: [], watchedIds: [] };

async function fetchUserLists(): Promise<UserLists> {
  const token = localStorage.getItem('cinematch_token');
  if (!token) return EMPTY_LISTS;
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
    return EMPTY_LISTS;
  }
}

export default function HomeContent({ trending, trendingIndian, popular, topRated, anime, series }: Props) {
  const [lists, setLists] = useState<UserLists>(EMPTY_LISTS);

  useEffect(() => {
    fetchUserLists().then(setLists);
  }, []);

  const handleToggle = (movieId: number, listType: keyof UserLists) => {
    setLists(prev => {
      const current = prev[listType];
      const updated = current.includes(movieId)
        ? current.filter(id => id !== movieId)
        : [...current, movieId];
      return { ...prev, [listType]: updated };
    });
  };

  const heroSource = trending.length > 0 ? trending : popular;
  const heroMovies = heroSource.slice(0, 8);

  return (
    <>
      {heroMovies.length > 0 && <HeroSection movies={heroMovies} />}

      <div style={{ marginTop: -20, position: 'relative', zIndex: 10 }}>
        <MovieRow
          title="Trending Now"
          movies={trending}
          favIds={lists.favIds}
          watchlistIds={lists.watchlistIds}
          watchedIds={lists.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          seeMoreLink="/catalog/trending"
        />

        <FeaturedCollections />

        <TrendingRankedRow
          title="Trending in India"
          movies={trendingIndian}
          favIds={lists.favIds}
          watchlistIds={lists.watchlistIds}
          watchedIds={lists.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
        />

        <MovieRow
          title="Popular Movies"
          movies={popular}
          favIds={lists.favIds}
          watchlistIds={lists.watchlistIds}
          watchedIds={lists.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          seeMoreLink="/catalog/popular"
        />

        <MovieRow
          title="Top Rated Features"
          movies={topRated}
          favIds={lists.favIds}
          watchlistIds={lists.watchlistIds}
          watchedIds={lists.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          seeMoreLink="/catalog/top-rated"
        />

        <MovieRow
          title="Japanese Anime"
          subtitle="Top picks from the world of animation"
          movies={anime}
          favIds={lists.favIds}
          watchlistIds={lists.watchlistIds}
          watchedIds={lists.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          seeMoreLink="/catalog/anime"
        />

        <MovieRow
          title="Popular TV Series"
          subtitle="Binge-worthy shows you can't miss"
          movies={series}
          favIds={lists.favIds}
          watchlistIds={lists.watchlistIds}
          watchedIds={lists.watchedIds}
          onFavToggle={(m) => handleToggle(m.id, 'favIds')}
          onWatchlistToggle={(m) => handleToggle(m.id, 'watchlistIds')}
          onWatchedToggle={(m) => handleToggle(m.id, 'watchedIds')}
          seeMoreLink="/catalog/series"
        />
      </div>
    </>
  );
}
