'use client';

import { useState, useEffect, useCallback, DragEvent, useRef, Suspense } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Movie } from '@/lib/types';
import { Trash2, RotateCcw, Save, Plus, X, Search, Loader2, Check } from 'lucide-react';

interface TierMovie {
  movie_id: number;
  title: string;
  poster_path: string | null;
}

interface Tier {
  id: string;
  name: string;
  color: string;
  movies: TierMovie[];
}

const DEFAULT_TIERS: Tier[] = [
  { id: 'tier-s', name: 'S - God Tier', color: '#ff4b2b', movies: [] },
  { id: 'tier-a', name: 'A - Top Tier', color: '#ff8e2b', movies: [] },
  { id: 'tier-b', name: 'B - Solid', color: '#ffcc2b', movies: [] },
  { id: 'tier-c', name: 'C - Mid', color: '#88ff2b', movies: [] },
  { id: 'tier-d', name: 'D - Worst Movie', color: '#2bafff', movies: [] },
];

const TMDB_SMALL = 'https://image.tmdb.org/t/p/w185';
const TMDB_TINY = 'https://image.tmdb.org/t/p/w92';

export default function TierListPage() {
  return (
    <Suspense fallback={<div className="container" style={{ paddingTop: 120, textAlign: 'center' }}><div className="spinner" /></div>}>
      <TierListContent />
    </Suspense>
  );
}

function TierListContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetId = searchParams.get('id');

  const [unranked, setUnranked] = useState<TierMovie[]>([]);
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS);
  const [title, setTitle] = useState('My Movie Ranking');
  const [listId, setListId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const poolUrl = '/collections/rank-pool';
      const tierUrl = targetId ? `/tierlist?id=${targetId}` : '/tierlist';

      const [poolRes, tierRes] = await Promise.all([
        api.get(poolUrl),
        api.get(tierUrl),
      ]);

      const poolItems: TierMovie[] = poolRes.data;
      const { id, title: savedTitle, tiers_json } = tierRes.data;

      let currentTiers = DEFAULT_TIERS;
      if (tiers_json && tiers_json !== '[]') {
        try {
          currentTiers = JSON.parse(tiers_json);
        } catch (e) {
          console.error('Failed to parse saved tiers', e);
        }
      }

      setListId(id || null);
      setTitle(savedTitle || 'My Movie Ranking');

      // Filter out movies from "unranked" that are already in a tier
      const rankedIds = new Set(currentTiers.flatMap(t => t.movies.map(m => m.movie_id)));
      const filteredUnranked = poolItems.filter(item => !rankedIds.has(item.movie_id));

      setUnranked(filteredUnranked);
      setTiers(currentTiers);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [targetId]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  // Search Logic
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length > 1) {
        setSearching(true);
        try {
          const res = await api.get(`/movies/search?q=${query}`);
          setResults(res.data.results.filter((r: any) => r.media_type !== 'person').slice(0, 8));
          setShowResults(true);
        } catch (e) { console.error(e); }
        finally { setSearching(false); }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addMovieFromSearch = async (tmdbMovie: any, targetTierId: string = 'unranked') => {
    const movieData = {
      movie_id: tmdbMovie.id,
      title: tmdbMovie.title || tmdbMovie.name,
      poster_path: tmdbMovie.poster_path,
      backdrop_path: tmdbMovie.backdrop_path,
      release_year: (tmdbMovie.release_date || tmdbMovie.first_air_date || '').substring(0, 4),
      vote_average: tmdbMovie.vote_average
    };

    try {
      await api.post('/collections/rank-pool/add', movieData);
    } catch (e) { console.error('Failed to add to database pool', e); }

    const tierMovie: TierMovie = {
      movie_id: tmdbMovie.id,
      title: tmdbMovie.title || tmdbMovie.name,
      poster_path: tmdbMovie.poster_path
    };

    const isAlreadyRanked = tiers.some(t => t.movies.some(m => m.movie_id === tierMovie.movie_id));
    const isAlreadyInPool = unranked.some(m => m.movie_id === tierMovie.movie_id);
    
    if (isAlreadyRanked || isAlreadyInPool) {
      showToast('Movie already in your ranking!');
      return;
    }

    if (targetTierId === 'unranked') {
      setUnranked(prev => [...prev, tierMovie]);
    } else {
      setTiers(prev => prev.map(t => 
        t.id === targetTierId ? { ...t, movies: [...t.movies, tierMovie] } : t
      ));
    }

    showToast(`Added ${movieData.title}!`);
    setShowResults(false);
    setQuery('');
  };

  const saveTierList = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await api.post('/tierlist/save', {
        id: listId,
        title,
        tiers_json: JSON.stringify(tiers)
      });
      setListId(res.data.id);
      showToast('Ranking saved! 💾');

      // Update URL if it's a new list
      if (!targetId) {
        router.replace(`/tierlist?id=${res.data.id}`);
      }
    } catch {
      showToast('Failed to save ranking');
    }
    setSaving(false);
  };

  const resetList = () => {
    if (!confirm('Are you sure you want to reset the whole list? All movies will return to the pool.')) return;

    const allRankedMovies = tiers.flatMap(t => t.movies);
    setUnranked(prev => [...prev, ...allRankedMovies]);
    setTiers(DEFAULT_TIERS.map(t => ({ ...t, movies: [] })));
    showToast('List reset');
  };

  const removeMovie = async (movie: TierMovie, currentTierId: string) => {
    if (currentTierId === 'unranked') {
      if (!confirm('Remove this movie from your ranking pool entirely?')) return;
      try {
        await api.delete(`/collections/rank-pool/remove/${movie.movie_id}`);
        setUnranked(prev => prev.filter(m => m.movie_id !== movie.movie_id));
        showToast('Removed from pool');
      } catch {
        showToast('Failed to remove movie');
      }
    } else {
      // Just move it back to unranked
      setTiers(prev => prev.map(t =>
        t.id === currentTierId ? { ...t, movies: t.movies.filter(m => m.movie_id !== movie.movie_id) } : t
      ));
      setUnranked(prev => [...prev, movie]);
    }
  };

  // ── Drag and Drop Logic ───────────────────────────────────────────────────

  const onDragStart = (e: DragEvent, movie: TierMovie, sourceId: string) => {
    e.dataTransfer.setData('movie_id', movie.movie_id.toString());
    e.dataTransfer.setData('source_id', sourceId);
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: DragEvent, targetTierId: string) => {
    e.preventDefault();
    const movieId = parseInt(e.dataTransfer.getData('movie_id'));
    const sourceId = e.dataTransfer.getData('source_id');

    if (sourceId === targetTierId) return;

    let movieToMove: TierMovie | undefined;

    // Remove from source
    if (sourceId === 'unranked') {
      movieToMove = unranked.find(m => m.movie_id === movieId);
      setUnranked(prev => prev.filter(m => m.movie_id !== movieId));
    } else {
      const sourceTier = tiers.find(t => t.id === sourceId);
      movieToMove = sourceTier?.movies.find(m => m.movie_id === movieId);
      setTiers(prev => prev.map(t =>
        t.id === sourceId ? { ...t, movies: t.movies.filter(m => m.movie_id !== movieId) } : t
      ));
    }

    if (!movieToMove) return;

    // Add to target
    if (targetTierId === 'unranked') {
      setUnranked(prev => [...prev, movieToMove!]);
    } else {
      setTiers(prev => prev.map(t =>
        t.id === targetTierId ? { ...t, movies: [...t.movies, movieToMove!] } : t
      ));
    }
  };

  const onDragOver = (e: DragEvent) => e.preventDefault();

  // ── Tier Management ──────────────────────────────────────────────────────

  const updateTierName = (id: string, newName: string) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const addTier = () => {
    const newTier: Tier = {
      id: `tier-${Date.now()}`,
      name: 'New Tier',
      color: '#666',
      movies: []
    };
    setTiers(prev => [...prev, newTier]);
  };

  const removeTier = (id: string) => {
    const tier = tiers.find(t => t.id === id);
    if (!tier) return;

    // Move movies back to unranked
    setUnranked(prev => [...prev, ...tier.movies]);
    setTiers(prev => prev.filter(t => t.id !== id));
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Login to Rank Movies</h1>
          <p style={{ color: 'var(--text-dim)' }}>Your tier rankings are private to your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 100 }}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-[#050505]" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-20" />

      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Tier List Title..."
              style={{
                background: 'transparent', border: 'none', color: 'white',
                fontSize: 36, fontWeight: 900, outline: 'none', width: '100%',
                padding: 0, margin: 0, letterSpacing: '-0.02em'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                 <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find movie to add..."
                            style={{
                                width: '100%', height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)', padding: '0 48px', color: 'white',
                                fontSize: 13, outline: 'none', transition: 'all 0.2s'
                            }}
                            onFocus={() => query.length > 1 && setShowResults(true)}
                        />
                        {searching && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />}
                    </div>

                    <AnimatePresence>
                        {showResults && results.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                                    marginTop: 12, background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(20px)',
                                    borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
                                    padding: 8
                                }}
                            >
                                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                    {results.map(r => (
                                        <div 
                                            key={r.id} 
                                            style={{ 
                                                display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                                                borderRadius: 14, cursor: 'default', transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ width: 40, height: 60, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                                                {r.poster_path && <Image src={`${TMDB_TINY}${r.poster_path}`} alt="" width={40} height={60} style={{ objectFit: 'cover' }} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title || r.name}</h4>
                                                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{(r.release_date || r.first_air_date || '').substring(0, 4)}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button 
                                                    onClick={() => addMovieFromSearch(r, 'unranked')}
                                                    className="btn-ghost"
                                                    style={{ padding: '6px 10px', fontSize: 10, borderRadius: 8, height: 32, gap: 4 }}
                                                >
                                                    <Plus size={12} /> Pool
                                                </button>
                                                {tiers.slice(0, 3).map(tier => (
                                                    <button 
                                                        key={tier.id}
                                                        onClick={() => addMovieFromSearch(r, tier.id)}
                                                        style={{ 
                                                            width: 32, height: 32, borderRadius: 8, 
                                                            background: tier.color, color: 'black', 
                                                            fontSize: 10, fontWeight: 900, border: 'none',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                    >
                                                        {tier.name[0]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={resetList}
              className="btn-ghost"
              style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', gap: 8 }}
            >
              <RotateCcw size={16} /> Reset
            </button>
            <button
              onClick={addTier}
              className="btn-ghost"
              style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', gap: 8 }}
            >
              <Plus size={16} /> Add Tier
            </button>
            <button onClick={saveTierList} disabled={saving} className="btn-primary" style={{ padding: '12px 24px', height: 48, borderRadius: 12, gap: 8 }}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Ranking'}
            </button>
          </div>
        </div>

        {/* ── Unranked Pool ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          padding: 32, marginBottom: 48, minHeight: 180,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}
          onDrop={(e) => onDrop(e, 'unranked')}
          onDragOver={onDragOver}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Collection Pool ({unranked.length})
            </h3>
          </div>

          {unranked.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-dim)', fontSize: 13 }}>
              {loading ? 'Fetching movies...' : 'No movies in pool. Add movies from Search or Collections first!'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {unranked.map(movie => (
                <div key={movie.movie_id} style={{ position: 'relative' }}>
                  <motion.div
                    draggable
                    onDragStart={(e) => onDragStart(e as any, movie, 'unranked')}
                    whileHover={{ scale: 1.05, y: -5 }}
                    style={{
                      width: 80, height: 120, position: 'relative', borderRadius: 12,
                      overflow: 'hidden', cursor: 'grab', flexShrink: 0,
                      boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    {movie.poster_path ? (
                        <Image src={`${TMDB_SMALL}${movie.poster_path}`} alt={movie.title} fill style={{ objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, textAlign: 'center' }}>{movie.title}</div>
                    )}
                  </motion.div>
                  <button
                    onClick={() => removeMovie(movie, 'unranked')}
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 22, height: 22,
                      borderRadius: '50%', background: '#ef4444', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #050505', cursor: 'pointer', zIndex: 10,
                      fontSize: 12
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tiers ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tiers.map(tier => (
            <div
              key={tier.id}
              style={{
                display: 'flex', minHeight: 140, background: 'rgba(255,255,255,0.02)',
                borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Tier Label */}
              <div style={{
                width: 140, background: tier.color, flexShrink: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative',
                boxShadow: 'inset -10px 0 20px rgba(0,0,0,0.1)'
              }}>
                <textarea
                  value={tier.name}
                  onChange={(e) => updateTierName(tier.id, e.target.value)}
                  style={{
                    width: '100%', background: 'transparent', border: 'none', color: '#000',
                    fontSize: 16, fontWeight: 900, textAlign: 'center', resize: 'none',
                    height: '100%', outline: 'none', fontFamily: 'inherit',
                    textShadow: '0 1px 1px rgba(255,255,255,0.3)'
                  }}
                />
                <button
                  onClick={() => removeTier(tier.id)}
                  style={{
                    position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.1)',
                    border: 'none', fontSize: 14, cursor: 'pointer', opacity: 0.4,
                    width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                > <Trash2 size={12} /> </button>
              </div>

              {/* Tier Movies Area */}
              <div
                style={{
                  flex: 1, padding: 24, display: 'flex', flexWrap: 'wrap', gap: 12,
                  background: 'rgba(0,0,0,0.2)', position: 'relative'
                }}
                onDrop={(e) => onDrop(e, tier.id)}
                onDragOver={onDragOver}
              >
                {tier.movies.map(movie => (
                  <div key={movie.movie_id} style={{ position: 'relative' }}>
                    <motion.div
                      draggable
                      onDragStart={(e) => onDragStart(e as any, movie, tier.id)}
                      whileHover={{ scale: 1.05, y: -5 }}
                      style={{
                        width: 70, height: 105, position: 'relative', borderRadius: 8,
                        overflow: 'hidden', cursor: 'grab', flexShrink: 0,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                    {movie.poster_path ? (
                      <Image src={`${TMDB_SMALL}${movie.poster_path}`} alt={movie.title} fill style={{ objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, textAlign: 'center' }}>{movie.title}</div>
                    )}
                    </motion.div>
                    <button
                      onClick={() => removeMovie(movie, tier.id)}
                      style={{
                        position: 'absolute', top: -5, right: -5, width: 20, height: 20,
                        borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer', zIndex: 10
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '16px 24px',
          color: 'white', fontSize: 14, fontWeight: 600,
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
