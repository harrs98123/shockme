'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CATALOG_TYPE_MAP } from '@/lib/catalogTypes';

export default function CatalogClient() {
  return (
    <Suspense fallback={<div className="section container" style={{ paddingTop: 120, textAlign: 'center' }}><div className="spinner" /></div>}>
      <CatalogContent />
    </Suspense>
  );
}

const GENRE_NAME_MAP: Record<string, string> = {
  '28': 'Action',
  '12': 'Adventure',
  '16': 'Animation',
  '35': 'Comedy',
  '80': 'Crime',
  '99': 'Documentary',
  '18': 'Drama',
  '10751': 'Family',
  '14': 'Fantasy',
  '36': 'History',
  '27': 'Horror',
  '10402': 'Music',
  '9648': 'Mystery',
  '10749': 'Romance',
  '878': 'Sci-Fi',
  '10770': 'TV Movie',
  '53': 'Thriller',
  '10752': 'War',
  '37': 'Western',
};

function CatalogContent() {
  const { type } = useParams() as { type: string };
  const searchParams = useSearchParams();
  const config = CATALOG_TYPE_MAP[type] || { title: 'Discover', description: '', endpoint: `/movies/${type}` };

  const [displayTitle, setDisplayTitle] = useState(config.title);

  useEffect(() => {
    if (type === 'discover') {
      const gId = searchParams.get('with_genres');
      if (gId && GENRE_NAME_MAP[gId]) {
        setDisplayTitle(`${GENRE_NAME_MAP[gId]} Movies`);
      } else if (searchParams.has('with_genres')) {
        setDisplayTitle('Genre Results');
      } else if (searchParams.has('with_origin_country')) {
        setDisplayTitle('Global Cinema');
      } else if (searchParams.has('with_original_language')) {
        setDisplayTitle('Language Collection');
      } else {
        setDisplayTitle('Discover');
      }
    } else {
      setDisplayTitle(config.title);
    }
  }, [type, searchParams, config.title]);
  const { user } = useAuth();
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // User lists for card toggles
  const [favIds, setFavIds] = useState<number[]>([]);
  const [watchIds, setWatchIds] = useState<number[]>([]);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);

  useEffect(() => {
    if (user) {
      api.get('/favorites/ids').then(r => setFavIds(r.data)).catch(() => { });
      api.get('/watchlist/ids').then(r => setWatchIds(r.data)).catch(() => { });
      api.get('/watched/ids').then(r => setWatchedIds(r.data)).catch(() => { });
    }
  }, [user]);

  const fetchData = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      // Build query string from searchParams
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', pageNum.toString());

      const connector = config.endpoint.includes('?') ? '&' : '?';
      const res = await api.get(`${config.endpoint}${connector}${params.toString()}`);
      const newItems = res.data?.results || [];

      if (pageNum === 1) {
        setItems(newItems);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }

      setHasMore(newItems.length > 0 && pageNum < (res.data?.total_pages || 1));
    } catch (error) {
      console.error('Error fetching catalog:', error);
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, searchParams]);

  useEffect(() => {
    fetchData(1);
    setPage(1);
  }, [fetchData, searchParams]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage);
  };

  const handleToggle = (movieId: number, listType: 'fav' | 'watchlist' | 'watched') => {
    switch (listType) {
      case 'fav':
        setFavIds(prev => prev.includes(movieId) ? prev.filter(id => id !== movieId) : [...prev, movieId]);
        break;
      case 'watchlist':
        setWatchIds(prev => prev.includes(movieId) ? prev.filter(id => id !== movieId) : [...prev, movieId]);
        break;
      case 'watched':
        setWatchedIds(prev => prev.includes(movieId) ? prev.filter(id => id !== movieId) : [...prev, movieId]);
        break;
    }
  };

  return (
    <div className="section container" style={{ minHeight: 'calc(100vh - 68px)', paddingTop: 120 }}>
      <header style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8, color: 'white' }}>{displayTitle}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Browsing all available titles in this category</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
        {items.map((movie) => (
          <MovieCard
            key={`${movie.id}-${movie.media_type || 'movie'}`}
            movie={movie}
            isFav={favIds.includes(movie.id)}
            isWatchlisted={watchIds.includes(movie.id)}
            isWatched={watchedIds.includes(movie.id)}
            onFavToggle={(m) => handleToggle(m.id, 'fav')}
            onWatchlistToggle={(m) => handleToggle(m.id, 'watchlist')}
            onWatchedToggle={(m) => handleToggle(m.id, 'watched')}
          />
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      )}

      {!loading && hasMore && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <button
            onClick={handleLoadMore}
            className="btn btn-primary"
            style={{ padding: '12px 32px' }}
          >
            Load More Content
          </button>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🏜️</p>
          <h3 style={{ color: 'white' }}>Nothing here yet</h3>
          <p>We couldn't find any content for this category.</p>
        </div>
      )}
    </div>
  );
}
