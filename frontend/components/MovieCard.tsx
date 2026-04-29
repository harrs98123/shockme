'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Heart, Tv, Bell, Star } from 'lucide-react';
import { Media, InterestInfo } from '@/lib/types';

import { posterUrl } from '@/lib/api';
import AddToCollectionButton from './AddToCollectionButton';

interface Props {
  movie: Media;
  isWatchlisted?: boolean;
  onWatchlistToggle?: (media: Media) => void;
  isFav?: boolean;
  onFavToggle?: (media: Media) => void;
  isWatched?: boolean;
  onWatchedToggle?: (media: Media) => void;
  showFavButton?: boolean;
}

export default function MovieCard({
  movie,
  isWatchlisted = false,
  onWatchlistToggle,
  isFav = false,
  onFavToggle,
  isWatched = false,
  onWatchedToggle,
  showFavButton = true,
}: Props) {
  const pathname = usePathname();
  const isGridView = pathname !== '/';

  const [isHovered, setIsHovered] = useState(false);
  const [localWatchlisted, setLocalWatchlisted] = useState(isWatchlisted);
  const [localFavorited, setLocalFavorited] = useState(isFav);
  const [localWatched, setLocalWatched] = useState(isWatched);
  const [isInterested, setIsInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(0);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (isGridView) {
      setIsHovered(true);
      return;
    }
    // Delay hover expansion on desktop to prevent lag while scrolling
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  const title = movie.title || movie.name || 'Untitled';
  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
  const dateStr = movie.release_date || movie.first_air_date;
  const releaseYear = dateStr ? new Date(dateStr).getFullYear() : 'N/A';
  const isUpcoming = dateStr ? new Date(dateStr) > new Date() : false;

  useEffect(() => { setLocalWatchlisted(isWatchlisted); }, [isWatchlisted]);
  useEffect(() => { setLocalFavorited(isFav); }, [isFav]);
  useEffect(() => { setLocalWatched(isWatched); }, [isWatched]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isUpcoming) {
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
    }
  }, [movie.id, isUpcoming]);

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('cinematch_token');
    if (!token) { alert("Please log in to add to your watchlist."); return; }
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      if (localWatchlisted) {
        const res = await fetch(`${API_BASE}/watchlist/${movie.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { setLocalWatchlisted(false); onWatchlistToggle?.(movie); }
      } else {
        const res = await fetch(`${API_BASE}/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ movie_id: movie.id, media_type: mediaType, title, poster_path: movie.poster_path })
        });
        if (res.ok || res.status === 400) { setLocalWatchlisted(true); onWatchlistToggle?.(movie); }
      }
    } catch (err) { console.error('Failed to update watchlist:', err); }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('cinematch_token');
    if (!token) { alert("Please log in to favorite this movie."); return; }
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      if (localFavorited) {
        const res = await fetch(`${API_BASE}/favorites/${movie.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { setLocalFavorited(false); onFavToggle?.(movie); }
      } else {
        const res = await fetch(`${API_BASE}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ movie_id: movie.id, media_type: mediaType, title, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path, release_year: releaseYear.toString(), vote_average: movie.vote_average })
        });
        if (res.ok || res.status === 400) { setLocalFavorited(true); onFavToggle?.(movie); }
      }
    } catch (err) { console.error('Failed to update favorites:', err); }
  };

  const handleInterestToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('cinematch_token');
    if (!token) { alert("Please log in to express interest."); return; }
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/interests/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ movie_id: movie.id, media_type: mediaType, title, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path, release_date: dateStr })
      });
      if (res.ok) {
        const data: InterestInfo = await res.json();
        setIsInterested(data.user_interested);
        setInterestCount(data.count);
      }
    } catch (err) { console.error('Failed to toggle interest:', err); }
  };

  const activeButton = isUpcoming ? isInterested : localFavorited;

  return (
    <div
      className={isGridView ? "mc-grid-card" : `mc-root${isHovered ? ' hovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/${mediaType}/${movie.id}`} className="mc-link">
        <div className="mc-poster">
          <Image
            src={posterUrl(movie.poster_path)}
            alt={title}
            fill
            sizes={isGridView ? "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw" : "(max-width: 640px) 150px, (max-width: 1024px) 180px, 210px"}
            style={{ objectFit: 'cover' }}
            loading="lazy"
          />

          {!isGridView && (
            mediaType === 'tv' && (
              <div className="mc-tv-badge">
                <Tv size={12} /> SERIES
              </div>
            )
          )}

          {showFavButton && (
            <button
              onClick={isUpcoming ? handleInterestToggle : handleFavoriteToggle}
              className={`mc-fav-btn${isUpcoming ? ' upcoming' : ''}`}
              style={{
                backgroundColor: activeButton
                  ? (isUpcoming ? 'var(--primary)' : '#ef4444')
                  : 'rgba(0,0,0,0.4)',
                border: activeButton ? 'none' : '1px solid rgba(255,255,255,0.2)',
                color: activeButton ? (isUpcoming ? '#000' : '#fff') : '#fff',
                transform: isGridView && isHovered ? 'scale(1.1)' : 'scale(1)',
              }}
              aria-label={isUpcoming ? 'Toggle interest' : 'Toggle favourite'}
            >
              {isUpcoming ? (
                <>
                  <Bell size={14} fill={isInterested ? 'currentColor' : 'none'} />
                  {isInterested ? 'INTERESTED' : 'INTEREST'}
                </>
              ) : (
                <Heart size={18} fill={localFavorited ? '#fff' : 'none'} strokeWidth={localFavorited ? 0 : 2} />
              )}
            </button>
          )}

          {!isGridView && (
            <div className="mc-mobile-overlay">
              <span className="mc-mobile-title">{title}</span>
              <span className="mc-mobile-rating">
                {movie.vote_average?.toFixed(1) || 'N/A'}
              </span>
            </div>
          )}
        </div>

        {isGridView && (
          <div className="mc-grid-info">
            <h3 className="mc-grid-title">{title}</h3>
            <div className="mc-grid-meta">
              <span className="mc-grid-rating">
                <Star size={12} fill="currentColor" />
                {movie.vote_average?.toFixed(1) || 'N/A'}
              </span>
              <span>•</span>
              <span>{releaseYear}</span>
              {mediaType === 'tv' && (
                <>
                  <span>•</span>
                  <span style={{ color: 'var(--primary)', fontSize: '0.7rem' }}>SERIES</span>
                </>
              )}
            </div>
          </div>
        )}

        {!isGridView && (
          <div className="mc-detail-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
              <h3 className="mc-detail-title">{title}</h3>
              <div className="mc-detail-rating">
                {movie.vote_average?.toFixed(1) || 'N/A'}
              </div>
            </div>
            <div className="mc-detail-year">{releaseYear}</div>
            <p className="mc-detail-overview">{movie.overview}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <AddToCollectionButton movie={movie} showRankButton={true} />
              <div style={{ flexGrow: 1 }} />
              <button
                onClick={handleWatchlistToggle}
                className="mc-watchlist-btn"
                style={{
                  backgroundColor: localWatchlisted ? '#27272a' : '#ffffff',
                  color: localWatchlisted ? '#ffffff' : '#000000',
                }}
                aria-label="Add to Watchlist"
              >
                {localWatchlisted
                  ? <span style={{ fontSize: 18 }}>✓</span>
                  : <span style={{ fontSize: 24 }}>+</span>
                }
              </button>
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}