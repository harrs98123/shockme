'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Heart, Star, Gauge, Plus, Check, Info } from 'lucide-react';
import { Media } from '@/lib/types';
import { posterUrl } from '@/lib/api';
import { GlowConfig } from '@/lib/finderData';
import { getEnglishTitle } from '@/lib/utils';
import toast from '@/lib/toast';
import AddToCollectionButton from './AddToCollectionButton';

interface MoodMovieCardProps {
  movie: Media;
  index: number;
  isFav?: boolean;
  onFavToggle?: (media: Media) => void;
  isWatchlisted?: boolean;
  onWatchlistToggle?: (media: Media) => void;
  isWatched?: boolean;
  onWatchedToggle?: (media: Media) => void;
  moodQuery?: string;
  accentGlow?: GlowConfig;
}

export default function MoodMovieCard({
  movie,
  index,
  isFav = false,
  onFavToggle,
  isWatchlisted = false,
  onWatchlistToggle,
  isWatched = false,
  onWatchedToggle,
  accentGlow,
}: MoodMovieCardProps) {
  const [imgError, setImgError] = useState(!movie.poster_path);
  const [isHovered, setIsHovered] = useState(false);
  const [localFav, setLocalFav] = useState(isFav);
  const [localWatchlist, setLocalWatchlist] = useState(isWatchlisted);
  const [localWatched, setLocalWatched] = useState(isWatched);

  useEffect(() => { setLocalFav(isFav); }, [isFav]);
  useEffect(() => { setLocalWatchlist(isWatchlisted); }, [isWatchlisted]);
  useEffect(() => { setLocalWatched(isWatched); }, [isWatched]);

  const title = getEnglishTitle(movie);
  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
  const dateStr = movie.release_date || movie.first_air_date;
  const releaseYear = dateStr ? new Date(dateStr).getFullYear() : 'N/A';

  // Calculate dynamic vibe match percentage based on index and rating
  const matchPercentage = Math.max(82, Math.min(99, Math.round(98 - index * 1.5 + (movie.vote_average || 7) * 0.2)));

  const borderStyle = isHovered && accentGlow ? accentGlow.border : 'rgba(255, 255, 255, 0.1)';
  const shadowStyle = isHovered && accentGlow ? `0 12px 35px -8px ${accentGlow.shadow}` : '0 10px 25px -10px rgba(0,0,0,0.5)';

  const handleFavClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    e.stopPropagation();
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

  return (
    <div
      className="group relative flex flex-col h-full rounded-2xl bg-[#0e0819]/80 backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 overflow-hidden border"
      style={{
        borderColor: borderStyle,
        boxShadow: shadowStyle,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── CARD MEDIA CONTAINER ── */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#07030e]">
        <Image
          src={posterUrl(movie.poster_path)}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0819] via-transparent to-black/50 opacity-80 group-hover:opacity-40 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 gap-2">
          {/* Vibe Match Tag */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/90 text-[10px] font-extrabold tracking-wider">
            <Gauge className="w-3 h-3 text-amber-400" />
            <span>{matchPercentage}% MATCH</span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavClick}
            className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
              localFav
                ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                : 'bg-black/50 text-white/70 hover:text-white hover:bg-black/70 border border-white/10'
            }`}
            title={localFav ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Heart className="w-3.5 h-3.5" fill={localFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Floating Quick Action Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080312] via-[#080312]/85 to-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 p-3 sm:p-3.5 flex flex-col justify-end gap-2.5 z-10">
          <p className="text-[11px] sm:text-xs text-gray-200 line-clamp-2 sm:line-clamp-3 leading-relaxed font-normal">
            {movie.overview || 'No synopsis available for this selection.'}
          </p>

          <div className="flex items-center gap-1.5 pt-0.5 w-full overflow-hidden">
            <Link
              href={`/${mediaType}/${movie.id}`} prefetch={false}
              className="flex-1 min-w-0 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-white text-[11px] sm:text-xs font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-95 truncate"
              style={{
                background: accentGlow ? accentGlow.primary : 'var(--primary-hover)',
              }}
            >
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Details</span>
            </Link>

            <button
              onClick={handleWatchlistClick}
              className={`w-8 h-8 rounded-xl border backdrop-blur-md shrink-0 flex items-center justify-center transition-all ${
                localWatchlist
                  ? 'bg-white/25 border-white/40 text-white'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              }`}
              title={localWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            >
              {localWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>

            <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
              <AddToCollectionButton movie={movie} showRankButton={false} compact />
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD CONTENT ── */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">
              #{index + 1} Selection
            </span>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-black">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{movie.vote_average?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-white group-hover:text-white/90 transition-colors line-clamp-1 leading-snug">
            {title}
          </h3>

          <p className="text-xs text-white/45 mt-0.5 font-medium">
            {releaseYear} {mediaType === 'tv' ? '• Series' : ''}
          </p>
        </div>

        {/* AI Vibe Note */}
        {movie.reason && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-[11px] text-white/70 italic line-clamp-2 leading-relaxed">
              &quot;{movie.reason}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

