'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Smile,
  Heart,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import api from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import { Movie } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function FamilyPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
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
    // 10751 is Family genre ID
    api.get('/movies/discover?with_genres=10751')
      .then(res => {
        setItems(res.data.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch family movies:', err);
        setLoading(false);
      });
  }, []);

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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="section container" style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 140 }}>
      {/* Aesthetic Header */}
      <header style={{ marginBottom: 64, position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            padding: '48px',
            borderRadius: '32px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: '#10B981',
              color: 'white',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 16
            }}>
              WHOLESOME HITS
            </span>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: 'white', marginBottom: 16 }}>
              Family <span style={{ color: '#10B981' }}>Friendly</span> Picks
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 18, maxWidth: 600 }}>
              Stories that bring everyone together. Movies suitable for all ages with heart and humor.
            </p>
          </div>

          {/* Animated Background Icons */}
          <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', opacity: 0.2, color: '#10B981' }}>
            <Users size={140} />
          </div>
        </motion.div>
      </header>

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
        {items.map((movie) => (
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

      <div style={{ marginTop: 80, textAlign: 'center' }}>
        <Link href="/catalog/discover?with_genres=10751" className="btn btn-ghost" style={{ padding: '14px 32px' }}>
          Explore All Family Hits <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
