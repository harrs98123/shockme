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
  const [activeStudio, setActiveStudio] = useState<string>('All');
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

  const studioList = [
    { name: 'Marvel', params: { with_companies: 420 } },
    { name: 'DC Universe', params: { with_keywords: 849 } },
    { name: 'Disney', params: { with_companies: 2 } },
    { name: 'Pixar', params: { with_companies: 3 } },
    { name: 'Lucasfilm', params: { with_companies: 1 } },
    { name: 'Warner Bros.', params: { with_companies: 174 } },
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-10 pt-20 sm:pt-28 pb-28 text-white max-w-7xl mx-auto">
      {/* Cinematic Hero Banner */}
      <section className="relative w-full h-[320px] xs:h-[360px] sm:h-[420px] md:h-[460px] mb-8 sm:mb-12 rounded-2xl xs:rounded-3xl sm:rounded-[36px] overflow-hidden shadow-2xl border border-white/10">
        <AnimatePresence mode="wait">
          {/* Dynamic Background Image with Smooth Cross-fade */}
          <motion.div
            key={bannerContent.image}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${bannerContent.image}")`,
              backgroundPosition: 'center 25%',
            }}
          />
        </AnimatePresence>

        {/* Responsive Cinematic Overlays */}
        <div className="absolute inset-0 z-1 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 via-50% to-black/30 md:bg-gradient-to-r md:from-[#0a0a0a]/95 md:via-[#0a0a0a]/70 md:to-transparent" />
        <div className="absolute inset-0 z-1 bg-gradient-to-b from-black/40 via-transparent to-[#0a0a0a]/80 md:hidden" />

        {/* Hero Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-end md:justify-center p-5 xs:p-7 sm:p-10 md:p-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={bannerContent.title}
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 16, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl"
            >
              <div className="flex items-center gap-2.5 mb-2 sm:mb-3">
                <div className="w-6 h-0.5 bg-[var(--primary,#e11d48)] rounded-full" />
                <span className="text-[10px] xs:text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-white/70">
                  {bannerContent.accent}
                </span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight mb-2 sm:mb-4 drop-shadow-xl uppercase">
                {bannerContent.title}
              </h1>

              <p className="text-xs xs:text-sm sm:text-base md:text-lg text-white/75 font-medium leading-relaxed line-clamp-2 xs:line-clamp-3">
                {bannerContent.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Accent (Hidden on mobile for clean space) */}
        <div className="hidden sm:block absolute right-8 md:right-12 bottom-6 md:bottom-10 opacity-15 text-white pointer-events-none z-10">
          <Clapperboard size={140} strokeWidth={1} />
        </div>
      </section>

      {/* Franchise Selectors (Quick Filtering for Studios) */}
      <div className="mb-8">
        <div className="text-[11px] sm:text-xs font-extrabold text-white/40 mb-3 uppercase tracking-[0.2em]">Explore Studios</div>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          <button
            onClick={() => {
              setLoading(true);
              setActiveStudio('All');
              setBannerContent(defaultBanner);
              api.get('/movies/popular?page=1')
                .then(res => { setItems(res.data.results || []); setLoading(false); });
            }}
            className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all snap-start ${
              activeStudio === 'All'
                ? 'bg-white/20 text-white border border-white/30 shadow-md'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            All Franchises
          </button>

          {studioList.map(studio => {
            const isActive = activeStudio === studio.name;
            return (
              <button
                key={studio.name}
                onClick={() => {
                  setLoading(true);
                  setActiveStudio(studio.name);
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
                    setBannerContent({
                      title: `${studio.name.toUpperCase()} SAGA`,
                      subtitle: `Discover epic movies and worlds from ${studio.name}.`,
                      image: defaultBanner.image,
                      accent: `${studio.name} Collection`
                    });
                  }

                  const queryParams = new URLSearchParams();
                  Object.entries(studio.params).forEach(([key, val]) => {
                    queryParams.append(key, String(val));
                  });

                  api.get(`/movies/discover?${queryParams.toString()}`)
                    .then(res => {
                      setItems(res.data.results || []);
                      setLoading(false);
                    });
                }}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all snap-start ${
                  isActive
                    ? 'bg-white/20 text-white border border-white/30 shadow-md'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {studio.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Franchises (Grid) */}
      {adminFranchises.length > 0 && (
        <div className="mb-10 sm:mb-14">
          <div className="text-[11px] sm:text-xs font-extrabold text-white/40 mb-4 uppercase tracking-[0.2em]">Featured Collections</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {adminFranchises.map(u => (
              <motion.button
                key={u.id}
                whileHover={{ y: -4, background: 'rgba(255,255,255,0.06)' }}
                onClick={() => fetchFranchiseMovies(u.movie_ids)}
                className="p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-left cursor-pointer transition-all flex items-center gap-4 hover:border-white/20"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center text-xl sm:text-2xl"
                  style={{ background: `${u.color}15`, border: `1px solid ${u.color}33`, color: u.color }}
                >
                  {u.icon_emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-base font-bold text-white mb-0.5 truncate">{u.name}</div>
                  <div className="text-xs text-white/50 font-medium">{u.movie_ids.length} Movies</div>
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
