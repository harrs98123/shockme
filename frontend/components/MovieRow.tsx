'use client';

import { useRef, useState } from 'react';
import { Movie } from '@/lib/types';
import MovieCard from './MovieCard';
import MovieRowSkeleton from './MovieRowSkeleton';

interface Props {
  title: string;
  movies: Movie[];
  subtitle?: string;
  favIds?: number[];
  watchlistIds?: number[];
  watchedIds?: number[];
  onFavToggle?: (movie: Movie) => void;
  onWatchlistToggle?: (movie: Movie) => void;
  onWatchedToggle?: (movie: Movie) => void;
  seeMoreLink?: string;
  loading?: boolean;
}

export default function MovieRow({
  title,
  movies,
  subtitle,
  favIds = [],
  watchlistIds = [],
  watchedIds = [],
  onFavToggle,
  onWatchlistToggle,
  onWatchedToggle,
  seeMoreLink,
  loading = false,
}: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (loading) return <MovieRowSkeleton />;

  const scroll = (dir: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const el = rowRef.current;
        if (el) {
          setCanScrollLeft(el.scrollLeft > 10);
          setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
        }
        ticking.current = false;
      });
      ticking.current = true;
    }
  };

  if (!movies?.length) return null;

  const ArrowBtn = ({ dir }: { dir: 'left' | 'right' }) => (
    <button
      onClick={() => scroll(dir)}
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [dir]: -16,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'rgba(15,15,15,0.95)',
        border: '1px solid var(--border)',
        color: 'white',
        cursor: 'pointer',
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s, border-color 0.2s',
        opacity: dir === 'left' ? (canScrollLeft ? 1 : 0.3) : (canScrollRight ? 1 : 0.3),
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(15,15,15,0.95)')}
    >
      {dir === 'left' ? '←' : '→'}
    </button>
  );

  return (
    <section style={{ padding: '32px 0' }}>
      <div className="container">
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, margin: 0, color: 'white' }}>{title}</h2>
          {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
        </div>
        <div style={{ position: 'relative' }}>
          <ArrowBtn dir="left" />
          <div
            ref={rowRef}
            className="scroll-row"
            onScroll={handleScroll}
            style={{ 
              padding: '8px 4px 16px',
              contain: 'content',
              willChange: 'scroll-position'
            }}
          >
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isFav={favIds.includes(movie.id)}
                isWatchlisted={watchlistIds.includes(movie.id)}
                isWatched={watchedIds.includes(movie.id)}
                onFavToggle={onFavToggle}
                onWatchlistToggle={onWatchlistToggle}
                onWatchedToggle={onWatchedToggle}
              />
            ))}

            {seeMoreLink && (
              <a
                href={seeMoreLink}
                style={{
                  minWidth: 180,
                  height: 330,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed var(--border)',
                  borderRadius: 16,
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  gap: 12,
                  marginLeft: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  →
                </div>
                <span style={{ fontWeight: 500 }}>See Everything</span>
              </a>
            )}
          </div>
          <ArrowBtn dir="right" />
        </div>
      </div>
    </section>
  );
}
