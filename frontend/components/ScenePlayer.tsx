'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Film,
  Maximize2,
  X,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface ScenePlayerProps {
  mediaUrl?: string;
  videoUrl?: string;
  youtubeId?: string;
  movieTitle?: string;
  movieId?: number | null;
  sceneTitle?: string;
  caption?: string;
  className?: string;
}

/**
 * Extracts a YouTube Video ID from any standard YouTube URL or returns the string if already an ID.
 */
export function extractYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Check standard YouTube patterns
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

// Fallback curated YouTube scene clips for popular movie IDs / titles
const CURATED_SCENE_CLIPS: Record<string, string> = {
  '157336': 'a3lcGnMhvsA', // Interstellar (Docking)
  '19666': 'ZZY-Ytrw2co',  // Whiplash (Caravan)
  '27205': 'i5P8lOD_Y04',  // Inception (Hallway)
  '680': 'Jomr9SAjcyU',    // Pulp Fiction (Diner)
  '155': 'x3o_X64_qgM',    // The Dark Knight (Interrogation)
  '324857': 'MmA-o3X_7m8', // Spider-Man: Spider-Verse (Leap of Faith)
  '550': '11eBZd7zdbs',    // Fight Club (Finale)
  '313369': '0cO_v2L2p7E', // La La Land (Planetarium)
  '299534': 'VPOiQWb1OqQ', // Avengers: Endgame (Portals)
  '603': 'Es2uYtSGS-Y',    // The Matrix (Lobby)
  '335984': 'iWBM_3mY5s4', // Blade Runner 2049
  '693134': 'vJj8Z1gqj44', // Dune: Part Two
  'interstellar': 'a3lcGnMhvsA',
  'whiplash': 'ZZY-Ytrw2co',
  'inception': 'i5P8lOD_Y04',
  'pulp fiction': 'Jomr9SAjcyU',
  'dark knight': 'x3o_X64_qgM',
  'spider-verse': 'MmA-o3X_7m8',
  'fight club': '11eBZd7zdbs',
  'la la land': '0cO_v2L2p7E',
  'endgame': 'VPOiQWb1OqQ',
  'matrix': 'Es2uYtSGS-Y',
  'blade runner': 'iWBM_3mY5s4',
  'dune': 'vJj8Z1gqj44',
};

export default function ScenePlayer({
  mediaUrl,
  videoUrl,
  youtubeId,
  movieTitle,
  movieId,
  sceneTitle,
  caption,
  className = '',
}: ScenePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);

  // Resolve YouTube Video ID
  const effectiveYouTubeId = useMemo(() => {
    if (youtubeId && youtubeId.trim().length > 0) {
      return extractYouTubeId(youtubeId);
    }
    if (videoUrl && videoUrl.trim().length > 0) {
      const fromUrl = extractYouTubeId(videoUrl);
      if (fromUrl) return fromUrl;
    }
    if (mediaUrl && (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be'))) {
      const fromMedia = extractYouTubeId(mediaUrl);
      if (fromMedia) return fromMedia;
    }
    if (movieId && CURATED_SCENE_CLIPS[String(movieId)]) {
      return CURATED_SCENE_CLIPS[String(movieId)];
    }
    if (movieTitle) {
      const lower = movieTitle.toLowerCase();
      for (const [key, id] of Object.entries(CURATED_SCENE_CLIPS)) {
        if (lower.includes(key)) return id;
      }
    }
    if (caption) {
      const lower = caption.toLowerCase();
      for (const [key, id] of Object.entries(CURATED_SCENE_CLIPS)) {
        if (lower.includes(key)) return id;
      }
    }
    return null;
  }, [youtubeId, videoUrl, mediaUrl, movieId, movieTitle, caption]);

  const embedUrl = useMemo(() => {
    if (effectiveYouTubeId) {
      return `https://www.youtube-nocookie.com/embed/${effectiveYouTubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    }
    const searchTarget = movieTitle || sceneTitle || caption?.slice(0, 40) || 'Iconic movie scene';
    return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(searchTarget + ' scene')}&autoplay=1`;
  }, [effectiveYouTubeId, movieTitle, sceneTitle, caption]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
  };

  return (
    <>
      <div
        className={`relative w-full rounded-2xl overflow-hidden my-3 border border-white/10 group select-none ${className}`}
        style={{
          aspectRatio: '16 / 9',
          background: '#09090c',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}
      >
        {isPlaying ? (
          <div className="relative w-full h-full bg-black">
            <iframe
              src={embedUrl}
              title={sceneTitle || movieTitle || 'Movie Scene Player'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={() => setIsTheaterOpen(true)}
                title="Expand Cinema Theater Mode"
                className="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all shadow-lg hover:scale-105"
              >
                <Maximize2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying(false)}
                title="Close video"
                className="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all shadow-lg hover:scale-105"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={handlePlayClick}
            className="relative w-full h-full cursor-pointer flex items-center justify-center overflow-hidden"
          >
            {mediaUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={mediaUrl}
                alt={sceneTitle || movieTitle || 'Movie Scene Poster'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-neutral-950 to-black flex items-center justify-center">
                <Film size={48} className="text-white/20" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 group-hover:via-black/20 transition-all duration-200" />

            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 shadow-md">
                <Play size={10} className="text-primary fill-primary" />
                <span>Scene Clip</span>
              </div>
              {movieTitle && (
                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white/90 border border-white/10 truncate max-w-[200px]">
                  {movieTitle}
                </div>
              )}
            </div>

            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-amber-400 border border-amber-400/30">
              4K HDR
            </div>

            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="relative z-10 flex flex-col items-center gap-2"
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: '#E50914',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                }}
              >
                <Play size={22} className="fill-white translate-x-0.5" />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: '#fff',
                  textShadow: '0 2px 6px rgba(0,0,0,0.8)',
                }}
              >
                Play Scene
              </span>
            </motion.div>

            {sceneTitle && (
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <div className="text-sm font-bold text-white truncate drop-shadow-md">
                  {sceneTitle}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isTheaterOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0, 0, 0, 0.94)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
            onClick={() => setIsTheaterOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                maxWidth: 960,
                background: '#0c0c10',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: '0 40px 100px rgba(0, 0, 0, 0.9), 0 0 50px rgba(229, 9, 20, 0.2)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(20, 20, 25, 0.9)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: 'rgba(229,9,20,0.15)',
                      border: '1px solid rgba(229,9,20,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary, #E50914)',
                    }}
                  >
                    <Film size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#fff' }}>
                      {movieTitle || sceneTitle || 'Iconic Scene Theater'}
                    </h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                      Cinema Experience • High Fidelity Stream
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {movieId && (
                    <Link
                      href={`/movie/${movieId}`} prefetch={false}
                      target="_blank"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={13} /> View Movie
                    </Link>
                  )}
                  <button
                    onClick={() => setIsTheaterOpen(false)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div style={{ width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
                <iframe
                  src={embedUrl}
                  title="Cinema Scene Theater"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {caption && (
                <div style={{ padding: '16px 24px', background: '#101015' }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>
                    {caption}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
