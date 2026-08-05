'use client';

import { motion, useMotionValue, useTransform, PanInfo, animate } from 'framer-motion';
import { Movie } from '@/lib/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface SwipeCardProps {
  movie: Movie;
  onSwipe: (dir: 'left' | 'right') => void;
  isFront: boolean;
  index: number;
  triggerDirection?: 'left' | 'right' | null;
}

export default function SwipeCard({ movie, onSwipe, isFront, index, triggerDirection }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-15, 15]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Stamps opacity mapping
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -120], [0, 1]);

  useEffect(() => {
    if (isFront) {
      x.set(0);
    }
  }, [isFront, x]);

  // Handle programmatically triggered swipes (e.g. via action buttons)
  useEffect(() => {
    if (isFront && triggerDirection) {
      const flyX = triggerDirection === 'right' ? 700 : -700;
      animate(x, flyX, {
        duration: 0.22,
        ease: [0.25, 1, 0.5, 1],
        onComplete: () => onSwipe(triggerDirection),
      });
    }
  }, [isFront, triggerDirection, onSwipe, x]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 80;
    const velocityThreshold = 400;

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      const flyX = info.velocity.x > 0 ? Math.max(700, info.offset.x * 2.5) : 700;
      animate(x, flyX, {
        duration: 0.22,
        ease: [0.25, 1, 0.5, 1],
        onComplete: () => onSwipe('right'),
      });
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      const flyX = info.velocity.x < 0 ? Math.min(-700, info.offset.x * 2.5) : -700;
      animate(x, flyX, {
        duration: 0.22,
        ease: [0.25, 1, 0.5, 1],
        onComplete: () => onSwipe('left'),
      });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 380, damping: 26 });
    }
  };

  // ── Fan Out Stacking Logic ──
  const leftOffset = isMobile ? -58 : -105;
  const rightOffset = isMobile ? 58 : 105;

  const targetX = isFront
    ? x
    : index === 1
    ? leftOffset
    : index === 2
    ? rightOffset
    : 0;

  const targetRotate = isFront
    ? rotate
    : index === 1
    ? -12
    : index === 2
    ? 12
    : 0;

  const targetY = isFront ? 0 : 14;
  const scale = isFront ? 1.02 : 0.88;
  const zIndex = isFront ? 30 : index === 1 ? 20 : 10;

  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : null;

  return (
    <motion.div
      className="absolute w-[195px] xs:w-[225px] sm:w-[250px] md:w-[270px] aspect-[2/3] rounded-[26px] sm:rounded-[30px] overflow-hidden select-none touch-none"
      style={{
        zIndex,
        x: isFront ? x : targetX,
        rotate: isFront ? rotate : targetRotate,
      }}
      initial={{ scale: 0.8, y: 30, opacity: 0 }}
      animate={{
        scale,
        y: targetY,
        opacity: index > 2 ? 0 : 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] }
      }}
      transition={{ type: 'spring', stiffness: 340, damping: 25 }}
      {...(isFront
        ? {
            drag: 'x' as const,
            dragConstraints: { left: 0, right: 0 },
            dragElastic: 0.65,
            onDragEnd: handleDragEnd,
            whileTap: { cursor: 'grabbing', scale: 1.03 },
          }
        : {})}
    >
      <div
        className={`relative w-full h-full bg-[#0d0714] rounded-[28px] sm:rounded-[32px] overflow-hidden transition-all duration-300 ${
          isFront
            ? 'border-[3px] border-violet-500 shadow-[0_0_35px_rgba(139,92,246,0.45),0_20px_50px_rgba(0,0,0,0.9)]'
            : 'border-[2.5px] border-violet-600/70 shadow-[0_0_20px_rgba(139,92,246,0.25),0_15px_35px_rgba(0,0,0,0.8)]'
        }`}
      >
        {poster ? (
          <Image
            src={poster}
            alt={movie.title || 'Movie Poster'}
            fill
            className="object-cover pointer-events-none"
            sizes="(max-width: 640px) 240px, 290px"
            priority={isFront}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/40 bg-zinc-900 p-6 text-center">
            <span className="text-4xl mb-2">🎬</span>
            <span className="text-sm font-semibold">{movie.title || 'Untitled'}</span>
          </div>
        )}

        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/10 pointer-events-none" />

        {/* Top Rating & Year Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
          {movie.vote_average ? (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-amber-400 text-xs font-black">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{movie.vote_average.toFixed(1)}</span>
            </div>
          ) : <div />}
          {movie.release_date && (
            <div className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/80 text-xs font-bold">
              {new Date(movie.release_date).getFullYear()}
            </div>
          )}
        </div>

        {/* Bottom Title on Card */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-20 pointer-events-none flex flex-col gap-1 text-left">
          <h2 className="text-lg sm:text-xl font-black text-white leading-tight tracking-tight uppercase drop-shadow-md line-clamp-1">
            {movie.title || movie.name}
          </h2>
          {movie.overview && (
            <p className="text-[11px] sm:text-xs text-white/70 font-medium line-clamp-2 leading-relaxed">
              {movie.overview}
            </p>
          )}
        </div>

        {/* Swipe Feedback Stamps */}
        {isFront && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-10 right-5 border-[3.5px] border-emerald-400 text-emerald-400 rounded-2xl px-3.5 py-1 text-xl font-black rotate-[14deg] tracking-widest uppercase pointer-events-none z-50 bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(52,211,153,0.5)]"
            >
              LIKE
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-10 left-5 border-[3.5px] border-rose-500 text-rose-500 rounded-2xl px-3.5 py-1 text-xl font-black -rotate-[14deg] tracking-widest uppercase pointer-events-none z-50 bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(244,63,94,0.5)]"
            >
              NOPE
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
