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

  // Fetch details for current movie
  useEffect(() => {
    if (!movie?.id || movieDetails[movie.id]) return;

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
  }, [movie?.id, movie?.media_type, movieDetails]);

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
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '112vh',
        background: '#0a0a0a',
        overflow: 'hidden',
        marginTop: 0,
      }}
    >
      {/* Background Image */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        >
          <Image
            src={backdropUrl(movie.backdrop_path, 'w1280')}
            alt={movie.title || movie.name || ''}
            fill
            priority
            sizes="100vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center 15%',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        background: 'linear-gradient(to right, rgba(2,2,2,0.98) 0%, rgba(2,2,2,0.88) 25%, rgba(2,2,2,0.4) 50%, rgba(2,2,2,0.15) 75%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        background: 'linear-gradient(to top, rgba(2,2,2,1) 0%, rgba(2,2,2,0.85) 15%, rgba(2,2,2,0.3) 40%, transparent 60%)',
      }} />
      {/* Top vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        background: 'linear-gradient(to bottom, rgba(2,2,2,0.5) 0%, transparent 15%)',
      }} />

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          minHeight: '112vh',
          padding: '120px 4% 0',
        }}
      >
        {/* Movie Info Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              maxWidth: 680,
              paddingBottom: 24,
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: 'clamp(28px, 4.5vw, 52px)',
                fontWeight: 800,
                lineHeight: 1.05,
                margin: 0,
                marginBottom: 16,
                color: '#fff',
                textShadow: '0 4px 30px rgba(0,0,0,0.6)',
                letterSpacing: '-1.5px',
                fontFamily: "'Poppins', sans-serif",
                textTransform: 'uppercase',
              }}
            >
              {movie.title || movie.name}
            </h1>

            {/* Metadata Row: Rating, Year, Runtime, Genre */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              {/* Content rating pill */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '0.5px',
              }}>
                12+
              </span>

              {/* CC icon */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 6px',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.85)',
              }}>
                CC
              </span>

              {/* Year */}
              <span style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
              }}>
                {year}
              </span>

              {/* Dot separator */}
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8 }}>●</span>

              {/* Runtime */}
              {runtime && (
                <>
                  <span style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 500,
                  }}>
                    {formatRuntime(runtime)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8 }}>●</span>
                </>
              )}

              {/* IMDb Rating */}
              <span style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
              }}>
                ⭐ {rating}
              </span>
            </div>

            {/* Genre Tags */}
            <div style={{
              display: 'flex',
              gap: 8,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}>
              {genres.slice(0, 3).map((g: Genre) => (
                <span
                  key={g.id}
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.65)',
                    fontWeight: 500,
                  }}
                >
                  {g.name}
                  {genres.indexOf(g) < Math.min(genres.length, 3) - 1 && (
                    <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.25)' }}>·</span>
                  )}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginBottom: 24,
            }}>
              {/* Trailer Button */}
              <Link
                href={`/movie/${movie.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 28px',
                  background: '#fff',
                  color: '#000',
                  borderRadius: 6,
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Poppins', sans-serif",
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
                  e.currentTarget.style.transform = 'scale(1.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#000">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
                Trailer
              </Link>

              {/* View Detail Button */}
              <Link
                href={`/movie/${movie.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(4px)',
                  color: '#fff',
                  borderRadius: 6,
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Poppins', sans-serif",
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.transform = 'scale(1.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                View Detail
              </Link>

              {/* Add to list button (+ circle) */}
              <button
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.35)',
                  color: '#fff',
                  fontSize: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Add to Watchlist"
              >
                +
              </button>
            </div>

            {/* Description */}
            <p style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: 15,
              lineHeight: 1.65,
              margin: 0,
              maxWidth: 600,
              fontWeight: 400,
              textShadow: '0 1px 8px rgba(0,0,0,0.5)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {movie.overview}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Suggested Movies Section */}
        <div style={{
          marginTop: 20,
          paddingBottom: 40,
          position: 'relative',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(10, 10, 10, 0.9) 90%, #0a0a0a 95%)',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px 40px',
          margin: '0 -20px',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: 28,
            marginBottom: 20,
            borderBottom: '2px solid rgba(255,255,255,0.08)',
            paddingBottom: 0,
          }}>
            {(['suggested', 'extras', 'details'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.45)',
                  fontSize: 15,
                  fontWeight: activeTab === tab ? 700 : 500,
                  cursor: 'pointer',
                  padding: '10px 0',
                  position: 'relative',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  fontFamily: "'Poppins', sans-serif",
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab) e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab) e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <motion.div
                    layoutId="hero-tab-underline"
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: '#fff',
                      borderRadius: 2,
                    }}
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
                style={{ position: 'relative' }}
              >
                {similarMovies.length > 0 ? (
                  <div style={{ position: 'relative' }}>
                    {/* Left Arrow */}
                    <button
                      onClick={() => scrollSuggested('left')}
                      style={{
                        position: 'absolute',
                        left: -8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.7)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                    >
                      ‹
                    </button>

                    <div
                      ref={suggestedRowRef}
                      style={{
                        display: 'flex',
                        gap: 12,
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        padding: '4px 0',
                        scrollSnapType: 'x mandatory',
                      }}
                    >
                      {similarMovies.map((sm, idx) => (
                        <SuggestedCard key={sm.id} movie={sm} index={idx} />
                      ))}
                    </div>

                    {/* Right Arrow */}
                    <button
                      onClick={() => scrollSuggested('right')}
                      style={{
                        position: 'absolute',
                        right: -8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.7)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                    >
                      ›
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    overflow: 'hidden',
                  }}>
                    {/* Skeleton placeholders */}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="skeleton"
                        style={{
                          minWidth: 220,
                          height: 130,
                          borderRadius: 8,
                          flexShrink: 0,
                        }}
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
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
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
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 20,
                  maxWidth: 800,
                }}
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

      {/* Progress Indicators */}
      {movies.length > 1 && (
        <div style={{
          position: 'absolute',
          right: '4%',
          bottom: '35%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 20,
        }}>
          {movies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              style={{
                width: 6,
                height: idx === currentIndex ? 28 : 6,
                borderRadius: 4,
                backgroundColor: idx === currentIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                border: 'none',
                padding: 0,
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

/* ─── Suggested Movie Card ─────────────────────────────────────────── */
function SuggestedCard({ movie, index }: { movie: Movie; index: number }) {
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
      style={{
        minWidth: 220,
        maxWidth: 220,
        flexShrink: 0,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        textDecoration: 'none',
        scrollSnapAlign: 'start',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isHovered ? 5 : 1,
        willChange: 'transform'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        background: '#1a1a1a',
      }}>
        <Image
          src={movie.backdrop_path ? backdropUrl(movie.backdrop_path, 'w780') : posterUrl(movie.poster_path, 'w500')}
          alt={movie.title || movie.name || ''}
          fill
          sizes="220px"
          style={{
            objectFit: 'cover',
            borderRadius: 8,
          }}
        />
        {/* Hover overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: isHovered
            ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
          borderRadius: 8,
          transition: 'all 0.3s ease',
        }} />

        {/* Title overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px 10px',
        }}>
          <p style={{
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            margin: 0,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            {movie.title || movie.name}
          </p>
        </div>

        {/* Play icon on hover */}
        {isHovered && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#000">
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
      <span style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: 4,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: 500,
      }}>
        {value}
      </span>
    </div>
  );
}
