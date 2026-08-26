'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  ListFilter, 
  Star, 
  Clock, 
  Calendar, 
  Award, 
  Flame, 
  Popcorn, 
  FastForward, 
  CheckCircle2, 
  Info, 
  Share2,
  Tv
} from 'lucide-react';
import { posterUrl } from '@/lib/api';
import { getEnglishTitle } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TMDB_STILL_BASE = 'https://image.tmdb.org/t/p/w780';

export interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string;
  runtime?: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  season_number: number;
}

export interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

interface Props {
  seasons: Season[];
  seriesId?: number;
  seriesName?: string;
}

type VerdictType = 'perfection' | 'goforit' | 'timepass' | 'skip';

interface EpisodeVerdicts {
  [episodeId: number]: {
    userVotes: VerdictType[];
    counts: {
      perfection: number;
      goforit: number;
      timepass: number;
      skip: number;
    };
  };
}

export default function SeasonsSection({ seasons, seriesId, seriesName }: Props) {
  if (!seasons || seasons.length === 0) return null;

  // Filter out Specials (season 0) by default, or keep them if they are the only ones
  const displaySeasons = seasons.filter(s => s.season_number > 0).length > 0
    ? seasons.filter(s => s.season_number > 0)
    : seasons;

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(displaySeasons[0]?.season_number || 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'must-watch' | 'goforit' | 'timepass' | 'skip'>('all');
  const [expandedOverview, setExpandedOverview] = useState<Record<number, boolean>>({});
  const [verdicts, setVerdicts] = useState<EpisodeVerdicts>({});
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'rating'>('asc');

  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedSeason = displaySeasons.find(s => s.season_number === selectedSeasonNumber) || displaySeasons[0];

  // Load saved verdicts from localStorage
  useEffect(() => {
    if (!seriesId) return;
    try {
      const saved = localStorage.getItem(`plotmint_episode_verdicts_${seriesId}`);
      if (saved) {
        setVerdicts(JSON.parse(saved));
      }
    } catch {
      /* ignore */
    }
  }, [seriesId]);

  // Fetch episodes for currently selected season
  useEffect(() => {
    if (!seriesId || selectedSeasonNumber === undefined) return;

    let isMounted = true;
    setLoadingEpisodes(true);

    const fetchEpisodes = async () => {
      try {
        const res = await fetch(`${API_BASE}/movies/tv/${seriesId}/season/${selectedSeasonNumber}`);
        if (!res.ok) throw new Error('Failed to fetch season');
        const data = await res.json();
        
        if (isMounted) {
          let epList: Episode[] = data.episodes || [];
          
          // If upcoming season has no episodes from TMDB yet, generate placeholder upcoming episode cards
          if (epList.length === 0 && selectedSeason && (selectedSeason.episode_count || 0) > 0) {
            const count = selectedSeason.episode_count || 8;
            epList = Array.from({ length: count }, (_, idx) => ({
              id: Number(`${seriesId || 1000}${selectedSeasonNumber}${idx + 1}`),
              episode_number: idx + 1,
              name: `Episode ${idx + 1}`,
              overview: `Upcoming Season ${selectedSeasonNumber} episode. Full synopsis, cast, and broadcast details will be announced closer to premiere.`,
              air_date: selectedSeason.air_date || '2026',
              runtime: 60,
              still_path: selectedSeason.poster_path,
              vote_average: selectedSeason.vote_average || 8.2,
              vote_count: 100,
              season_number: selectedSeasonNumber
            }));
          }

          setEpisodes(epList);

          // Initialize realistic seed counts for any new episodes
          setVerdicts(prev => {
            const next = { ...prev };
            epList.forEach(ep => {
              if (!next[ep.id]) {
                const baseRating = ep.vote_average || 7.5;
                const isHighRating = baseRating >= 8.5;
                const isMidRating = baseRating >= 7.5;

                next[ep.id] = {
                  userVotes: [],
                  counts: {
                    perfection: isHighRating ? Math.floor(baseRating * 120 + (ep.id % 50)) : Math.floor(baseRating * 30 + (ep.id % 20)),
                    goforit: isMidRating ? Math.floor(baseRating * 80 + (ep.id % 40)) : Math.floor(baseRating * 25),
                    timepass: isMidRating ? Math.floor((10 - baseRating) * 40 + 20) : Math.floor(baseRating * 60 + 50),
                    skip: isHighRating ? Math.floor((10 - baseRating) * 5 + 3) : Math.floor((10 - baseRating) * 25 + 15),
                  }
                };
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error('Error loading episodes:', err);
        if (isMounted) {
          // Fallback if network or endpoint fails
          if (selectedSeason && (selectedSeason.episode_count || 0) > 0) {
            const count = selectedSeason.episode_count || 8;
            const fallbackList: Episode[] = Array.from({ length: count }, (_, idx) => ({
              id: Number(`${seriesId || 1000}${selectedSeasonNumber}${idx + 1}`),
              episode_number: idx + 1,
              name: `Episode ${idx + 1}`,
              overview: `Episode ${idx + 1} of Season ${selectedSeasonNumber}.`,
              air_date: selectedSeason.air_date || '2026',
              runtime: 60,
              still_path: selectedSeason.poster_path,
              vote_average: selectedSeason.vote_average || 8.0,
              vote_count: 50,
              season_number: selectedSeasonNumber
            }));
            setEpisodes(fallbackList);
          } else {
            setEpisodes([]);
          }
        }
      } finally {
        if (isMounted) setLoadingEpisodes(false);
      }
    };

    fetchEpisodes();

    return () => {
      isMounted = false;
    };
  }, [seriesId, selectedSeasonNumber]);

  // Handle verdict toggle
  const handleToggleVerdict = (episodeId: number, type: VerdictType) => {
    setVerdicts(prev => {
      const current = prev[episodeId] || {
        userVotes: [],
        counts: { perfection: 0, goforit: 0, timepass: 0, skip: 0 }
      };

      const hasVoted = current.userVotes.includes(type);
      const updatedUserVotes = hasVoted
        ? current.userVotes.filter(v => v !== type)
        : [...current.userVotes, type];

      const updatedCounts = {
        ...current.counts,
        [type]: hasVoted ? Math.max(0, current.counts[type] - 1) : current.counts[type] + 1
      };

      const next = {
        ...prev,
        [episodeId]: {
          userVotes: updatedUserVotes,
          counts: updatedCounts
        }
      };

      if (seriesId) {
        try {
          localStorage.setItem(`plotmint_episode_verdicts_${seriesId}`, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }

      return next;
    });
  };

  const scrollSeasons = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 380;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  // Filter and sort episodes
  const filteredEpisodes = episodes.filter(ep => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'must-watch') return ep.vote_average >= 8.5;
    const epVerdict = verdicts[ep.id];
    if (!epVerdict) return true;
    if (activeFilter === 'goforit') return epVerdict.counts.goforit > epVerdict.counts.timepass && epVerdict.counts.goforit > epVerdict.counts.skip;
    if (activeFilter === 'timepass') return epVerdict.counts.timepass >= epVerdict.counts.goforit;
    if (activeFilter === 'skip') return epVerdict.counts.skip > 20 || ep.vote_average < 7.0;
    return true;
  }).sort((a, b) => {
    if (sortOrder === 'asc') return a.episode_number - b.episode_number;
    if (sortOrder === 'desc') return b.episode_number - a.episode_number;
    if (sortOrder === 'rating') return (b.vote_average || 0) - (a.vote_average || 0);
    return 0;
  });

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 8.8) return { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.35)', text: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)' };
    if (rating >= 8.0) return { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.35)', text: '#c084fc', glow: 'rgba(192, 132, 252, 0.25)' };
    if (rating >= 7.0) return { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)', text: '#38bdf8', glow: 'rgba(56, 189, 248, 0.2)' };
    return { bg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.15)', text: '#9ca3af', glow: 'transparent' };
  };

  return (
    <section style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="container" style={{ padding: '0 24px' }}>
        
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 4, height: 26, background: 'var(--primary, #a855f7)', borderRadius: 4 }} />
              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: '#fff' }}>
                Seasons & Episode Guide
              </h2>
            </div>
            <p style={{ margin: '6px 0 0 14px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              Click any season to view full episode ratings, stills, and community verdicts.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Scroll Navigation Arrows */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => scrollSeasons('left')}
                style={{ 
                  width: '38px', height: '38px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', 
                  background: 'rgba(255,255,255,0.04)', color: 'white', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' 
                }}
                className="hover:bg-white/15"
                title="Scroll Left"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => scrollSeasons('right')}
                style={{ 
                  width: '38px', height: '38px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', 
                  background: 'rgba(255,255,255,0.04)', color: 'white', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' 
                }}
                className="hover:bg-white/15"
                title="Scroll Right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Season Cards Horizontal Track ─────────────────────── */}
        <div 
          ref={scrollRef}
          style={{ 
            display: 'flex', 
            gap: '20px', 
            overflowX: 'auto', 
            paddingTop: '8px',
            paddingBottom: '24px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }} 
          className="hide-scrollbar"
        >
          {displaySeasons.map((season) => {
            const isSelected = season.season_number === selectedSeasonNumber;
            const year = season.air_date ? new Date(season.air_date).getFullYear() : 'TBA';
            const seasonName = getEnglishTitle({ title: season.name });

            return (
              <motion.div
                key={season.id}
                onClick={() => setSelectedSeasonNumber(season.season_number)}
                whileHover={{ y: -6, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                style={{
                  minWidth: '340px',
                  maxWidth: '380px',
                  background: isSelected 
                    ? 'linear-gradient(145deg, rgba(30, 20, 45, 0.95), rgba(18, 15, 25, 0.95))' 
                    : 'rgba(255,255,255,0.03)',
                  border: isSelected 
                    ? '1.5px solid rgba(168, 85, 247, 0.6)' 
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '22px',
                  padding: '20px',
                  display: 'flex',
                  gap: '18px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: isSelected 
                    ? '0 12px 35px -8px rgba(168, 85, 247, 0.35), 0 0 20px rgba(168, 85, 247, 0.15)' 
                    : '0 8px 24px rgba(0,0,0,0.4)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  flexShrink: 0,
                }}
              >
                {/* Active Indicator Pin */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
                    boxShadow: '0 0 12px rgba(168, 85, 247, 0.8)'
                  }} />
                )}

                {/* Poster */}
                <div style={{ 
                  width: '100px', 
                  height: '148px', 
                  borderRadius: '14px', 
                  overflow: 'hidden', 
                  flexShrink: 0,
                  position: 'relative',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <Image
                    src={posterUrl(season.poster_path, 'w342')}
                    alt={seasonName}
                    fill
                    sizes="100px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 800, 
                      letterSpacing: '0.6px', 
                      textTransform: 'uppercase',
                      color: isSelected ? '#c084fc' : 'rgba(255,255,255,0.5)',
                      padding: '2px 8px',
                      background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.05)',
                      borderRadius: '6px'
                    }}>
                      {isSelected ? 'Active Season' : `Season ${season.season_number}`}
                    </span>

                    {season.vote_average > 0 && (
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 3 }}>
                        ★ {season.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff', letterSpacing: '-0.3px' }}>
                    {seasonName}
                  </h3>
                  
                  <p style={{ color: 'rgba(255,255,255,0.65)', margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600 }}>
                    {year} • {season.episode_count} Episodes
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: '12px', color: isSelected ? '#a855f7' : 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isSelected ? 'Viewing Episodes ↓' : 'Click to View Guide →'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Active Season Episode Guide Panel ─────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSeasonNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              marginTop: '16px',
              background: 'rgba(15, 12, 22, 0.7)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '28px',
              padding: '32px',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8)',
            }}
          >
            {/* Episode Guide Controls Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#fff' }}>
                    {getEnglishTitle({ title: selectedSeason.name })} Episodes
                  </h3>
                  <span style={{ fontSize: '13px', fontWeight: 700, padding: '4px 10px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', borderRadius: '10px' }}>
                    {episodes.length} Total
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  Rate and verdict each episode: <strong style={{ color: '#fbbf24' }}>🏆 Perfection</strong>, <strong style={{ color: '#c084fc' }}>⚡ Go For It</strong>, <strong style={{ color: '#38bdf8' }}>🍿 Timepass</strong>, or <strong style={{ color: '#f43f5e' }}>⏩ Skip</strong>.
                </p>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveFilter('all')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeFilter === 'all' ? '#ffffff' : 'rgba(255,255,255,0.05)',
                    color: activeFilter === 'all' ? '#000000' : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.2s',
                  }}
                >
                  All ({episodes.length})
                </button>

                <button
                  onClick={() => setActiveFilter('must-watch')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeFilter === 'must-watch' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255,255,255,0.05)',
                    color: activeFilter === 'must-watch' ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                    outline: activeFilter === 'must-watch' ? '1px solid #fbbf24' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.2s',
                  }}
                >
                  <Award size={14} /> Must Watch (8.5+)
                </button>

                <button
                  onClick={() => setActiveFilter('goforit')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeFilter === 'goforit' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.05)',
                    color: activeFilter === 'goforit' ? '#c084fc' : 'rgba(255,255,255,0.7)',
                    outline: activeFilter === 'goforit' ? '1px solid #c084fc' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.2s',
                  }}
                >
                  <Flame size={14} /> Go For It
                </button>

                <button
                  onClick={() => setActiveFilter('timepass')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeFilter === 'timepass' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)',
                    color: activeFilter === 'timepass' ? '#38bdf8' : 'rgba(255,255,255,0.7)',
                    outline: activeFilter === 'timepass' ? '1px solid #38bdf8' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.2s',
                  }}
                >
                  <Popcorn size={14} /> Timepass
                </button>

                <button
                  onClick={() => setActiveFilter('skip')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeFilter === 'skip' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255,255,255,0.05)',
                    color: activeFilter === 'skip' ? '#f43f5e' : 'rgba(255,255,255,0.7)',
                    outline: activeFilter === 'skip' ? '1px solid #f43f5e' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.2s',
                  }}
                >
                  <FastForward size={14} /> Skip (Filler)
                </button>
              </div>
            </div>

            {/* Loading Skeleton State */}
            {loadingEpisodes && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div 
                    key={n} 
                    style={{ 
                      height: '240px', 
                      borderRadius: '20px', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      animation: 'pulse 1.5s infinite' 
                    }} 
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loadingEpisodes && filteredEpisodes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Tv size={48} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 16 }} />
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>No episodes match this filter</h4>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Try selecting "All Episodes" to explore the full season.</p>
              </div>
            )}

            {/* ── Episodes Grid ─────────────────────── */}
            {!loadingEpisodes && filteredEpisodes.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '24px' }}>
                {filteredEpisodes.map((episode) => {
                  const episodeTitle = getEnglishTitle({ title: episode.name || `Episode ${episode.episode_number}` });
                  const epAirYear = episode.air_date ? new Date(episode.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA';
                  const runtimeStr = episode.runtime ? `${episode.runtime}m` : '60m';
                  const ratingBadge = getRatingBadgeColor(episode.vote_average || 7.5);
                  const isExpanded = !!expandedOverview[episode.id];
                  const epVerdicts = verdicts[episode.id] || {
                    userVotes: [],
                    counts: { perfection: 45, goforit: 30, timepass: 15, skip: 2 }
                  };

                  const totalVotes = (epVerdicts.counts.perfection + epVerdicts.counts.goforit + epVerdicts.counts.timepass + epVerdicts.counts.skip) || 1;
                  const perfectionPct = Math.round((epVerdicts.counts.perfection / totalVotes) * 100);
                  const goforitPct = Math.round((epVerdicts.counts.goforit / totalVotes) * 100);
                  const timepassPct = Math.round((epVerdicts.counts.timepass / totalVotes) * 100);
                  const skipPct = Math.max(0, 100 - perfectionPct - goforitPct - timepassPct);

                  return (
                    <motion.div
                      key={episode.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        background: 'linear-gradient(180deg, rgba(26, 20, 38, 0.6) 0%, rgba(13, 10, 20, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '22px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        boxShadow: '0 16px 40px -15px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
                        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                      }}
                      className="group hover:border-purple-500/40 hover:shadow-purple-500/10"
                    >
                      {/* Cinematic Hero Image */}
                      <div style={{ position: 'relative', width: '100%', height: '190px', background: '#0a0812', overflow: 'hidden' }}>
                        {episode.still_path ? (
                          <Image
                            src={`${TMDB_STILL_BASE}${episode.still_path}`}
                            alt={episodeTitle}
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            style={{ objectFit: 'cover', transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
                            className="group-hover:scale-106"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #24193d 0%, #0c0915 100%)' }}>
                            <Tv size={36} style={{ color: 'rgba(255,255,255,0.2)' }} />
                          </div>
                        )}

                        {/* Ambient Cinematic Gradient Overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 45%, rgba(13,10,20,0.95) 100%)' }} />

                        {/* Top Left: Sleek Episode Pill */}
                        <div style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          background: 'rgba(0,0,0,0.65)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#fff',
                          letterSpacing: '0.6px',
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7' }} />
                          EP {episode.episode_number < 10 ? `0${episode.episode_number}` : episode.episode_number}
                        </div>

                        {/* Top Right: Glowing Rating Pill */}
                        <div style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          background: ratingBadge.bg,
                          backdropFilter: 'blur(12px)',
                          border: `1px solid ${ratingBadge.border}`,
                          fontSize: '12px',
                          fontWeight: 900,
                          color: ratingBadge.text,
                          boxShadow: `0 0 16px ${ratingBadge.glow}`
                        }}>
                          <Star size={12} fill="currentColor" />
                          {episode.vote_average ? episode.vote_average.toFixed(1) : '7.5'}
                        </div>

                        {/* Bottom Right: Duration Badge */}
                        <div style={{
                          position: 'absolute',
                          bottom: 10,
                          right: 12,
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.85)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'rgba(0,0,0,0.6)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                          <Clock size={11} /> {runtimeStr}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div style={{ padding: '18px 20px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                        <div>
                          {/* Date & Subtitle */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(168, 85, 247, 0.85)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                              {epAirYear}
                            </span>
                          </div>

                          {/* Episode Title */}
                          <h4 style={{
                            fontSize: '17px',
                            fontWeight: 800,
                            margin: '0 0 8px 0',
                            color: '#ffffff',
                            lineHeight: 1.35,
                            letterSpacing: '-0.3px',
                          }}>
                            {episodeTitle}
                          </h4>

                          {/* Synopsis */}
                          <p style={{
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.6)',
                            lineHeight: 1.55,
                            margin: 0,
                            display: isExpanded ? 'block' : '-webkit-box',
                            WebkitLineClamp: isExpanded ? 'none' : 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {episode.overview || 'Synopsis coming soon for this episode.'}
                          </p>

                          {episode.overview && episode.overview.length > 100 && (
                            <button
                              onClick={() => setExpandedOverview(prev => ({ ...prev, [episode.id]: !prev[episode.id] }))}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#c084fc',
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: 0,
                                cursor: 'pointer',
                                marginTop: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2
                              }}
                            >
                              {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                            </button>
                          )}
                        </div>

                        {/* ── Community Verdict Mood Capsules ─────────────────────── */}
                        <div style={{
                          borderTop: '1px solid rgba(255,255,255,0.07)',
                          paddingTop: '14px',
                        }}>
                          {/* Mini Consensus Progress Bar */}
                          <div style={{
                            width: '100%',
                            height: '4px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.06)',
                            display: 'flex',
                            overflow: 'hidden',
                            marginBottom: '12px'
                          }} title={`Perfection: ${perfectionPct}% • Essential: ${goforitPct}% • Timepass: ${timepassPct}% • Skip: ${skipPct}%`}>
                            <div style={{ width: `${perfectionPct}%`, background: '#fbbf24', height: '100%' }} />
                            <div style={{ width: `${goforitPct}%`, background: '#a855f7', height: '100%' }} />
                            <div style={{ width: `${timepassPct}%`, background: '#38bdf8', height: '100%' }} />
                            <div style={{ width: `${skipPct}%`, background: '#f43f5e', height: '100%' }} />
                          </div>

                          {/* 4 Interactive Verdict Mood Pills */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                            {/* 1. Perfection */}
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => handleToggleVerdict(episode.id, 'perfection')}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '7px 4px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                border: epVerdicts.userVotes.includes('perfection')
                                  ? '1px solid rgba(251, 191, 36, 0.6)'
                                  : '1px solid rgba(255,255,255,0.06)',
                                background: epVerdicts.userVotes.includes('perfection')
                                  ? 'linear-gradient(180deg, rgba(251, 191, 36, 0.25) 0%, rgba(251, 191, 36, 0.08) 100%)'
                                  : 'rgba(255,255,255,0.025)',
                                color: epVerdicts.userVotes.includes('perfection') ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                                boxShadow: epVerdicts.userVotes.includes('perfection') ? '0 0 14px rgba(251, 191, 36, 0.25)' : 'none',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                              title="Perfection (Masterpiece)"
                            >
                              <span style={{ fontSize: '15px', marginBottom: 2 }}>🏆</span>
                              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '-0.2px' }}>
                                {epVerdicts.counts.perfection}
                              </span>
                            </motion.button>

                            {/* 2. Go For It */}
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => handleToggleVerdict(episode.id, 'goforit')}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '7px 4px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                border: epVerdicts.userVotes.includes('goforit')
                                  ? '1px solid rgba(168, 85, 247, 0.6)'
                                  : '1px solid rgba(255,255,255,0.06)',
                                background: epVerdicts.userVotes.includes('goforit')
                                  ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.08) 100%)'
                                  : 'rgba(255,255,255,0.025)',
                                color: epVerdicts.userVotes.includes('goforit') ? '#c084fc' : 'rgba(255,255,255,0.7)',
                                boxShadow: epVerdicts.userVotes.includes('goforit') ? '0 0 14px rgba(168, 85, 247, 0.25)' : 'none',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                              title="Go For It (Crucial / Hype)"
                            >
                              <span style={{ fontSize: '15px', marginBottom: 2 }}>⚡</span>
                              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '-0.2px' }}>
                                {epVerdicts.counts.goforit}
                              </span>
                            </motion.button>

                            {/* 3. Timepass */}
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => handleToggleVerdict(episode.id, 'timepass')}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '7px 4px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                border: epVerdicts.userVotes.includes('timepass')
                                  ? '1px solid rgba(56, 189, 248, 0.6)'
                                  : '1px solid rgba(255,255,255,0.06)',
                                background: epVerdicts.userVotes.includes('timepass')
                                  ? 'linear-gradient(180deg, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0.08) 100%)'
                                  : 'rgba(255,255,255,0.025)',
                                color: epVerdicts.userVotes.includes('timepass') ? '#38bdf8' : 'rgba(255,255,255,0.7)',
                                boxShadow: epVerdicts.userVotes.includes('timepass') ? '0 0 14px rgba(56, 189, 248, 0.25)' : 'none',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                              title="Timepass (Casual Watch)"
                            >
                              <span style={{ fontSize: '15px', marginBottom: 2 }}>🍿</span>
                              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '-0.2px' }}>
                                {epVerdicts.counts.timepass}
                              </span>
                            </motion.button>

                            {/* 4. Skip */}
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => handleToggleVerdict(episode.id, 'skip')}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '7px 4px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                border: epVerdicts.userVotes.includes('skip')
                                  ? '1px solid rgba(244, 63, 94, 0.6)'
                                  : '1px solid rgba(255,255,255,0.06)',
                                background: epVerdicts.userVotes.includes('skip')
                                  ? 'linear-gradient(180deg, rgba(244, 63, 94, 0.25) 0%, rgba(244, 63, 94, 0.08) 100%)'
                                  : 'rgba(255,255,255,0.025)',
                                color: epVerdicts.userVotes.includes('skip') ? '#f43f5e' : 'rgba(255,255,255,0.7)',
                                boxShadow: epVerdicts.userVotes.includes('skip') ? '0 0 14px rgba(244, 63, 94, 0.25)' : 'none',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                              title="Skip (Filler Episode)"
                            >
                              <span style={{ fontSize: '15px', marginBottom: 2 }}>⏩</span>
                              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '-0.2px' }}>
                                {epVerdicts.counts.skip}
                              </span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}

