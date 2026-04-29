"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Movie } from '@/lib/types';
import SwipeCard from './SwipeCard';

interface SwipeDeckProps {
  initialMovies: Movie[];
}

export default function SwipeDeck({ initialMovies }: SwipeDeckProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);

  const handleSwipe = (dir: 'left' | 'right', index: number) => {
    // Optionally trigger an API call here for right swipe
    if (dir === 'right') {
      console.log(`Liked movie: ${movies[index]?.title}`);
      // ADD TO FAVORITES API HERE
    } else {
      console.log(`Passed on movie: ${movies[index]?.title}`);
    }

    // Remove top card
    setMovies((prev) => prev.slice(1));
  };

  return (
    <div className="relative w-full h-full max-w-md mx-auto flex flex-col items-center justify-center pt-16">
      <div className="relative w-full h-[55vh] flex items-center justify-center">
        {movies.length === 0 ? (
          <div className="text-zinc-500 font-medium text-lg flex flex-col items-center gap-4 animate-pulse">
            <span className="text-4xl">🍿</span>
            <p>Finding more matches...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {movies
              .slice(0, 3)
              .map((movie, i) => (
                <SwipeCard
                  key={movie.id}
                  movie={movie}
                  isFront={i === 0}
                  index={i}
                  onSwipe={(dir) => handleSwipe(dir, 0)}
                />
              ))
              .reverse()
            }
          </AnimatePresence>
        )}
      </div>

      {/* Movie Info below cards */}
      <AnimatePresence mode="wait">
        {movies[0] && (
          <motion.div
            key={movies[0].id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8 text-center z-20"
          >
            <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-2xl">
              {movies[0].title}
            </h1>
            <p className="text-lg text-zinc-500 mt-2 font-medium tracking-wide italic">
              {/* Fallback genres if not provided */}
              {movies[0].genres?.map(g => g.name).join(', ') || 'Thriller'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
