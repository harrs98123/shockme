'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Movie, Genre } from '@/lib/types';
import CollectionMovieCard from '@/components/CollectionMovieCard';
import { Loader2, Plus, ChevronDown } from 'lucide-react';

interface CollectionOut {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  is_public: boolean;
  is_rank_list: boolean;
  created_at: string;
  item_count: number;
  cover_poster: string | null;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

// ─── Local Components ────────────────────────────────────────────────────────

function CollectionCard({ col, index }: { col: CollectionOut; index: number }) {
  const coverSrc = col.cover_poster
    ? `${TMDB_IMG}${col.cover_poster}`
    : '/no-poster.png';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link href={`/collections/${col.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          className="card"
          style={{
            overflow: 'hidden', cursor: 'pointer',
            height: '100%',
          }}
        >
          {/* Cover image */}
          <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: '#111' }}>
            <Image
              src={coverSrc}
              alt={col.name}
              fill
              sizes="(max-width: 768px) 50vw, 20vw"
              style={{ objectFit: 'cover' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/no-poster.png'; }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
            }} />
            <div style={{
              position: 'absolute', bottom: 10, left: 10,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 99, padding: '3px 10px',
              fontSize: 12, fontWeight: 700, color: 'white',
            }}>
              {col.item_count} {col.item_count === 1 ? 'Item' : 'Items'}
            </div>
          </div>

          <div style={{ padding: '14px' }}>
            <h3 style={{
              margin: 0, fontSize: 14, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
              color: 'white', lineHeight: 1.3,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {col.name}
            </h3>
            {col.description && (
              <p style={{
                margin: '5px 0 0', fontSize: 12, color: 'var(--text-dim)',
                lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {col.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}


// ─── Main Component ──────────────────────────────────────────────────────────

export default function CollectionsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');

  // Community Collections
  const [discoverCols, setDiscoverCols] = useState<CollectionOut[]>([]);
  const [mineCols, setMineCols] = useState<CollectionOut[]>([]);
  const [loadingCols, setLoadingCols] = useState(true);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [moviePage, setMoviePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Observer Ref
  const observerRef = useRef<HTMLDivElement | null>(null);

  // UI state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Initialize
  useEffect(() => {
    // Genres
    api.get('/movies/genres').then(r => setGenres(r.data.genres)).catch(() => { });

    // Collections
    setLoadingCols(true);
    const fetches = [
      api.get('/collections').then(r => setDiscoverCols(r.data)).catch(() => { }),
    ];
    if (user) {
      fetches.push(api.get('/collections/my').then(r => setMineCols(r.data)).catch(() => { }));
    }
    Promise.all(fetches).finally(() => setLoadingCols(false));
  }, [user]);

  // Fetch movies when genre changes or on load more
  const fetchGenreMovies = useCallback(async (id: number, page: number = 1) => {
    if (page === 1) setLoadingMovies(true);
    else setLoadingMore(true);

    try {
      const res = await api.get(`/movies/discover?with_genres=${id}&page=${page}`);
      const newMovies = res.data.results || [];

      if (page === 1) {
        setGenreMovies(newMovies);
      } else {
        setGenreMovies(prev => [...prev, ...newMovies]);
      }

      setHasMore(page < (res.data.total_pages || 1));
    } catch {
      if (page === 1) setGenreMovies([]);
    } finally {
      setLoadingMovies(false);
      setLoadingMore(false);
    }
  }, []);

  // Reset and fetch on genre change
  useEffect(() => {
    if (selectedGenreId) {
      setMoviePage(1);
      setHasMore(true);
      fetchGenreMovies(selectedGenreId, 1);
    } else {
      setGenreMovies([]);
    }
  }, [selectedGenreId, fetchGenreMovies]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && selectedGenreId) {
      const nextPage = moviePage + 1;
      setMoviePage(nextPage);
      fetchGenreMovies(selectedGenreId, nextPage);
    }
  };

  // Intersection Observer for Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loadingMovies && selectedGenreId) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadingMovies, selectedGenreId, moviePage]);

  const createCollection = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const col = await api.post('/collections', {
        name: newName.trim(),
        description: newDesc.trim() || null,
        is_public: true
      });
      setMineCols(prev => [col.data, ...prev]);
      setDiscoverCols(prev => [col.data, ...prev]);
      setNewName(''); setNewDesc('');
      setShowCreate(false);
      setTab('mine');
    } catch { /* ignore */ }
    setCreating(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 80 }}>
      {/* ── Ambient Background Blur ── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(229,9,20,0.08) 0%, transparent 70%)',
        filter: 'blur(100px)', zIndex: -1, pointerEvents: 'none'
      }} />

      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1px', margin: 0, color: 'white' }}>
              Explore <span style={{ color: 'var(--primary)' }}>Collections</span>
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 16, marginTop: 8, maxWidth: 480 }}>
              Discover curated lists from the community or explore by genre to build your own masterpiece.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
              style={{ padding: '12px 24px', borderRadius: 12 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create New
            </button>
          )}
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
          {[
            { id: 'discover', label: 'Community Feed' },
            { id: 'mine', label: 'My Vault', auth: true },
          ].map(t => {
            if (t.auth && !user) return null;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                style={{
                  padding: '12px 24px', position: 'relative', border: 'none', background: 'transparent',
                  color: active ? 'white' : 'var(--text-dim)',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'color 0.2s'
                }}
              >
                {t.label}
                {active && (
                  <motion.div
                    layoutId="tab-active"
                    style={{
                      position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
                      background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <section>
          {tab === 'discover' ? (
            <>
              {/* Genre Browse Row */}
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Browse by Genre
                </h2>
                <div style={{
                  display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16,
                  scrollbarWidth: 'none', msOverflowStyle: 'none'
                }}>
                  <button
                    onClick={() => setSelectedGenreId(null)}
                    style={{
                      padding: '8px 20px', borderRadius: 99, whiteSpace: 'nowrap', border: '1px solid var(--border)',
                      background: selectedGenreId === null ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      color: selectedGenreId === null ? 'white' : 'var(--text-muted)',
                      fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    Hot Now
                  </button>
                  {genres.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGenreId(g.id)}
                      style={{
                        padding: '8px 20px', borderRadius: 99, whiteSpace: 'nowrap', border: '1px solid var(--border)',
                        background: selectedGenreId === g.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: selectedGenreId === g.id ? 'white' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Content Grid */}
              <AnimatePresence mode="wait">
                {selectedGenreId ? (
                  <motion.div
                    key={`genre-${selectedGenreId}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
                      <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
                        {genres.find(g => g.id === selectedGenreId)?.name} Masterpieces
                      </h3>
                      <button
                        onClick={() => setSelectedGenreId(null)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                      >
                        Clear Filter ×
                      </button>
                    </div>

                    {loadingMovies ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
                        {[...Array(12)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 16 }} />)}
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 32 }}>
                          {genreMovies.map((m, i) => (
                            <CollectionMovieCard key={`${m.id}-${i}`} movie={m} index={i} />
                          ))}
                        </div>

