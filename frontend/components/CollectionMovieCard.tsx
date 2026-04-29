'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '@/lib/types';
import AddToCollectionButton from './AddToCollectionButton';

interface Props {
  movie: Movie;
  index: number;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

export default function CollectionMovieCard({ movie, index }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const year = movie.release_date?.slice(0, 4) || 'N/A';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ delay: index * 0.05, duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        background: '#0d0d0d',
        aspectRatio: '2/3',
        cursor: 'pointer',
        boxShadow: isHovered 
          ? '0 30px 60px -15px rgba(0,0,0,0.8), 0 0 20px rgba(139,92,246,0.2)' 
          : '0 8px 30px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isHovered ? 10 : 1,
      }}
    >
      <Link href={`/movie/${movie.id}`} style={{ display: 'block', height: '100%' }}>
        {/* Poster Image */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image
            src={movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : '/no-poster.png'}
            alt={movie.title || 'Movie Poster'}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            style={{ 
              objectFit: 'cover',
              transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isHovered ? 'scale(1.15)' : 'scale(1)'
            }}
            loading="lazy"
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
            opacity: isHovered ? 0.95 : 0.7,
            transition: 'opacity 0.3s'
          }} />
        </div>

        {/* Floating Rating */}
        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 5,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
          borderRadius: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
        }}>
          <span style={{ color: '#facc15', fontSize: 13, fontWeight: 900 }}>★</span>
          <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>{movie.vote_average?.toFixed(1) || '0.0'}</span>
        </div>

        {/* Content Info */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 6,
          padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div>
            <h4 style={{
              margin: 0, fontSize: 16, fontWeight: 800, color: 'white',
              lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)', letterSpacing: '-0.2px'
            }}>
              {movie.title || 'Untitled'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{year}</span>
              <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 900 }}>4K ULTRA HD</span>
            </div>
          </div>

          {/* Interaction Bar */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                onClick={e => e.preventDefault()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px', background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(24px)', borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ flex: 1 }}>
                   <AddToCollectionButton movie={movie} showRankButton={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </motion.div>
  );
}
