'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Film, Globe, ChevronLeft, ChevronRight, Sparkles, Clock, Loader2 } from 'lucide-react';
import UpcomingMovieCard from '@/components/UpcomingMovieCard';
import { Movie } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Region tabs configuration
const REGIONS = [
  { id: 'all', label: 'All', icon: '🌍', color: '#8B5CF6', description: 'Worldwide upcoming releases' },
  { id: 'hollywood', label: 'Hollywood', icon: '🇺🇸', color: '#3B82F6', description: 'American cinema' },
  { id: 'bollywood', label: 'Bollywood', icon: '🇮🇳', color: '#F59E0B', description: 'Hindi cinema' },
  { id: 'tollywood', label: 'Tollywood', icon: '🎬', color: '#10B981', description: 'Telugu cinema' },
  { id: 'korean', label: 'Korean', icon: '🇰🇷', color: '#EC4899', description: 'Korean cinema' },
  { id: 'other', label: 'Others', icon: '🎭', color: '#6366F1', description: 'Global cinema' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function UpcomingPage() {
  const { user } = useAuth();
  const [activeRegion, setActiveRegion] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = all months
  const [selectedYear, setSelectedYear] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // User lists
  const [favIds, setFavIds] = useState<number[]>([]);
  const [watchIds, setWatchIds] = useState<number[]>([]);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);

  const monthScrollRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  // Current date info for generating month options
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Generate next 12 months for the filter
  const monthOptions = Array.from({ length: 13 }, (_, i) => {
    if (i === 0) return { month: 0, year: 0, label: 'All Months', short: 'All' };
    const m = ((currentMonth - 1 + i - 1) % 12) + 1;
    const y = currentYear + Math.floor((currentMonth - 1 + i - 1) / 12);
    return {
      month: m,
      year: y,
      label: `${MONTHS[m - 1]} ${y}`,
      short: MONTHS[m - 1].slice(0, 3),
    };
  });

  // Fetch user lists
  useEffect(() => {
    if (user) {
      api.get('/favorites/ids').then(r => setFavIds(r.data)).catch(() => { });
      api.get('/watchlist/ids').then(r => setWatchIds(r.data)).catch(() => { });
      api.get('/watched/ids').then(r => setWatchedIds(r.data)).catch(() => { });
    }
  }, [user]);

  const fetchUpcoming = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        region: activeRegion,
        page: pageNum.toString(),
      });
      if (selectedMonth > 0) params.set('month', selectedMonth.toString());
      if (selectedYear > 0) params.set('year', selectedYear.toString());

      const res = await fetch(`${API_BASE}/movies/upcoming?${params.toString()}`);
      const data = await res.json();
      const newMovies = data.results || [];

      if (reset || pageNum === 1) {
        setMovies(newMovies);
      } else {
        setMovies(prev => [...prev, ...newMovies]);
      }
      setHasMore(newMovies.length > 0 && pageNum < (data.total_pages || 1));
      setTotalResults(data.total_results || 0);
      setDateRange(data.date_range || { from: '', to: '' });
    } catch (err) {
      console.error('Failed to fetch upcoming movies:', err);
    } finally {
      setLoading(false);
    }
  }, [activeRegion, selectedMonth, selectedYear]);

  // Refetch on filter change
  useEffect(() => {
    setPage(1);
    fetchUpcoming(1, true);
  }, [fetchUpcoming]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchUpcoming(next);
  };

  const handleToggle = (movieId: number, listType: 'fav' | 'watchlist' | 'watched') => {
    switch (listType) {
      case 'fav':
        setFavIds(prev => prev.includes(movieId) ? prev.filter(id => id !== movieId) : [...prev, movieId]);
        break;
      case 'watchlist':
        setWatchIds(prev => prev.includes(movieId) ? prev.filter(id => id !== movieId) : [...prev, movieId]);
        break;
      case 'watched':
        setWatchedIds(prev => prev.includes(movieId) ? prev.filter(id => id !== movieId) : [...prev, movieId]);
        break;
    }
  };

  const scrollMonths = (direction: 'left' | 'right') => {
    if (monthScrollRef.current) {
      const amount = 200;
      monthScrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  const activeRegionData = REGIONS.find(r => r.id === activeRegion) || REGIONS[0];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ─── Hero Header ────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '100px 0 40px',
        background: `
          radial-gradient(ellipse 80% 50% at 50% -20%, ${activeRegionData.color}22, transparent),
          linear-gradient(180deg, rgba(15,15,15,0) 0%, #0F0F0F 100%)
        `,
      }}>
        {/* Animated background particles */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 50%, ${activeRegionData.color}08 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, ${activeRegionData.color}06 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Title area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                padding: '8px 12px',
                borderRadius: 12,
                background: `${activeRegionData.color}20`,
                border: `1px solid ${activeRegionData.color}40`,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <Clock size={16} style={{ color: activeRegionData.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: activeRegionData.color, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Coming Soon
                </span>
              </div>
              {totalResults > 0 && !loading && (
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                  {totalResults} {totalResults === 1 ? 'movie' : 'movies'} found
                </span>
              )}
            </div>

            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 800,
              margin: '0 0 8px',
              backgroundImage: `linear-gradient(135deg, #fff 0%, ${activeRegionData.color} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              {activeRegion === 'all' ? 'Upcoming Movies' : `${activeRegionData.label} Movies`}
            </h1>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: 16,
              maxWidth: 500,
              lineHeight: 1.6,
              margin: 0,
            }}>
              Discover the most anticipated releases from {activeRegionData.description}
            </p>
          </motion.div>

          {/* ─── Region Tabs ──────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 32,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none',
          }}>
            {REGIONS.map((region) => {
              const isActive = activeRegion === region.id;
              return (
                <motion.button
                  key={region.id}
                  onClick={() => setActiveRegion(region.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 14,
                    border: isActive
                      ? `1.5px solid ${region.color}80`
                      : '1.5px solid rgba(255,255,255,0.06)',
                    background: isActive
                      ? `${region.color}18`
                      : 'rgba(255,255,255,0.03)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'var(--font-heading, Poppins, sans-serif)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 4px 20px ${region.color}20` : 'none',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{region.icon}</span>
                  <span>{region.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="region-glow"
                      style={{
                        position: 'absolute',
                        inset: -1,
                        borderRadius: 14,
                        border: `1.5px solid ${region.color}50`,
                        pointerEvents: 'none',
                      }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* ─── Month Filter ─────────────────────────────────────── */}
          <div style={{ marginTop: 24, position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}>
              <Calendar size={16} style={{ color: 'var(--text-dim)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Filter by Month
              </span>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Scroll left button */}
              <button
                onClick={() => scrollMonths('left')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Month pills */}
              <div
                ref={monthScrollRef}
                style={{
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  flex: 1,
                  padding: '4px 0',
                }}
              >
                {monthOptions.map((opt, i) => {
                  const isActive = selectedMonth === opt.month && (opt.month === 0 || selectedYear === opt.year);
                  return (
                    <motion.button
                      key={`${opt.month}-${opt.year}`}
                      onClick={() => {
                        setSelectedMonth(opt.month);
                        setSelectedYear(opt.year);
                      }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: isActive
                          ? `1px solid ${activeRegionData.color}60`
                          : '1px solid rgba(255,255,255,0.06)',
                        background: isActive
                          ? `${activeRegionData.color}20`
                          : 'rgba(255,255,255,0.03)',
                        color: isActive ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {opt.month === 0 ? opt.label : (
                        <span>
                          {opt.short}{' '}
                          <span style={{ opacity: 0.5, fontSize: 11 }}>'{String(opt.year).slice(2)}</span>
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Scroll right button */}
              <button
                onClick={() => scrollMonths('right')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Active filter info */}
          {(selectedMonth > 0 || activeRegion !== 'all') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Active filters:</span>
              {activeRegion !== 'all' && (
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 8,
                  background: `${activeRegionData.color}15`,
                  border: `1px solid ${activeRegionData.color}30`,
                  fontSize: 12,
                  fontWeight: 600,
                  color: activeRegionData.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {activeRegionData.icon} {activeRegionData.label}
                </span>
              )}
              {selectedMonth > 0 && (
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Calendar size={12} />
                  {monthOptions.find(m => m.month === selectedMonth && m.year === selectedYear)?.label}
                </span>
              )}
              <button
                onClick={() => { setActiveRegion('all'); setSelectedMonth(0); setSelectedYear(0); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#ef4444',
                  cursor: 'pointer',
                }}
              >
                Clear All
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── Movies Grid ──────────────────────────────────────────── */}
      <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
        <AnimatePresence mode="wait">
          {loading && movies.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
                gap: '32px 16px',
              }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 16 }} />
                  <div className="skeleton" style={{ width: '70%', height: 14, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 6 }} />
                </div>
              ))}
            </motion.div>
          ) : movies.length > 0 ? (
            <motion.div
              key={`${activeRegion}-${selectedMonth}-${selectedYear}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {/* Date range info */}
              {dateRange.from && (
                <div style={{
                  marginBottom: 24,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--text-dim)',
                }}>
                  <Sparkles size={14} style={{ color: activeRegionData.color }} />
                  Showing releases from{' '}
                  <strong style={{ color: 'var(--text-muted)' }}>
                    {new Date(dateRange.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </strong>
                  {' to '}
                  <strong style={{ color: 'var(--text-muted)' }}>
                    {new Date(dateRange.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </strong>
                </div>
              )}

              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
                  gap: '32px 16px',
                }}
              >
                {movies.map((movie, index) => (
                  <motion.div
                    key={`${movie.id}-${index}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.3 }}
                  >
                    <UpcomingMovieCard
                      movie={movie}
                      isFav={favIds.includes(movie.id)}
                      isWatchlisted={watchIds.includes(movie.id)}
                      onFavToggle={(m) => handleToggle(m.id, 'fav')}
                      onWatchlistToggle={(m) => handleToggle(m.id, 'watchlist')}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Load more */}
              {hasMore && !loading && (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <motion.button
                    onClick={handleLoadMore}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary"
                    style={{
                      padding: '14px 36px',
                      fontSize: 15,
                      borderRadius: 14,
                      background: `linear-gradient(135deg, ${activeRegionData.color}, ${activeRegionData.color}99)`,
                      border: 'none',
                      boxShadow: `0 4px 24px ${activeRegionData.color}30`,
                    }}
                  >
                    Load More Movies
                  </motion.button>
                </div>
              )}

              {loading && movies.length > 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div className="spinner" style={{ margin: '0 auto', width: 28, height: 28, borderWidth: 2.5 }} />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center',
                padding: '100px 20px',
              }}
            >
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: `${activeRegionData.color}10`,
                border: `1px solid ${activeRegionData.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 36,
              }}>
                🎬
              </div>
              <h3 style={{ color: '#fff', fontSize: 20, marginBottom: 8 }}>No upcoming movies found</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                Try adjusting your filters or selecting a different region and month to discover more releases.
              </p>
              <button
                onClick={() => { setActiveRegion('all'); setSelectedMonth(0); setSelectedYear(0); }}
                style={{
                  marginTop: 20,
                  padding: '10px 24px',
                  borderRadius: 12,
                  background: `${activeRegionData.color}20`,
                  border: `1px solid ${activeRegionData.color}40`,
                  color: activeRegionData.color,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Reset Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
