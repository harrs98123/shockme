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
    <section style={{ padding: '48px 0 24px', overflow: 'hidden' }}>
      <div className="container">
        <div style={{ marginBottom: 24 }}>
           <h2 style={{ 
             fontSize: 28, 
             fontWeight: 800, 
             letterSpacing: '-0.02em',
             color: 'white',
             margin: 0,
             display: 'flex',
             alignItems: 'center',
             gap: 12
           }}>
             <span style={{ 
               width: 4, 
               height: 28, 
               background: 'var(--primary)', 
               borderRadius: 2 
             }} />
             {title}
           </h2>
        </div>

        <div style={{ position: 'relative' }}>
          {/* Scroll Buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="scroll-btn left"
              style={{
                position: 'absolute',
                left: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)'
              }}
            >
              ←
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="scroll-btn right"
              style={{
                position: 'absolute',
                right: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)'
              }}
            >
              →
            </button>
          )}

          <div
            ref={rowRef}
            className="scroll-row hide-scrollbar"
            onScroll={handleScroll}
            style={{
              display: 'flex',
              gap: 40,
              padding: '20px 40px 40px 20px',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              contain: 'content',
              willChange: 'scroll-position'
            }}
          >
            {movies.slice(0, 10).map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                style={{
                  position: 'relative',
                  minWidth: 220,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'flex-end'
                }}
              >
                {/* Large Background Number */}
                <span style={{
                  position: 'absolute',
                  left: -45,
                  bottom: -25,
                  fontSize: 220,
                  fontWeight: 900,
                  lineHeight: 0.8,
                  color: '#010103', // Solid black (matches bg)
                  WebkitTextStroke: '2px rgba(255,255,255,0.2)', // Slightly thinner outline
                  zIndex: 0,
                  pointerEvents: 'none',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.15em'
                }}>
                  {index + 1}
                </span>

                {/* Movie Card with extra margin to show the number */}
                <div style={{ position: 'relative', zIndex: 1, marginLeft: 85, width: '100%' }}>
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
