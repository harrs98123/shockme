'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Heart, Plus, Check, Star, Calendar, Info, Play, X } from 'lucide-react';
import { Media, InterestInfo } from '@/lib/types';
import { posterUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UpcomingMovieCardProps {
  movie: Media;
  isFav?: boolean;
  isWatchlisted?: boolean;
  onFavToggle?: (movie: Media) => void;
  onWatchlistToggle?: (movie: Media) => void;
}

export default function UpcomingMovieCard({
  movie,
  isFav = false,
  isWatchlisted = false,
  onFavToggle,
  onWatchlistToggle,
}: UpcomingMovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const title = movie.title || movie.name || 'Untitled';
  const releaseDate = movie.release_date || movie.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'TBA';

  // Format long date for display
  const formattedDate = releaseDate
    ? new Date(releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Coming Soon';

  // Fetch interest status
  useEffect(() => {
    const fetchInterest = async () => {
      const user = localStorage.getItem('cinematch_user');
      const userId = user ? JSON.parse(user).id : null;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      try {
        const res = await fetch(`${API_BASE}/interests/${movie.id}${userId ? `?user_id=${userId}` : ''}`);
        if (res.ok) {
          const data: InterestInfo = await res.json();
          setIsInterested(data.user_interested);
          setInterestCount(data.count);
        }
      } catch (err) {
        console.error('Failed to fetch interest info:', err);
      }
    };
    fetchInterest();
  }, [movie.id]);

  const handleInterestToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('cinematch_token');
    if (!token) {
      alert("Please log in to express interest.");
      return;
    }

    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/interests/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          movie_id: movie.id,
          media_type: 'movie',
          title: title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          release_date: releaseDate
        })
      });
      if (res.ok) {
        const data: InterestInfo = await res.json();
        setIsInterested(data.user_interested);
        setInterestCount(data.count);
      }
    } catch (err) {
      console.error('Failed to toggle interest:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrailer = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (trailerKey) {
      setShowTrailer(true);
      return;
    }

    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/movies/${movie.id}?media_type=movie`);
      if (res.ok) {
        const data = await res.json();
        const trailer = data.videos?.results?.find(
          (v: any) => v.type === 'Trailer' && v.site === 'YouTube' && (v.name.toLowerCase().includes('official') || v.name.toLowerCase().includes('main'))
        ) || data.videos?.results?.find(
          (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
        ) || data.videos?.results?.find(
          (v: any) => (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip') && v.site === 'YouTube'
        );
        if (trailer) {
          setTrailerKey(trailer.key);
          setShowTrailer(true);
        } else {
          alert("No trailer available for this movie.");
        }
      }
    } catch (err) {
      console.error('Failed to fetch trailer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="group flex flex-col gap-3 w-full cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="relative w-full">
          <Link href={`/${movie.title ? 'movie' : 'tv'}/${movie.id}`} className="block w-full">
            {/* Poster Image Container */}
            <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-xl group-hover:shadow-2xl transition-all duration-500">
              <Image
                src={posterUrl(movie.poster_path)}
                alt={title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority={false}
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button
                  onClick={fetchTrailer}
                  className="bg-white text-black p-4 rounded-full transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-2xl hover:bg-primary hover:text-white"
                >
                  <Play size={24} fill="currentColor" />
                </button>
              </div>

              {/* Top Badges */}
              <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                <button
                  onClick={handleInterestToggle}
                  disabled={loading}
                  className={cn(
                    "p-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl shadow-xl",
                    isInterested
                      ? "bg-primary text-black border-primary/50 scale-110"
                      : "bg-black/60 text-white/80 border-white/10 hover:bg-white/20 hover:text-white"
                  )}
                >
                  <Bell size={16} fill={isInterested ? "currentColor" : "none"} className={cn(loading && "animate-pulse")} />
                </button>
              </div>
            </div>
          </Link>
        </div>

        {/* Content Below Poster */}
        <div className="mt-1 px-1 space-y-1">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[0.95rem] font-bold text-white leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            {movie.vote_average > 0 && (
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs shrink-0 pt-0.5">
                <Star size={12} fill="currentColor" />
                {movie.vote_average.toFixed(1)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-zinc-500 text-[12px] font-medium">
             <span>{releaseYear}</span>
             <span>•</span>
             <span className="flex items-center gap-1 text-primary/80">
                <Calendar size={12} />
                {formattedDate}
             </span>
          </div>

          {interestCount > 0 && (
            <div className="text-[10px] text-primary/60 font-semibold pt-0.5">
              {interestCount} {interestCount === 1 ? 'interested' : 'interested'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Trailer Modal Overlay */}
      {showTrailer && trailerKey && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8"
          onClick={() => setShowTrailer(false)}
        >
          <div 
            className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 z-[110] bg-black/60 hover:bg-white text-white hover:text-black p-2 rounded-full transition-all shadow-lg border border-white/10"
              onClick={() => setShowTrailer(false)}
            >
              <X size={24} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
}
