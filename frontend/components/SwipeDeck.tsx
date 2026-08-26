'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Movie } from '@/lib/types';
import SwipeCard from './SwipeCard';
import { Heart, X, RotateCcw, Info, Film } from 'lucide-react';
import Link from 'next/link';

interface SwipeDeckProps {
  initialMovies: Movie[];
}

export default function SwipeDeck({ initialMovies }: SwipeDeckProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [history, setHistory] = useState<Movie[]>([]);
  const [triggerDir, setTriggerDir] = useState<'left' | 'right' | null>(null);

  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    if (movies.length === 0) return;

    const currentMovie = movies[0];
    if (dir === 'right') {
      console.log(`Liked movie: ${currentMovie?.title}`);
      // Save favorite to API if user is authenticated
      const token = typeof window !== 'undefined' ? localStorage.getItem('cinematch_token') : null;
      if (token && currentMovie?.id) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        fetch(`${API_BASE}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            movie_id: currentMovie.id,
            media_type: 'movie',
            title: currentMovie.title || currentMovie.name,
            poster_path: currentMovie.poster_path,
          }),
        }).catch(err => console.error('Failed to save favorite from swipe:', err));
      }
    }

    setHistory(prev => [currentMovie, ...prev]);
    setMovies(prev => prev.slice(1));
    setTriggerDir(null);
  }, [movies]);

  const handleButtonClick = (dir: 'left' | 'right') => {
    if (movies.length === 0 || triggerDir) return;
    setTriggerDir(dir);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousMovie = history[0];
    setHistory(prev => prev.slice(1));
    setMovies(prev => [previousMovie, ...prev]);
  };

  return (
    <div className="relative w-full h-full max-w-xl mx-auto flex flex-col items-center justify-center pt-6 sm:pt-10 px-4 mt-2 sm:mt-4">
      {/* ── CARD STACK CONTAINER ── */}
      <div className="relative w-full h-[44vh] sm:h-[48vh] md:h-[52vh] flex items-center justify-center">
        {movies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md max-w-xs z-30"
          >
            <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
              <Film className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Reel Empty</h3>
            <p className="text-xs text-white/50 mb-6 leading-relaxed">
              You&apos;ve swiped through all available titles! Tap below to restore cards.
            </p>
            {history.length > 0 && (
              <button
                onClick={handleUndo}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Restore Reel
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence>
            {movies
              .slice(0, 3)
              .map((movie, i) => (
                <SwipeCard
                  key={movie.id}
                  movie={movie}
                  isFront={i === 0}
                  index={i}
                  triggerDirection={i === 0 ? triggerDir : null}
                  onSwipe={handleSwipe}
                />
              ))
              .reverse()
            }
          </AnimatePresence>
        )}
      </div>

      {/* ── INTERACTIVE ACTION CONTROLS BAR ── */}
      <div className="flex items-center justify-center gap-5 sm:gap-7 mt-6 sm:mt-10 z-40">
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/5 border border-white/15 text-amber-400 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed hover:bg-amber-400/10 hover:border-amber-400/30"
          title="Undo last swipe"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Pass / Dislike Button */}
        <button
          onClick={() => handleButtonClick('left')}
          disabled={movies.length === 0}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.25)] transition-all hover:scale-110 hover:bg-rose-500/25 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
          title="Pass (Swipe Left)"
        >
          <X className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.8} />
        </button>

        {/* Info / Details Button */}
        {movies[0] ? (
          <Link
            href={`/movie/${movies[0].id}`}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:bg-purple-500/25 active:scale-95"
            title="View Details"
          >
            <Info className="w-5 h-5" />
          </Link>
        ) : (
          <div className="w-12 h-12" />
        )}

        {/* Like Button */}
        <button
          onClick={() => handleButtonClick('right')}
          disabled={movies.length === 0}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_25px_rgba(52,211,153,0.25)] transition-all hover:scale-110 hover:bg-emerald-500/25 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
          title="Like (Swipe Right)"
        >
          <Heart className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
