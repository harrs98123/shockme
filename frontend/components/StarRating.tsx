'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Props {
  movieId: number;
  media_type?: 'movie' | 'tv';
}

export default function StarRating({ movieId, media_type = 'movie' }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRating();
  }, [movieId, user, media_type]);

  const fetchRating = async () => {
    try {
      const res = await api.get(`/ratings/${movieId}?media_type=${media_type}`);
      setAvgRating(res.data.average);
      setCount(res.data.count);
      if (res.data.user_rating) setRating(res.data.user_rating);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (value: number) => {
    if (!user) { window.location.href = '/login'; return; }
    setRating(value);
    try {
      const res = await api.post('/ratings', { 
        movie_id: movieId, 
        media_type: media_type,
        rating: value 
      });
      setAvgRating(res.data.average);
      setCount(res.data.count);
    } catch (e) {
      console.error(e);
      setRating(rating); // revert on error
    }
  };


  const getRatingLabel = (val: number | null) => {
    if (!val) return 'RATE THIS MOVIE';
    if (val >= 5.0) return 'MASTERPIECE';
    if (val >= 4.5) return 'EXCELLENT';
    if (val >= 4.0) return 'VERY GOOD';
    if (val >= 3.5) return 'GOOD';
    if (val >= 3.0) return 'ABOVE AVERAGE';
    if (val >= 2.5) return 'AVERAGE';
    if (val >= 2.0) return 'BELOW AVERAGE';
    if (val >= 1.5) return 'REALLY POOR';
    if (val >= 1.0) return 'TERRIBLE';
    return '';
  };

  const handleRatingClick = (val: number) => {
    // If val is less than 1.0, cap it at 1.0 (mandatory minimum)
    const finalVal = Math.max(1.0, val);
    submitRating(finalVal);
  };

  if (loading) return <div className="skeleton" style={{ width: 160, height: 80, borderRadius: 16, margin: '0 auto 24px' }} />;

  const displayRating = hoverRating || rating || 0;

  return (
    <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {/* Label */}
      <div style={{ 
        fontSize: 10, 
        fontWeight: 900, 
        color: displayRating > 0 ? '#00E676' : 'rgba(255,255,255,0.15)', 
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        height: 16,
        transition: 'all 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
      }}>
        {getRatingLabel(displayRating)}
      </div>

      {/* Stars Container */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((starIdx) => {
          return (
            <div 
              key={starIdx}
              style={{ 
                position: 'relative', 
                width: 34, 
                height: 34, 
                cursor: 'pointer',
                transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: (hoverRating && hoverRating >= starIdx - 0.5) ? 'scale(1.15)' : 'scale(1)'
              }}
              onMouseLeave={() => setHoverRating(null)}
            >
              {/* Background Gray Star */}
              <svg viewBox="0 0 24 24" fill="#2D2D2D" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>

              {/* Foreground Green Star (Clipped) */}
              <div 
                style={{ 
                  position: 'absolute', 
                  left: 0, 
                  top: 0, 
                  height: '100%', 
                  overflow: 'hidden',
                  width: displayRating >= starIdx ? '100%' : (displayRating >= starIdx - 0.5 ? '50%' : '0%'),
                  transition: 'width 0.15s ease-out'
                }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="#00E676" 
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ 
                    width: 34, 
                    height: 34, 
                    filter: displayRating >= starIdx - 0.5 ? 'drop-shadow(0 0 10px rgba(0, 230, 118, 0.45))' : 'none',
                    display: 'block'
                  }}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              {/* Half Star Left Interactive Zone */}
              <div 
                style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 2 }} 
                onMouseEnter={() => setHoverRating(starIdx - 0.5)}
                onClick={() => handleRatingClick(starIdx - 0.5)}
              />
              {/* Half Star Right Interactive Zone */}
              <div 
                style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 2 }} 
                onMouseEnter={() => setHoverRating(starIdx)}
                onClick={() => handleRatingClick(starIdx)}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {(count > 0 || rating) && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 800, letterSpacing: '0.8px' }}>
            {rating ? (
              <span>PERSONAL RATING: <span style={{ color: '#fff' }}>{rating.toFixed(1)}</span></span>
            ) : (
              <span>COMMUNITY AVG: <span style={{ color: '#fff' }}>{avgRating.toFixed(1)}</span> <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span> {count} RATINGS</span>
            )}
          </div>
        )}
        
        {/* Sleek separator */}
        <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, transparent, rgba(0, 230, 118, 0.3), transparent)', borderRadius: 99 }} />
      </div>
    </div>
  );
}
