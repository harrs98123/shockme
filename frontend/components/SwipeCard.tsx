import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Movie } from '@/lib/types';
import Image from 'next/image';
import { useState } from 'react';

interface SwipeCardProps {
  movie: Movie;
  onSwipe: (dir: 'left' | 'right') => void;
  isFront: boolean;
  index: number;
}

export default function SwipeCard({ movie, onSwipe, isFront, index }: SwipeCardProps) {
  const x = useMotionValue(0);

  // Rotation and Opacity based on X drag distance
  const rotate = useTransform(x, [-200, 200], [-10, 10]);

  // Stamps opacity mapping
  const likeOpacity = useTransform(x, [10, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-10, -100], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      onSwipe('right');
    } else if (info.offset.x < -swipeThreshold) {
      onSwipe('left');
    }
  };

  // Only the front card is interactive
  const dragProps = isFront ? {
    drag: "x" as const,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: 0.8,
    onDragEnd: handleDragEnd,
    whileTap: { cursor: 'grabbing' },
  } : {};

  // Stack effect calculations
  // Subsequent cards scale down and shift up slightly
  const scale = isFront ? 1 : Math.max(0.85, 1 - (index * 0.05));
  const yOffset = isFront ? 0 : index * 10;

  return (
    <motion.div
      className="absolute w-full h-full max-w-[240px] sm:max-w-[320px] aspect-[2/3] rounded-[40px] overflow-hidden shadow-2xl cursor-grab"
      style={{
        x,
        rotate,
        zIndex: 100 - index,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale,
        opacity: index > 2 ? 0 : 1,
        x: isFront ? x.get() : (index === 1 ? -60 : index === 2 ? 60 : 0),
        y: isFront ? 0 : 10,
        rotate: isFront ? rotate.get() : (index === 1 ? -5 : index === 2 ? 5 : 0),
      }}
      exit={{
        x: x.get() > 0 ? 500 : -500,
        opacity: 0,
        scale: 0.5,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      {...dragProps}
    >
      <div className="relative w-full h-full bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl shadow-black/80 overflow-hidden">
        {movie.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`}
            alt={movie.title || 'Movie Poster'}
            fill
            className="object-cover pointer-events-none"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={isFront}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-800">
            No Poster Available
          </div>
        )}

        {/* Subtle top light for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {/* Swipe Feedback Stamps */}
        {isFront && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-12 right-6 border-[4px] border-emerald-500 text-emerald-500 rounded-xl px-4 py-1 text-2xl font-black rotate-[15deg] tracking-widest uppercase pointer-events-none z-50 bg-black/20 backdrop-blur-sm"
            >
              LIKE
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-12 left-6 border-[4px] border-rose-500 text-rose-500 rounded-xl px-4 py-1 text-2xl font-black -rotate-[15deg] tracking-widest uppercase pointer-events-none z-50 bg-black/20 backdrop-blur-sm"
            >
              NOPE
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
