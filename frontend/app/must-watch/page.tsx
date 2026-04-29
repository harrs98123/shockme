'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { publicApi, posterUrl, releaseYear } from '@/lib/api';
import { MustWatch } from '@/lib/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Play, Bookmark } from 'lucide-react';

export default function MustWatchPage() {
  const [movies, setMovies] = useState<MustWatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMustWatch = async () => {
      try {
        setLoading(true);
        const data = await publicApi.getMustWatch();
        setMovies(data);
      } catch (err) {
        console.error('Failed to fetch must watch list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMustWatch();
  }, []);

  // Distribute into 6 columns for a dense cinematic grid like the image
  const numCols = 6;
  const columns: MustWatch[][] = Array.from({ length: numCols }, () => []);
  movies.forEach((m, i) => {
    columns[i % numCols].push(m);
  });

  return (
    <div
      className="min-h-screen text-neutral-50 pb-32 selection:bg-white/20"
      style={{
        background: 'radial-gradient(ellipse at 20% 0%, #1a0a2e 0%, #0a0a0f 50%, #000000 100%)',
        fontFamily: "'DM Sans', 'Inter', sans-serif",
      }}
    >
      {/* Subtle noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-[2px] border-white/10 border-t-white/80 rounded-full"
          />
        </div>
      ) : (
        <div className="relative z-10">
          {/* ── Hero ── */}
          <section className="relative pt-36 pb-20 px-8 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-700/20 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-4xl mx-auto flex flex-col items-center relative"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}
              >
                <Bookmark className="w-3 h-3 text-violet-400" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-violet-300">
                  Curated Archive
                </span>
              </motion.div>

              <h1
                className="text-6xl md:text-8xl font-black tracking-tighter mb-5 leading-none"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.5) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.04em',
                }}
              >
                Must Watch
              </h1>

              <p className="text-base text-neutral-400 leading-relaxed font-light max-w-lg">
                A definitive collection of cinematic masterpieces — curated to highlight the beauty, tension, and emotion of the medium.
              </p>

              {movies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 flex items-center gap-2 text-sm text-neutral-500"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {movies.length} titles in the collection
                </motion.div>
              )}
            </motion.div>
          </section>

          {/* ── Cinematic Masonry Grid ── */}
          <section className="px-3 md:px-4 max-w-[1600px] mx-auto">
            {movies.length === 0 ? (
              <div className="text-center py-40 rounded-3xl border border-white/5 bg-white/[0.02] max-w-xl mx-auto">
                <p className="text-neutral-500 text-lg">The collection is currently empty.</p>
              </div>
            ) : (
              <>
                {/* Desktop: 6-column dense masonry */}
                <div className="hidden lg:grid grid-cols-6 gap-3">
                  {columns.map((columnMovies, colIdx) => (
                    <div
                      key={colIdx}
                      className="flex flex-col gap-3"
                      style={{
                        marginTop:
                          colIdx === 1 ? '48px'
                            : colIdx === 2 ? '16px'
                              : colIdx === 3 ? '64px'
                                : colIdx === 4 ? '24px'
                                  : colIdx === 5 ? '80px'
                                    : '0px',
                      }}
                    >
                      {columnMovies.map((movie, movieIdx) => (
                        <MovieCard
                          key={movie.movie_id}
                          movie={movie}
                          index={movieIdx * numCols + colIdx}
                          // Vary aspect ratios for a natural masonry feel
                          aspectRatio={
                            (movieIdx + colIdx) % 5 === 0
                              ? 'aspect-[3/4]'
                              : (movieIdx + colIdx) % 3 === 0
                                ? 'aspect-[2/3]'
                                : 'aspect-[9/13]'
                          }
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Tablet: 3 columns */}
                <div className="hidden sm:grid lg:hidden grid-cols-3 gap-3">
                  {Array.from({ length: 3 }, (_, ci) => (
                    <div key={ci} className="flex flex-col gap-3" style={{ marginTop: ci === 1 ? '32px' : '0px' }}>
                      {movies
                        .filter((_, i) => i % 3 === ci)
                        .map((movie, idx) => (
                          <MovieCard key={movie.movie_id} movie={movie} index={idx * 3 + ci} isMobile />
                        ))}
                    </div>
                  ))}
                </div>

                {/* Mobile: 2 columns */}
                <div className="grid sm:hidden grid-cols-2 gap-2">
                  {[0, 1].map((ci) => (
                    <div key={ci} className="flex flex-col gap-2" style={{ marginTop: ci === 1 ? '24px' : '0px' }}>
                      {movies
                        .filter((_, i) => i % 2 === ci)
                        .map((movie, idx) => (
                          <MovieCard key={movie.movie_id} movie={movie} index={idx * 2 + ci} isMobile />
                        ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

interface MovieCardProps {
  movie: MustWatch;
  index: number;
  aspectRatio?: string;
  isMobile?: boolean;
}

function MovieCard({ movie, index, aspectRatio = 'aspect-[2/3]', isMobile = false }: MovieCardProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.65,
        delay: (index % 6) * 0.07,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`group relative w-full cursor-pointer ${aspectRatio}`}
      onClick={() => router.push(`/movie/${movie.movie_id}`)}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
    >
      <div
        className="relative w-full h-full overflow-hidden rounded-xl"
        style={{
          boxShadow: hovered
            ? '0 20px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.12)'
            : '0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Poster Image */}
        <Image
          src={posterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
          style={{
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.7s cubic-bezier(0.16,1,0.3,1)',
          }}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
          priority={index < 12}
        />

        {/* Always-visible subtle bottom gradient for readability */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 35%, transparent 65%)',
          }}
        />

        {/* Rating badge — always visible */}
        {movie.vote_average && (
          <div
            className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold"
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: movie.vote_average >= 8 ? '#fbbf24' : movie.vote_average >= 7 ? '#e5e7eb' : '#9ca3af',
            }}
          >
            <Star className="w-2.5 h-2.5 fill-current" />
            {movie.vote_average.toFixed(1)}
          </div>
        )}

        {/* Title always visible at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p
            className="text-white font-semibold text-xs leading-tight line-clamp-2"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
          >
            {movie.title}
          </p>
          {movie.release_date && (
            <p className="text-white/50 text-[10px] mt-0.5 font-medium">
              {releaseYear(movie.release_date)}
            </p>
          )}
        </div>

        {/* Desktop-only hover overlay with play button */}
        {!isMobile && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(109,40,217,0.5) 0%, rgba(0,0,0,0.65) 100%)',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.35s ease',
            }}
          >
            <motion.div
              animate={hovered ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center gap-3"
            >
              {/* Play button ring */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 0 30px rgba(139,92,246,0.6)',
                }}
              >
                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
              </div>
              <span
                className="text-xs font-semibold text-white/90 tracking-widest uppercase"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                View Details
              </span>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}