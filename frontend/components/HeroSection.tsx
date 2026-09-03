'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createTimeline, stagger } from 'animejs';
import { Movie, Genre } from '@/lib/types';
import { backdropUrl, posterUrl, releaseYear } from '@/lib/api';
import { getEnglishTitle } from '@/lib/utils';

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
  const heroContentRef = useRef<HTMLDivElement>(null);

  const movie = movies[currentIndex];
  const fetchedRef = useRef<Set<number>>(new Set());

  // Anime.js v4 kinetic entrance on current movie change
  useEffect(() => {
    if (!heroContentRef.current || !movie?.id) return;

    try {
      const tl = createTimeline({
        defaults: {
          ease: 'outExpo',
        },
      });

      const titles = heroContentRef.current.querySelectorAll('.anime-hero-title');
      if (titles.length) {
        tl.add(titles, {
          translateY: [24, 0],
          opacity: [0, 1],
          duration: 750,
        }, 30);
      }

      const metas = heroContentRef.current.querySelectorAll('.anime-hero-meta');
      if (metas.length) {
        tl.add(metas, {
          scale: [0.88, 1],
          opacity: [0, 1],
          delay: stagger(35),
          duration: 550,
          ease: 'outBack',
        }, 90);
      }

      const genres = heroContentRef.current.querySelectorAll('.anime-hero-genre');
      if (genres.length) {
        tl.add(genres, {
          translateY: [10, 0],
          opacity: [0, 1],
          delay: stagger(30),
          duration: 500,
        }, 150);
      }

      const btns = heroContentRef.current.querySelectorAll('.anime-hero-btn');
      if (btns.length) {
        tl.add(btns, {
          translateY: [15, 0],
          opacity: [0, 1],
          scale: [0.95, 1],
          delay: stagger(50),
          duration: 650,
          ease: 'outCubic',
        }, 190);
      }

      const descs = heroContentRef.current.querySelectorAll('.anime-hero-desc');
      if (descs.length) {
        tl.add(descs, {
          translateY: [12, 0],
          opacity: [0, 1],
          duration: 600,
        }, 240);
      }
    } catch (e) {
      console.warn('Anime.js hero animation error:', e);
    }
  }, [movie?.id]);

  // Fetch details for current movie (including official title font logos & multi-signal recommendation engine)
  useEffect(() => {
    if (!movie?.id || fetchedRef.current.has(movie.id)) return;

    fetchedRef.current.add(movie.id);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/movies/${movie.id}?media_type=${movie.media_type || 'movie'}`);
        if (!res.ok) return;
        const data = await res.json();

        // 1. Extract official title logo PNG
        const englishLogo =
          data.images?.logos?.find((l: any) => l.iso_639_1 === 'en' && l.file_path?.endsWith('.png')) ||
          data.images?.logos?.find((l: any) => l.iso_639_1 === 'en') ||
          data.images?.logos?.find((l: any) => !l.iso_639_1 && l.file_path?.endsWith('.png')) ||
          data.images?.logos?.[0];

        // 2. Pick an alternate aesthetic / artistic official poster variant from TMDB images if available
        const alternatePosters = (data.images?.posters || []).filter(
          (p: any) => p.file_path && p.file_path !== movie.poster_path
        );
        const altPoster = alternatePosters[0]?.file_path || alternatePosters[1]?.file_path || movie.poster_path;

        // 3. Multi-Signal Accurate Recommendation Engine
        const currentGenreIds = new Set<number>(
          (data.genres || movie.genres || []).map((g: any) => (typeof g === 'object' ? g.id : g))
        );

        const recs: any[] = data.recommendations?.results || [];
        const sims: any[] = data.similar?.results || [];

        const candidateMap = new Map<number, any>();

        // High-confidence collaborative recommendations
        for (const item of recs) {
          if (!item.id || item.id === movie.id) continue;
          if (!item.backdrop_path && !item.poster_path) continue;
          candidateMap.set(item.id, {
            ...item,
            _isRec: true,
            _vote: item.vote_average || 0,
            _pop: item.popularity || 0,
          });
        }

        // Thematic similarity recommendations
        for (const item of sims) {
          if (!item.id || item.id === movie.id) continue;
          if (!item.backdrop_path && !item.poster_path) continue;
          if (candidateMap.has(item.id)) {
            const existing = candidateMap.get(item.id);
            existing._isBoth = true;
          } else {
            candidateMap.set(item.id, {
              ...item,
              _isSim: true,
              _vote: item.vote_average || 0,
              _pop: item.popularity || 0,
            });
          }
        }

        // Score & rank candidates with accuracy formula
        const rankedCandidates = Array.from(candidateMap.values())
          .map((item) => {
            const itemGenres: number[] = item.genre_ids || [];
            let sharedGenres = 0;
            for (const gid of itemGenres) {
              if (currentGenreIds.has(gid)) sharedGenres++;
            }

            const genreScore = currentGenreIds.size > 0 ? (sharedGenres / Math.max(1, currentGenreIds.size)) * 40 : 20;
            const qualityScore = Math.min(30, Math.max(0, ((item._vote || 6.0) - 4.5) * 6));
            const sourceBonus = item._isBoth ? 25 : item._isRec ? 20 : 10;
            const popBonus = Math.min(10, Math.log10(Math.max(10, item._pop || 10)) * 3);

            const totalScore = genreScore + qualityScore + sourceBonus + popBonus;
            const matchPercent = Math.min(99, Math.max(78, Math.round(75 + (totalScore / 105) * 24)));

            return {
              ...item,
              _accuracyScore: totalScore,
              matchPercent,
            };
          })
          .sort((a, b) => b._accuracyScore - a._accuracyScore)
          .slice(0, 12);

        setMovieDetails(prev => ({
          ...prev,
          [movie.id]: {
            runtime: data.runtime,
            genres: data.genres,
            similar: { results: rankedCandidates },
            certification: data.certification,
            logoPath: englishLogo?.file_path,
            sidePosterPath: altPoster,
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
  const movieTitle = getEnglishTitle(movie);

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
      {/* Background Image with Ken Burns Zoom & Vivid Contrast */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-1"
        >
          <Image
            src={backdropUrl(movie.backdrop_path, 'original')}
            alt={movieTitle}
            fill
            priority
            quality={100}
            sizes="100vw"
            className="object-cover object-[center_20%] brightness-105 contrast-[1.04] saturate-[1.08]"
          />
        </motion.div>
      </AnimatePresence>

      {/* Light, Clean Cinematic Vignette Overlays - Keeps backdrop bright & colorful while ensuring text readability */}
      <div className="absolute inset-0 z-2 bg-gradient-to-r from-black/75 via-black/30 via-45% to-transparent sm:from-black/70 sm:via-black/20 sm:via-55% to-transparent" />
      <div className="absolute inset-0 z-2 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/35 via-25% to-transparent" />
      <div className="absolute inset-x-0 top-0 h-28 z-2 bg-gradient-to-b from-black/35 to-transparent" />

      {/* Main Content */}
      <div className="relative z-5 flex flex-col justify-end h-[100dvh] min-h-[100dvh] sm:h-auto sm:min-h-[92vh] md:min-h-[105vh] px-4 sm:px-6 md:px-10 pt-20 sm:pt-28 md:pt-32 pb-0">
        {/* Movie Info Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            ref={heroContentRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl pb-4 sm:pb-6"
          >
            {/* Title */}
            <h1 className="anime-hero-title text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2 sm:mb-4 uppercase leading-[1.15] drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
              {movieTitle}
            </h1>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2.5 sm:mb-4 text-xs sm:text-sm text-white/90 font-medium">
              <span className="anime-hero-meta inline-flex items-center px-2 py-0.5 border border-white/40 bg-black/40 backdrop-blur-md rounded text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wide">
                12+
              </span>

              <span className="anime-hero-meta inline-flex items-center px-1.5 py-0.5 border border-white/40 bg-black/40 backdrop-blur-md rounded text-[10px] sm:text-xs font-bold text-white">
                CC
              </span>

              <span className="anime-hero-meta font-semibold text-white drop-shadow">{year}</span>

              {runtime && (
                <>
                  <span className="text-white/40 text-[8px]">●</span>
                  <span className="anime-hero-meta drop-shadow">{formatRuntime(runtime)}</span>
                </>
              )}

              <span className="text-white/40 text-[8px]">●</span>

              <span className="anime-hero-meta text-amber-400 font-bold flex items-center gap-1 bg-amber-400/15 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-400/30 text-xs shadow-sm">
                ⭐ {rating}
              </span>
            </div>

            {/* Genre Tags */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3.5 sm:mb-5 text-xs text-white/80 font-medium">
              {genres.slice(0, 3).map((g: Genre) => (
                <span key={g.id} className="anime-hero-genre inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/35 border border-white/15 backdrop-blur-md text-[11px] sm:text-xs text-white shadow-sm">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3.5 sm:mb-6 w-full max-w-md">
              <Link
                href={`/movie/${movie.id}`} prefetch={false}
                className="anime-hero-btn group relative inline-flex items-center justify-center gap-2 px-4 sm:px-7 py-2.5 sm:py-3 bg-white text-black rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-white/95 hover:scale-[1.03] active:scale-[0.97] transition-all flex-1 shadow-[0_4px_24px_rgba(255,255,255,0.25)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" className="shrink-0 group-hover:scale-110 transition-transform">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
                <span>Trailer</span>
              </Link>

              <Link
                href={`/movie/${movie.id}`} prefetch={false}
                className="anime-hero-btn inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-black/40 backdrop-blur-md text-white border border-white/30 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex-1 shadow-md"
              >
                <span>Details</span>
              </Link>

              <button
                className="anime-hero-btn w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/40 backdrop-blur-md border border-white/30 text-white flex items-center justify-center text-xl font-bold hover:bg-white/20 hover:scale-105 active:scale-95 transition-all shrink-0 shadow-md"
                title="Add to Watchlist"
              >
                +
              </button>
            </div>

            {/* Description */}
            <p className="anime-hero-desc text-white/90 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {movie.overview}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Suggested Movies Section */}
        <div className="mt-3 sm:mt-5 pb-6 sm:pb-10 relative bg-gradient-to-b from-transparent via-[#0a0a0a]/60 to-[#0a0a0a] backdrop-blur-[2px] rounded-t-xl sm:rounded-t-3xl p-3 sm:p-5 md:p-6 -mx-3.5 sm:-mx-6 md:-mx-10">
          {/* Tabs */}
          <div className="flex gap-4 sm:gap-7 mb-3 sm:mb-5 border-b border-white/10 text-xs sm:text-sm uppercase tracking-wider font-semibold">
            {(['suggested', 'extras', 'details'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 relative transition-colors ${activeTab === tab ? 'text-white font-bold' : 'text-white/45 hover:text-white/70'
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

      {/* Slide Progress Indicator (Desktop only) */}
      {movies.length > 1 && (
        <div className="hidden md:flex flex-col gap-2.5 absolute right-6 bottom-[32%] z-20 bg-black/35 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-2xl">
          {movies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className="relative w-2 rounded-full cursor-pointer p-0 border-0 bg-white/20 overflow-hidden transition-all duration-300 hover:bg-white/40"
              style={{
                height: idx === currentIndex ? '32px' : '8px',
              }}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {idx === currentIndex && (
                <motion.div
                  key={currentIndex}
                  initial={{ height: '0%' }}
                  animate={{ height: '100%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                  className="absolute inset-0 w-full bg-white rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Suggested Movie Card ─────────────────────────────────────────── */
function SuggestedCard({ movie }: { movie: any; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 80);
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

  const matchPercent = movie.matchPercent || 94;

  return (
    <Link
      href={`/movie/${movie.id}`} prefetch={false}
      className="min-w-[155px] max-w-[155px] sm:min-w-[225px] sm:max-w-[225px] shrink-0 rounded-xl overflow-hidden relative no-underline snap-start transition-all duration-300 ease-out z-1 hover:z-5 hover:scale-[1.04] border border-white/10 hover:border-white/30 group shadow-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-full aspect-video bg-[#151515] rounded-xl overflow-hidden">
        <Image
          src={movie.backdrop_path ? backdropUrl(movie.backdrop_path, 'w780') : posterUrl(movie.poster_path, 'w500')}
          alt={movie.title || movie.name || ''}
          fill
          sizes="(max-width: 640px) 155px, 225px"
          className="object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
        />

        <div
          className={`absolute inset-0 transition-all duration-300 rounded-xl ${
            isHovered
              ? 'bg-gradient-to-t from-black/95 via-black/40 to-transparent'
              : 'bg-gradient-to-t from-black/80 via-black/20 to-transparent'
          }`}
        />

        {/* Top Badges: Rating */}
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 pointer-events-none">
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-black/70 border border-white/15 px-1.5 py-0.5 rounded backdrop-blur-md shadow-sm">
              ⭐ {movie.vote_average.toFixed(1)}
            </span>
          </div>
        )}

        {/* Bottom Title */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
          <p className="text-white text-[11px] sm:text-xs font-bold m-0 leading-tight truncate drop-shadow-md group-hover:text-white">
            {movie.title || movie.name}
          </p>
        </div>

        {/* Hover Center Play Action */}
        {isHovered && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-black flex items-center justify-center shadow-xl scale-100 transition-transform">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#000" className="ml-0.5">
              <polygon points="5 3 19 12 5 21" />
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
