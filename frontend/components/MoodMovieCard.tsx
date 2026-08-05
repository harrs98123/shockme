'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Heart, Star, Gauge, Plus, Check, Info } from 'lucide-react';
import { Media } from '@/lib/types';
import { posterUrl } from '@/lib/api';
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
}

export default function MoodMovieCard({
  movie,
  index,
  isFav = false,
  onFavToggle,
  isWatchlisted = false,
  onWatchlistToggle,
  moodQuery = '',
}: MoodMovieCardProps) {
  const [localFav, setLocalFav] = useState(isFav);
  const [localWatchlist, setLocalWatchlist] = useState(isWatchlisted);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => { setLocalFav(isFav); }, [isFav]);
  useEffect(() => { setLocalWatchlist(isWatchlisted); }, [isWatchlisted]);

  const title = movie.title || movie.name || 'Untitled';
  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
  const dateStr = movie.release_date || movie.first_air_date;
  const releaseYear = dateStr ? new Date(dateStr).getFullYear() : 'N/A';

  // Calculate dynamic vibe match percentage based on index and rating
  const matchPercentage = Math.max(82, Math.min(99, Math.round(98 - index * 1.5 + (movie.vote_average || 7) * 0.2)));

  const handleFavClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('cinematch_token');
    if (!token) {
      alert('Please log in to save favorites.');
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
        }
      }
    } catch (err) {
      console.error('Failed to update favorite:', err);
    }
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('cinematch_token');
    if (!token) {
      alert('Please log in to update your watchlist.');
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
        }
      }
    } catch (err) {
      console.error('Failed to update watchlist:', err);
    }
  };

  return (
    <div
      className="group relative flex flex-col h-full rounded-2xl bg-gradient-to-b from-[#140b24]/80 via-[#0c0517]/90 to-[#07020f]/95 border border-purple-500/15 hover:border-purple-400/40 transition-all duration-500 hover:shadow-[0_12px_35px_-10px_rgba(168,85,247,0.3)] hover:-translate-y-1.5 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── CARD MEDIA CONTAINER ── */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-2xl bg-[#090312]">
        <Image
          src={posterUrl(movie.poster_path)}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0517] via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 gap-2">
          {/* Vibe Match Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-purple-500/30 text-purple-300 text-[10px] font-extrabold tracking-wide">
            <Gauge className="w-3 h-3 text-purple-400" />
            <span>{matchPercentage}% MATCH</span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
              localFav
                ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                : 'bg-black/50 text-white/70 hover:text-white hover:bg-black/70 border border-white/10'
            }`}
            title={localFav ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Heart className="w-4 h-4" fill={localFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Floating Quick Action Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0314] via-[#0a0314]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end gap-3 z-10">
          <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed font-normal">
            {movie.overview || 'No synopsis available for this selection.'}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href={`/${mediaType}/${movie.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-lg shadow-purple-600/30"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Details</span>
            </Link>

            <button
              onClick={handleWatchlistClick}
              className={`p-2 rounded-xl border backdrop-blur-md transition-all ${
                localWatchlist
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              }`}
              title={localWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            >
              {localWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>

            <div onClick={(e) => e.stopPropagation()}>
              <AddToCollectionButton movie={movie} showRankButton={false} />
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD CONTENT ── */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-gradient-to-b from-transparent to-black/40">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80">
              #{index + 1} Selection
            </span>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-black">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{movie.vote_average?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1 leading-snug">
            {title}
          </h3>

          <p className="text-xs text-gray-400 mt-0.5">
            {releaseYear} {mediaType === 'tv' ? '• Series' : ''}
          </p>
        </div>

        {/* AI Vibe Note */}
        {movie.reason && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-[11px] text-purple-200/70 italic line-clamp-2 leading-relaxed">
              &quot;{movie.reason}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
