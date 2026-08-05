'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Movie } from '@/lib/types';
import MovieCard from './MovieCard';
import TrendingRankedRowSkeleton from './TrendingRankedRowSkeleton';

interface Props {
  title: string;
  movies: Movie[];
  favIds?: number[];
  watchlistIds?: number[];
  watchedIds?: number[];
  onFavToggle?: (movie: Movie) => void;
  onWatchlistToggle?: (movie: Movie) => void;
  onWatchedToggle?: (movie: Movie) => void;
  loading?: boolean;
}

export default function TrendingRankedRow({
  title,
  movies,
  favIds = [],
  watchlistIds = [],
  watchedIds = [],
  onFavToggle,
  onWatchlistToggle,
  onWatchedToggle,
  loading = false,
}: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (loading) return <TrendingRankedRowSkeleton />;

  const scroll = (dir: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  if (!movies?.length) return null;

  return (
    <section className="py-6 sm:py-12 overflow-hidden">
      <div className="container">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white m-0 flex items-center gap-2.5 sm:gap-3">
            <span className="w-1 h-5 sm:h-7 bg-[var(--primary)] rounded-full" />
            {title}
          </h2>
        </div>

        <div className="relative">
          {/* Scroll Buttons (Desktop only) */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex scroll-btn left absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/80 border border-white/10 text-white cursor-pointer backdrop-blur-md items-center justify-center text-lg"
            >
              ←
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex scroll-btn right absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/80 border border-white/10 text-white cursor-pointer backdrop-blur-md items-center justify-center text-lg"
            >
              →
            </button>
          )}

          <div
            ref={rowRef}
            className="scroll-row hide-scrollbar flex gap-4 sm:gap-10 py-3 sm:py-5 px-3 sm:px-10 overflow-x-auto scroll-smooth snap-x snap-mandatory"
            onScroll={handleScroll}
          >
            {movies.slice(0, 10).map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative min-w-[165px] sm:min-w-[220px] shrink-0 flex items-end snap-start"
              >
                {/* Large Background Number */}
                <span className="absolute -left-7 sm:-left-11 -bottom-3 sm:-bottom-6 text-[130px] sm:text-[220px] font-black leading-none text-[#010103] z-0 pointer-events-none tracking-tighter select-none"
                  style={{
                    WebkitTextStroke: '1.5px rgba(255,255,255,0.22)',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {index + 1}
                </span>

                {/* Movie Card with extra margin to show the number */}
                <div className="relative z-1 ml-14 sm:ml-20 w-full">
                  <MovieCard
                    movie={movie}
                    isFav={favIds.includes(movie.id)}
                    isWatchlisted={watchlistIds.includes(movie.id)}
                    isWatched={watchedIds.includes(movie.id)}
                    onFavToggle={onFavToggle}
                    onWatchlistToggle={onWatchlistToggle}
                    onWatchedToggle={onWatchedToggle}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scroll-btn {
          transition: all 0.3s ease;
          opacity: 0.8;
        }
        .scroll-btn:hover {
          opacity: 1;
          background: var(--primary) !important;
          border-color: var(--primary) !important;
          transform: translateY(-50%) scale(1.1);
        }
      `}</style>
    </section>
  );
}
