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
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${
        dir === 'left' ? '-left-4' : '-right-4'
      } z-10 w-10 h-10 rounded-full bg-[#0f0f0f]/95 border border-white/10 text-white cursor-pointer items-center justify-center text-base transition-all ${
        dir === 'left' ? (canScrollLeft ? 'opacity-100 hover:bg-[var(--primary)]' : 'opacity-30') : (canScrollRight ? 'opacity-100 hover:bg-[var(--primary)]' : 'opacity-30')
      }`}
    >
      {dir === 'left' ? '←' : '→'}
    </button>
  );

  return (
    <section className="py-4 sm:py-8">
      <div className="container">
        <div className="mb-3 sm:mb-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-xl font-extrabold text-white m-0 tracking-tight">
              {title}
            </h2>
            {seeMoreLink && (
              <a
                href={seeMoreLink}
                className="text-xs font-semibold text-white/50 hover:text-white transition-colors flex items-center gap-1 sm:hidden"
              >
                See all →
              </a>
            )}
          </div>
          {subtitle && (
            <p className="text-white/50 text-xs sm:text-sm mt-1 mb-0 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative">
          <ArrowBtn dir="left" />
          <div
            ref={rowRef}
            className="scroll-row flex gap-3 sm:gap-4 overflow-x-auto py-2 px-1 scrollbar-none snap-x snap-mandatory"
            onScroll={handleScroll}
          >
            {movies.map((movie) => (
              <div key={movie.id} className="snap-start shrink-0">
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
            ))}

            {seeMoreLink && (
              <a
                href={seeMoreLink}
                className="snap-start min-w-[135px] max-w-[135px] sm:min-w-[180px] sm:max-w-[180px] lg:max-w-[210px] h-[202px] sm:h-[270px] lg:h-[315px] flex flex-col items-center justify-center bg-white/[0.03] border border-dashed border-white/15 rounded-2xl sm:rounded-3xl text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-[var(--primary)] transition-all gap-2 shrink-0 no-underline"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center text-lg sm:text-xl">
                  →
                </div>
                <span className="text-xs sm:text-sm font-semibold">See Everything</span>
              </a>
            )}
          </div>
          <ArrowBtn dir="right" />
        </div>
      </div>
    </section>
  );
}
