'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Heart, Star, Zap, Plus, Check, Info, Flame } from 'lucide-react';
import { Media } from '@/lib/types';
import { backdropUrl, posterUrl } from '@/lib/api';
import AddToCollectionButton from './AddToCollectionButton';

interface MoodFeaturedCardProps {
  movie: Media;
  isFav?: boolean;
  onFavToggle?: (media: Media) => void;
  isWatchlisted?: boolean;
  onWatchlistToggle?: (media: Media) => void;
}

export default function MoodFeaturedCard({
  movie,
  isFav = false,
  onFavToggle,
  isWatchlisted = false,
  onWatchlistToggle,
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
    if (!token) { alert('Please log in to save favorites.'); return; }
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      if (localFav) {
        const res = await fetch(`${API_BASE}/favorites/${movie.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { setLocalFav(false); onFavToggle?.(movie); }
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
        if (res.ok || res.status === 400) { setLocalFav(true); onFavToggle?.(movie); }
      }
    } catch (err) {
      console.error('Failed to update favorite:', err);
    }
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('cinematch_token');
    if (!token) { alert('Please log in to update your watchlist.'); return; }
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      if (localWatchlist) {
        const res = await fetch(`${API_BASE}/watchlist/${movie.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { setLocalWatchlist(false); onWatchlistToggle?.(movie); }
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
        if (res.ok || res.status === 400) { setLocalWatchlist(true); onWatchlistToggle?.(movie); }
      }
    } catch (err) {
      console.error('Failed to update watchlist:', err);
    }
  };

  const bgImage = backdropUrl(movie.backdrop_path) || posterUrl(movie.poster_path);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-[#0b0318] shadow-[0_20px_50px_rgba(168,85,247,0.25)] transition-all duration-500 hover:border-purple-400/50">
      {/* ── BACKGROUND ART ── */}
      <div className="absolute inset-0 z-0">
        {bgImage && (
          <Image
            src={bgImage}
            alt={title}
            fill
            className="object-cover object-top opacity-35 filter blur-[2px] scale-105"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0318] via-[#0b0318]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0318] via-transparent to-[#0b0318]/60" />
      </div>

      {/* ── CONTENT CONTAINER ── */}
      <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
        {/* Poster */}
        <div className="relative w-44 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20 flex-shrink-0 group">
          <Image
            src={posterUrl(movie.poster_path)}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-lg text-[10px] font-black uppercase text-white tracking-wider">
            <Flame className="w-3.5 h-3.5 fill-white" />
            Top Match
          </div>
        </div>

        {/* Info & Details */}
        <div className="flex-1 space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-wide">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            99% VIBE RESONANCE MATCH
          </div>

          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {title}
          </h2>

          <div className="flex items-center gap-4 text-xs font-bold text-gray-300">
            <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{movie.vote_average?.toFixed(1) || 'N/A'}</span>
            </div>
            <span>{releaseYear}</span>
            {mediaType === 'tv' && <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">Series</span>}
          </div>

          <p className="text-sm md:text-base text-gray-300/90 leading-relaxed max-w-2xl font-normal">
            {movie.overview || 'No synopsis available.'}
          </p>

          {movie.reason && (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/20 backdrop-blur-md">
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-400 block mb-1">
                AI Match Reasoning
              </span>
              <p className="text-xs text-purple-200/90 italic font-medium">
                &quot;{movie.reason}&quot;
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/${mediaType}/${movie.id}`}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
            >
              <Info className="w-4 h-4" />
              Explore Movie
            </Link>

            <button
              onClick={handleFavClick}
              className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                localFav
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" fill={localFav ? 'currentColor' : 'none'} />
              {localFav ? 'Favorited' : 'Favorite'}
            </button>

            <button
              onClick={handleWatchlistClick}
              className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                localWatchlist
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {localWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {localWatchlist ? 'Watchlisted' : 'Watchlist'}
            </button>

            <AddToCollectionButton movie={movie} showRankButton={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
