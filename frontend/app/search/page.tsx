'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

// Create a simple debounce for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initQ = searchParams?.get('q') || '';

  const { user } = useAuth();

  const [query, setQuery] = useState(initQ);
  const debouncedQuery = useDebounce(query, 600);

  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [debouncedQuery]);

  const performSearch = async (q: string) => {
    setLoading(true);
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
    try {
      const res = await api.get(`/movies/search?q=${encodeURIComponent(q)}`);
      // Filter out people, only show movies and tv shows
      const filtered = (res.data?.results || []).filter((m: any) => m.media_type !== 'person');
      setResults(filtered);
      setHasSearched(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) performSearch(query);
    }
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
      {/* Search Bar */}
      <div style={{ maxWidth: 800, margin: '0 auto 48px', position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Search for movies, series, shows..."
          style={{
            width: '100%', padding: '20px 24px 20px 64px',
            fontSize: 20, fontFamily: 'var(--font-poppins, Poppins)',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            borderRadius: 99, color: 'white', outline: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary)', e.target.style.background = 'rgba(255,255,255,0.08)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)', e.target.style.background = 'rgba(255,255,255,0.05)')}
        />
        <span style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', fontSize: 24, pointerEvents: 'none' }}>
          🔍
        </span>
        {loading && (
          <span className="spinner" style={{ position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)' }} />
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>Searching...</div>
      ) : hasSearched ? (
        <>
          <h2 style={{ fontSize: 20, marginBottom: 24 }}>
            Results for <span style={{ color: 'var(--primary)' }}>"{debouncedQuery}"</span>
          </h2>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🏜️</p>
              <h3 style={{ fontSize: 20, marginBottom: 8, color: 'white' }}>No results found</h3>
              <p>Try adjusting your search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
              {results.map((movie) => (
                <MovieCard
                  key={movie.id}
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
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🍿</p>
          <h3 style={{ fontSize: 20, marginBottom: 8, color: 'white' }}>Find your next favorite</h3>
          <p>Start typing to search global movies and TV shows.</p>
        </div>
      )}
    </div>
  );
}
