'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Props { 
  movie: Movie; 
  variant?: 'primary' | 'purple' | 'dark' | 'simple';
}

export default function WatchlistButton({ movie, variant }: Props) {
  const { user } = useAuth();
  const [isIn, setIsIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');

  useEffect(() => {
    if (!user) return;
    api.get(`/watchlist/ids?media_type=${mediaType}`).then((r) => {
      setIsIn((r.data as number[]).includes(movie.id));
    }).catch(() => {});
  }, [user, movie.id, mediaType]);

  const toggle = async () => {
    if (!user) { window.location.href = '/login'; return; }
    setLoading(true);
    try {
      if (isIn) {
        await api.delete(`/watchlist/${movie.id}?media_type=${mediaType}`);
        setIsIn(false);
      } else {
        await api.post('/watchlist', {
          movie_id: movie.id, 
          media_type: mediaType,
          title: movie.title || movie.name,
          poster_path: movie.poster_path, 
          backdrop_path: movie.backdrop_path,
          release_year: (movie.release_date || movie.first_air_date)?.slice(0, 4) || null,
          vote_average: movie.vote_average,
        });
        setIsIn(true);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const isPurple = variant === 'purple';
  const isDark = variant === 'dark';

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: isPurple ? '14px 24px' : isDark ? '12px 20px' : '10px 20px',
        borderRadius: '30px',
        backgroundColor: isPurple ? '#A855F7' : isDark ? 'rgba(255,255,255,0.1)' : 'var(--surface)',
        color: 'white',
        fontWeight: isPurple ? 700 : 600,
        fontSize: 14,
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        opacity: loading ? 0.6 : 1,
        flex: isDark ? 1 : 'unset'
      }}
    >
      {isIn ? '✅' : '📥'} {isIn ? 'Watchlisted' : 'Watchlist'}
    </button>
  );
}