                        {/* Load More / Observer Target */}
                        <div
                          ref={observerRef}
                          style={{
                            marginTop: 64,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 16,
                            paddingBottom: 40
                          }}
                        >
                          {hasMore ? (
                            <button
                              onClick={handleLoadMore}
                              disabled={loadingMore}
                              className="btn-ghost"
                              style={{
                                padding: '16px 40px',
                                borderRadius: 16,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border)',
                                fontSize: 16,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                color: 'white'
                              }}
                            >
                              {loadingMore ? (
                                <>
                                  <Loader2 size={20} className="animate-spin text-primary" />
                                  Summoning More...
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={20} />
                                  Explore More
                                </>
                              )}
                            </button>
                          ) : genreMovies.length > 0 && (
                            <div style={{ color: 'var(--text-dim)', fontSize: 14, fontWeight: 600 }}>
                              You've reached the end of the {genres.find(g => g.id === selectedGenreId)?.name} universe.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="trending-cols"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Trending Collections</h3>
                    {loadingCols ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
                        {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 16 }} />)}
                      </div>
                    ) : discoverCols.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>No collections found.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
                        {discoverCols.map((col, i) => (
                          <CollectionCard key={col.id} col={col} index={i} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <motion.div
              key="my-cols"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Your Private Vault</h3>
              {loadingCols ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 16 }} />)}
                </div>
              ) : mineCols.length === 0 ? (
                <div style={{
                  padding: '80px 24px', textAlign: 'center', background: 'var(--surface)',
                  borderRadius: 20, border: '1px dashed var(--border)'
                }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🎬</div>
                  <h4 style={{ margin: '0 0 8px', fontSize: 18 }}>Empty Vault</h4>
                  <p style={{ color: 'var(--text-dim)', margin: '0 0 24px', fontSize: 14 }}>
                    Start by creating a collection or exploring genres to save movies here.
                  </p>
                  <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ padding: '10px 24px' }}>
                    Setup First Collection
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
                  {mineCols.map((col, i) => (
                    <CollectionCard key={col.id} col={col} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </section>
      </div>

      {/* Create Collection Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 500,
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              style={{
                background: '#161616', border: '1px solid var(--border)',
                borderRadius: 24, padding: '32px', maxWidth: 460, width: '100%',
                boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ fontWeight: 800, fontSize: 24, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                New Collection
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 28 }}>
                Curate a list for yourself or share it with the world.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                    COLLECTION TITLE
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. Rainy Day Classics"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                    DESCRIPTION (OPTIONAL)
                  </label>
                  <textarea
                    className="input-field"
                    placeholder="Set the mood for this list…"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    onClick={() => setShowCreate(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createCollection}
                    disabled={creating || !newName.trim()}
                    className="btn-primary"
                    style={{ padding: '12px 28px', borderRadius: 12 }}
                  >
                    {creating ? 'Creating…' : 'Finalize List'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
