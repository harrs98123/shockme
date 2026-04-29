'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Tv,
  Film,
  ArrowRight,
  TrendingUp,
  Star
} from 'lucide-react';
import api from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import { Movie } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function AnimePage() {
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
    api.get('/movies/anime')
      .then(res => {
        setItems(res.data.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch anime:', err);
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
      <header style={{ marginBottom: 48, position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            padding: '48px',
            borderRadius: '32px',
            background: 'url(/anime.png) center/cover no-repeat',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Pro Cinematic Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0.6) 50%, rgba(10, 10, 10, 0) 100%)',
            zIndex: 1
          }} />

          {/* Grainy Texture */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
            opacity: 0.1,
            pointerEvents: 'none',
            zIndex: 2
          }} />

          <div style={{ position: 'relative', zIndex: 3, maxWidth: 600 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              background: 'rgba(236, 72, 153, 0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              color: '#f472b6',
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: '0.04em'
            }}>
              SPECIAL COLLECTION
            </span>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 900, color: 'white', marginBottom: 16, lineHeight: 1.2 }}>
              Japanese <span style={{
                background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Anime</span>
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 17, lineHeight: 1.5, maxWidth: 500, marginBottom: 24 }}>
              Discover the finest selection of animation from Japan. From legendary classics to modern hits.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/catalog/anime" className="btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}>
                Explore Catalog
              </Link>
            </div>
          </div>

          {/* Subtle Glow */}
          <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
            zIndex: 1
          }} />
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
        <Link href="/catalog/anime" className="btn btn-ghost" style={{ padding: '14px 32px' }}>
          Browse Entire Anime Catalog <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
