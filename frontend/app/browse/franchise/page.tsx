'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clapperboard,
  Sparkles,
  ArrowRight,
  Zap,
  Sword,
  Rocket
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import { Movie } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function FranchisePage() {
  const { user } = useAuth();
  const [adminFranchises, setAdminFranchises] = useState<any[]>([]);
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState<number[]>([]);
  const [watchIds, setWatchIds] = useState<number[]>([]);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);

  const defaultBanner = {
    title: 'MOVIE FRANCHISES',
    subtitle: "Step into the world's most iconic sagas. From the depths of Gotham to the edges of the Galaxy.",
    image: '/franchise.jpg',
    accent: 'Curated Universes'
  };

  const [bannerContent, setBannerContent] = useState(defaultBanner);

  useEffect(() => {
    // Fetch custom admin franchises
    api.get('/admin/franchises/public')
      .then(res => setAdminFranchises(res.data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (user) {
      api.get('/favorites/ids').then(r => setFavIds(r.data)).catch(() => { });
      api.get('/watchlist/ids').then(r => setWatchIds(r.data)).catch(() => { });
      api.get('/watched/ids').then(r => setWatchedIds(r.data)).catch(() => { });
    }
  }, [user]);

  useEffect(() => {
    // Initial fetch: show popular or first custom franchise
    api.get('/movies/popular?page=1')
      .then(res => {
        setItems(res.data.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch franchises:', err);
        setLoading(false);
      });
  }, []);

  const fetchFranchiseMovies = async (movieIds: number[]) => {
    setLoading(true);
    const movieDetails = [];
    for (const id of movieIds) {
      try {
        const res = await api.get(`/movies/${id}`);
        movieDetails.push(res.data);
      } catch (e) { console.error(e); }
    }
    setItems(movieDetails);
    setLoading(false);
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

  if (loading && items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="section container" style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 140 }}>
      {/* Franchise Selectors (Quick Filtering for Studios) */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2 }}>Explore Studios</div>
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none'
        }}>
          {[
            { name: 'Marvel', params: { with_companies: 420 } },
            { name: 'DC Universe', params: { with_keywords: 849 } },
            { name: 'Disney', params: { with_companies: 2 } },
            { name: 'Pixar', params: { with_companies: 3 } },
            { name: 'Lucasfilm', params: { with_companies: 1 } },
            { name: 'Warner Bros.', params: { with_companies: 174 } },
          ].map(studio => (
            <button
              key={studio.name}
              onClick={() => {
                setLoading(true);
                // Update dynamic banner
                if (studio.name === 'Marvel') {
                  setBannerContent({
                    title: 'MARVEL STUDIOS',
                    subtitle: 'The Cinematic Universe that redefined heroism.',
                    image: '/thumb-1920-1188665.jpg',
                    accent: 'Super Hero Saga'
                  });
                } else if (studio.name === 'DC Universe') {
                  setBannerContent({
                    title: 'DC EXTENDED UNIVERSE',
                    subtitle: 'Explore the darker, more complex side of heroism.',
                    image: '/wp7506846.jpg',
                    accent: 'Justice League Saga'
                  });
                } else {
                  setBannerContent(defaultBanner);
                }

                // Build query string from params
                const queryParams = new URLSearchParams();
                Object.entries(studio.params).forEach(([key, val]) => {
                  queryParams.append(key, String(val));
                });

                api.get(`/movies/discover?${queryParams.toString()}`)
                  .then(res => {
                    setItems(res.data.results);
                    setLoading(false);
                  });
              }}
              style={{
                padding: '10px 20px', borderRadius: 100, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }}
            >
              {studio.name}
            </button>
          ))}
        </div>
      </div>

      {/* Cinematic Hero Banner */}
      <section style={{
        position: 'relative',
        height: '450px',
        width: 'calc(100% + 40px)',
        marginLeft: '-20px',
        marginBottom: 64,
        borderRadius: 40,
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <AnimatePresence mode="wait">
          {/* Dynamic Background Image with Smooth Cross-fade */}
          <motion.div
            key={bannerContent.image}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("${bannerContent.image}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
            }}
          />
        </AnimatePresence>

        {/* Cinematic Overlays */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.3) 50%, transparent 100%), linear-gradient(to top, #0a0a0a 0%, transparent 40%)',
        }} />

        {/* Content Container */}
        <div style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 60px',
          zIndex: 2,
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={bannerContent.title}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20
              }}>
                <div style={{ width: 40, height: 2, background: 'var(--primary)' }} />
                <span style={{
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: 4,
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase'
                }}>
                  {bannerContent.accent}
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(40px, 8vw, 72px)',
                fontWeight: 900,
                color: 'white',
                lineHeight: 1,
                marginBottom: 24,
                letterSpacing: '-2px',
                textShadow: '0 10px 20px rgba(0,0,0,0.5)'
              }}>
                {bannerContent.title}
              </h1>

              <p style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.5)',
                maxWidth: 500,
                lineHeight: 1.6,
                fontWeight: 500
              }}>
                {bannerContent.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Accent */}
        <div style={{
          position: 'absolute',
          right: 60,
          bottom: 40,
          opacity: 0.15,
          color: 'white'
        }}>
          <Clapperboard size={180} strokeWidth={1} />
        </div>
      </section>

      {/* Admin Franchises (Grid) */}
      {adminFranchises.length > 0 && (
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1 }}>Featured Collections</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {adminFranchises.map(u => (
              <motion.button
                key={u.id}
                whileHover={{ y: -4, background: 'rgba(255,255,255,0.04)' }}
                onClick={() => fetchFranchiseMovies(u.movie_ids)}
                style={{
                  padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 20, alignItems: 'center'
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: `${u.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, border: `1px solid ${u.color}33`, color: u.color
                }}>
                  {u.icon_emoji}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 4 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{u.movie_ids.length} Movies</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}


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
    </div>
  );
}
