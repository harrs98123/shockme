'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import SarcasticPosterFallback from '@/components/SarcasticPosterFallback';

interface Props {
  index: number;
  movie: {
    id?: number;
    movie_id: number;
    title: string;
    poster_path: string | null;
    release_year?: string | null;
    vote_average?: number | null;
    rank?: number;
    custom_note?: string | null;
  };
  isOwner?: boolean;
  onRemove?: (id: number) => void;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

export default function NumberedCollectionCard({ index, movie, isOwner, onRemove }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(!movie.poster_path);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative', width: '100%' }}
    >
      <Link href={`/movie/${movie.movie_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#111', aspectRatio: '2/3' }}>
          {/* Large Number Overlay */}
          <span style={{
            position: 'absolute',
            top: -10,
            left: -5,
            zIndex: 10,
            fontSize: '80px',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1,
            letterSpacing: '-5px'
          }}>
            {index + 1}
          </span>

          {!imgError && movie.poster_path ? (
            <>
              <Image
                src={`${TMDB_IMG}${movie.poster_path}`}
                alt={movie.title}
                fill
                style={{ 
                  objectFit: 'cover',
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                }}
                onError={() => setImgError(true)}
              />
              
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)',
                opacity: isHovered ? 1 : 0.6,
                transition: 'opacity 0.3s'
              }} />
            </>
          ) : (
            <SarcasticPosterFallback title={movie.title} seed={movie.movie_id || index} />
          )}

          {movie.vote_average && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
              borderRadius: 8, padding: '4px 8px', fontSize: 12, fontWeight: 800, color: '#facc15',
              border: '1px solid rgba(255,255,255,0.1)', zIndex: 11
            }}>
              ★ {movie.vote_average.toFixed(1)}
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <h3 style={{ 
            margin: 0, fontSize: 15, fontWeight: 700, color: 'white',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {movie.title}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
            {movie.release_year}
          </p>
        </div>
      </Link>

      {isOwner && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onRemove?.(movie.movie_id);
          }}
          disabled={!onRemove}
          style={{
            position: 'absolute', top: -8, right: -8,
            width: 32, height: 32, borderRadius: '50%',
            background: '#ef4444', color: 'white',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 20,
          }}
          className="remove-btn hover:scale-110 hover:!bg-[#dc2626] transition-transform duration-200"
          title="Remove from collection"
        >
          ×
        </button>
      )}
    </motion.div>
  );
}
