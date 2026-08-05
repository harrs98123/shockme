'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie, Genre } from '@/lib/types';
import { backdropUrl, posterUrl, releaseYear } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface MovieDetails {
  runtime?: number;
  genres?: Genre[];
  similar?: { results: Movie[] };
  certification?: string;
}

interface Props {
  movies: Movie[];
}

export default function HeroSection({ movies }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'suggested' | 'extras' | 'details'>('suggested');
  const [movieDetails, setMovieDetails] = useState<Record<number, MovieDetails>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const suggestedRowRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const movie = movies[currentIndex];
  const fetchedRef = useRef<Set<number>>(new Set());

  // Fetch details for current movie
  useEffect(() => {
    if (!movie?.id || fetchedRef.current.has(movie.id)) return;

    fetchedRef.current.add(movie.id);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/movies/${movie.id}?media_type=${movie.media_type || 'movie'}`);
        if (!res.ok) return;
        const data = await res.json();
        setMovieDetails(prev => ({
          ...prev,
          [movie.id]: {
            runtime: data.runtime,
            genres: data.genres,
            similar: data.similar,
            certification: data.certification,
          }
        }));
      } catch { /* ignore */ }
    })();
  }, [movie?.id, movie?.media_type]);

  // Auto-play interval
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (movies.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % movies.length);
        setActiveTab('suggested');
        setIsTransitioning(false);
      }, 300);
    }, 10000);
  }, [movies.length]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goToSlide = (idx: number) => {
    if (idx === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setActiveTab('suggested');
      setIsTransitioning(false);
    }, 300);
    startTimer();
  };

  // Scroll suggested row
  const scrollSuggested = (dir: 'left' | 'right') => {
    const el = suggestedRowRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!movies || movies.length === 0) return null;

  const year = releaseYear(movie.release_date || movie.first_air_date);
  const rating = movie.vote_average?.toFixed(1);
  const details = movieDetails[movie.id];
  const genres = details?.genres || movie.genres || [];
  const runtime = details?.runtime;
  const similarMovies = details?.similar?.results?.slice(0, 10) || [];

  const formatRuntime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  };

  return (
    <section
      id="hero-section"
      className="relative w-full h-[100dvh] min-h-[100dvh] sm:h-auto sm:min-h-[92vh] md:min-h-[105vh] bg-[#0a0a0a] overflow-hidden mt-0"
    >
      {/* Background Image */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 z-1"
        >
          <Image
            src={backdropUrl(movie.backdrop_path, 'w1280')}
            alt={movie.title || movie.name || ''}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_20%]"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlays - tuned for maximum poster clarity & subtle text contrast on mobile */}
      <div className="absolute inset-0 z-2 bg-gradient-to-r from-black/75 via-black/20 to-transparent sm:from-[#020202]/98 sm:via-[#020202]/85 md:via-[#020202]/60" />
      <div className="absolute inset-0 z-2 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 via-40% to-transparent" />
      <div className="absolute inset-0 z-2 bg-gradient-to-b from-black/40 via-transparent to-transparent sm:from-[#020202]/75" />

      {/* Main Content */}
      <div className="relative z-5 flex flex-col justify-end h-[100dvh] min-h-[100dvh] sm:h-auto sm:min-h-[92vh] md:min-h-[105vh] px-4 sm:px-6 md:px-10 pt-20 sm:pt-28 md:pt-32 pb-0">
        {/* Movie Info Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-2xl pb-4 sm:pb-6"
          >
            {/* Title */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2 sm:mb-4 uppercase leading-[1.15] drop-shadow-lg">
              {movie.title || movie.name}
            </h1>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2.5 sm:mb-4 text-xs sm:text-sm text-white/80 font-medium">
              <span className="inline-flex items-center px-2 py-0.5 border border-white/40 bg-black/30 backdrop-blur-sm rounded text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-wide">
                12+
              </span>

              <span className="inline-flex items-center px-1.5 py-0.5 border border-white/40 bg-black/30 backdrop-blur-sm rounded text-[10px] sm:text-xs font-bold text-white/90">
                CC
              </span>

              <span className="font-semibold text-white/90">{year}</span>

              {runtime && (
                <>
                  <span className="text-white/30 text-[8px]">●</span>
                  <span>{formatRuntime(runtime)}</span>
                </>
              )}

              <span className="text-white/30 text-[8px]">●</span>

              <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 text-xs">
                ⭐ {rating}
              </span>
            </div>

            {/* Genre Tags */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3.5 sm:mb-5 text-xs text-white/70 font-medium">
              {genres.slice(0, 3).map((g: Genre, i: number) => (
                <span key={g.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/10 backdrop-blur-sm text-[11px] sm:text-xs text-white/85">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Action Buttons - Clean 1-row layout on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3.5 sm:mb-6 w-full max-w-md">
              <Link
                href={`/movie/${movie.id}`}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-7 py-2.5 sm:py-3 bg-white text-black rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex-1 shadow-lg"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" className="shrink-0">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
                <span>Trailer</span>
              </Link>

              <Link
                href={`/movie/${movie.id}`}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/15 backdrop-blur-md text-white border border-white/25 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-white/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex-1"
              >
                <span>Details</span>
              </Link>

              <button
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 text-white flex items-center justify-center text-xl font-bold hover:bg-white/25 hover:scale-105 active:scale-95 transition-all shrink-0 shadow-md"
                title="Add to Watchlist"
              >
                +
              </button>
            </div>

            {/* Description */}
            <p className="text-white/85 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3 drop-shadow-md">
              {movie.overview}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Suggested Movies Section */}
        <div className="mt-3 sm:mt-5 pb-6 sm:pb-10 relative bg-gradient-to-b from-transparent via-[#0a0a0a]/90 to-[#0a0a0a] rounded-t-xl sm:rounded-t-3xl p-3 sm:p-5 md:p-6 -mx-3.5 sm:-mx-6 md:-mx-10">
          {/* Tabs */}
          <div className="flex gap-4 sm:gap-7 mb-3 sm:mb-5 border-b border-white/10 text-xs sm:text-sm uppercase tracking-wider font-semibold">
            {(['suggested', 'extras', 'details'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 relative transition-colors ${
                  activeTab === tab ? 'text-white font-bold' : 'text-white/45 hover:text-white/70'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <motion.div
                    layoutId="hero-tab-underline"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.75 bg-white rounded-full"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'suggested' && (
              <motion.div
                key="suggested"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {similarMovies.length > 0 ? (
                  <div className="relative">
                    {/* Left Arrow (Desktop) */}
                    <button
                      onClick={() => scrollSuggested('left')}
                      className="hidden sm:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/15 text-white items-center justify-center text-sm hover:bg-white/20 transition-all"
                    >
                      ‹
                    </button>

                    <div
                      ref={suggestedRowRef}
                      className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-none py-1 snap-x snap-mandatory"
                    >
                      {similarMovies.map((sm, idx) => (
                        <SuggestedCard key={sm.id} movie={sm} index={idx} />
                      ))}
                    </div>

                    {/* Right Arrow (Desktop) */}
                    <button
                      onClick={() => scrollSuggested('right')}
                      className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/15 text-white items-center justify-center text-sm hover:bg-white/20 transition-all"
                    >
                      ›
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="skeleton min-w-[145px] sm:min-w-[210px] h-24 sm:h-32 rounded-lg shrink-0"
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'extras' && (
              <motion.div
                key="extras"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-white/50 text-xs sm:text-sm">
                  Bonus content, behind-the-scenes footage, and deleted scenes coming soon.
                </p>
              </motion.div>
            )}

            {activeTab === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 max-w-2xl"
              >
                <DetailItem label="Release Year" value={year} />
                {runtime && <DetailItem label="Runtime" value={formatRuntime(runtime)} />}
                <DetailItem label="Rating" value={`${rating} / 10`} />
                <DetailItem label="Genres" value={genres.map(g => g.name).join(', ') || 'N/A'} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slide Progress Dots (Desktop only) */}
      {movies.length > 1 && (
        <div className="hidden md:flex flex-col gap-2 absolute right-5 bottom-[35%] z-20">
          {movies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`w-1.5 rounded-full transition-all duration-400 cursor-pointer p-0 border-0 ${
                idx === currentIndex ? 'h-7 bg-white' : 'h-1.5 bg-white/35 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Suggested Movie Card ─────────────────────────────────────────── */
function SuggestedCard({ movie }: { movie: Movie; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <Link
      href={`/movie/${movie.id}`}
      className="min-w-[145px] max-w-[145px] sm:min-w-[210px] sm:max-w-[210px] shrink-0 rounded-lg overflow-hidden relative no-underline snap-start transition-transform duration-300 ease-out z-1 hover:z-5 hover:scale-105"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-full aspect-video bg-[#1a1a1a] rounded-lg overflow-hidden">
        <Image
          src={movie.backdrop_path ? backdropUrl(movie.backdrop_path, 'w780') : posterUrl(movie.poster_path, 'w500')}
          alt={movie.title || movie.name || ''}
          fill
          sizes="(max-width: 640px) 145px, 210px"
          className="object-cover rounded-lg"
        />

        <div className={`absolute inset-0 transition-all duration-300 rounded-lg ${
          isHovered
            ? 'bg-gradient-to-t from-black/90 via-black/30 to-transparent'
            : 'bg-gradient-to-t from-black/70 via-transparent to-transparent'
        }`} />

        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-2.5">
          <p className="text-white text-[11px] sm:text-xs font-semibold m-0 leading-tight truncate drop-shadow">
            {movie.title || movie.name}
          </p>
        </div>

        {isHovered && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#000">
              <polygon points="7 3 21 12 7 21" />
            </svg>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Detail Item ───────────────────────────────────────────────────── */
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] sm:text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">
        {label}
      </span>
      <span className="text-xs sm:text-sm text-white/85 font-medium">
        {value}
      </span>
    </div>
  );
}
