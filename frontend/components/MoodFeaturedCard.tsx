'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Heart, Star, Zap, Plus, Check, Info, Flame } from 'lucide-react';
import { Media } from '@/lib/types';
import { backdropUrl, posterUrl } from '@/lib/api';
import { GlowConfig } from '@/lib/finderData';
import toast from '@/lib/toast';
import AddToCollectionButton from './AddToCollectionButton';

interface MoodFeaturedCardProps {
  movie: Media;
  isFav?: boolean;
  onFavToggle?: (media: Media) => void;
  isWatchlisted?: boolean;
  onWatchlistToggle?: (media: Media) => void;
  accentGlow?: GlowConfig;
}

export default function MoodFeaturedCard({
  movie,
  isFav = false,
  onFavToggle,
  isWatchlisted = false,
  onWatchlistToggle,
  accentGlow,
}: MoodFeaturedCardProps) {
  const [localFav, setLocalFav] = useState(isFav);
  const [localWatchlist, setLocalWatchlist] = useState(isWatchlisted);

  useEffect(() => { setLocalFav(isFav); }, [isFav]);
  useEffect(() => { setLocalWatchlist(isWatchlisted); }, [isWatchlisted]);

  const title = movie.title || movie.name || 'Untitled';
  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
  const dateStr = movie.release_date || movie.first_air_date;
  const releaseYear = dateStr ? new Date(dateStr).getFullYear() : 'N/A';

  const handleFavClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('cinematch_token');
    if (!token) {
      toast.error('Please log in to save favorites.');
      return;
    }
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      if (localFav) {
        const res = await fetch(`${API_BASE}/favorites/${movie.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setLocalFav(false);
          onFavToggle?.(movie);
          toast.info(`Removed "${title}" from Favorites`);
        }
      } else {
        const res = await fetch(`${API_BASE}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            movie_id: movie.id,
            media_type: mediaType,
            title,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            release_year: releaseYear.toString(),
            vote_average: movie.vote_average,
          }),
        });
        if (res.ok || res.status === 400) {
          setLocalFav(true);
          onFavToggle?.(movie);
          toast.success(`Added "${title}" to Favorites ❤️`);
        }
      }
    } catch (err) {
      console.error('Failed to update favorite:', err);
      toast.error('Failed to update favorite.');
    }
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('cinematch_token');
    if (!token) {
      toast.error('Please log in to update your watchlist.');
      return;
    }
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      if (localWatchlist) {
        const res = await fetch(`${API_BASE}/watchlist/${movie.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setLocalWatchlist(false);
          onWatchlistToggle?.(movie);
          toast.info(`Removed "${title}" from Watchlist`);
        }
      } else {
        const res = await fetch(`${API_BASE}/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            movie_id: movie.id,
            media_type: mediaType,
            title,
            poster_path: movie.poster_path,
          }),
        });
        if (res.ok || res.status === 400) {
          setLocalWatchlist(true);
          onWatchlistToggle?.(movie);
          toast.success(`Added "${title}" to Watchlist`);
        }
      }
    } catch (err) {
      console.error('Failed to update watchlist:', err);
      toast.error('Failed to update watchlist.');
    }
  };

  const bgImage = backdropUrl(movie.backdrop_path) || posterUrl(movie.poster_path);
  const primaryGlow = accentGlow?.primary || '#7c3aed';
  const shadowGlow = accentGlow?.shadow || 'rgba(124, 58, 237, 0.25)';

  return (
    <div
      className="relative rounded-3xl overflow-hidden border bg-[#0b0318]/90 backdrop-blur-xl transition-all duration-500 hover:scale-[1.005]"
      style={{
        borderColor: accentGlow ? accentGlow.border : 'rgba(255, 255, 255, 0.15)',
        boxShadow: `0 20px 50px ${shadowGlow}`,
      }}
    >
      {/* ── BACKGROUND ART ── */}
      <div className="absolute inset-0 z-0">
        {bgImage && (
          <Image
            src={bgImage}
            alt={title}
            fill
            className="object-cover object-center opacity-30 filter blur-[3px] scale-105"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0318] via-[#0b0318]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0318] via-transparent to-[#0b0318]/70" />
      </div>

      {/* ── CONTENT CONTAINER ── */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-10">
        {/* Poster */}
        <div className="relative w-40 sm:w-48 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex-shrink-0 group">
          <Image
            src={posterUrl(movie.poster_path)}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full shadow-lg text-[10px] font-black uppercase text-white tracking-wider backdrop-blur-md"
            style={{ background: primaryGlow }}
          >
            <Flame className="w-3.5 h-3.5 fill-white" />
            Top Match
          </div>
        </div>

        {/* Info & Details */}
        <div className="flex-1 space-y-4 text-left w-full">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-bold tracking-wide backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              99% VIBE RESONANCE MATCH
            </div>

            <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 text-xs font-black">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{movie.vote_average?.toFixed(1) || 'N/A'}</span>
            </div>

            <span className="text-xs font-bold text-white/60 px-2 py-0.5">{releaseYear}</span>
            {mediaType === 'tv' && <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-xs font-bold border border-white/15">Series</span>}
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {title}
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-gray-300/90 leading-relaxed max-w-2xl font-normal line-clamp-3 md:line-clamp-4">
            {movie.overview || 'No synopsis available.'}
          </p>

          {movie.reason && (
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block mb-1">
                AI Match Reasoning
              </span>
              <p className="text-xs text-white/90 italic font-medium leading-relaxed">
                &quot;{movie.reason}&quot;
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 pt-2 w-full">
            <Link
              href={`/${mediaType}/${movie.id}`} prefetch={false}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: primaryGlow }}
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>Explore</span>
            </Link>

            <button
              onClick={handleFavClick}
              className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                localFav
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4 shrink-0" fill={localFav ? 'currentColor' : 'none'} />
              <span>{localFav ? 'Favorited' : 'Favorite'}</span>
            </button>

            <button
              onClick={handleWatchlistClick}
              className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                localWatchlist
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {localWatchlist ? <Check className="w-4 h-4 shrink-0" /> : <Plus className="w-4 h-4 shrink-0" />}
              <span>{localWatchlist ? 'Watchlisted' : 'Watchlist'}</span>
            </button>

            <div className="flex items-center justify-center">
              <AddToCollectionButton movie={movie} showRankButton={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
