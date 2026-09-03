'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Search, X } from 'lucide-react';

import SarcasticPosterFallback from '@/components/SarcasticPosterFallback';

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

// ─── Collection mood/vibe filters ───────────────────────────────────────────
const FILTERS = [
  { id: 'all',        label: '🎬 All',         match: null },
  { id: 'bollywood',  label: '🎭 Bollywood',   match: ['bollywood', 'indian', 'hindi', 'south asian', 'desi', 'telugu', 'malayalam'] },
  { id: 'superhero',  label: '🦸 Superhero',   match: ['superhero', 'spider-man', 'batman', 'dark knight', 'marvel', 'dc ', 'joker', 'cape'] },
  { id: 'emotional',  label: '😭 Gut-Punch',   match: ['cry', 'mom', 'broke', 'emotional', 'feel', 'comfort', 'soul', 'heart'] },
  { id: 'classics',   label: '🏛️ Classics',   match: ['old man', 'pre-2000', 'oscar', 'godfather', 'kubrick', 'hitchcock', 'classics', 'angry men'] },
  { id: 'thriller',   label: '🔪 Thriller',    match: ['thriller', 'gaslit', 'villain', 'horror', 'scare', 'psycho', 'memento', 'dark'] },
  { id: 'scifi',      label: '🚀 Sci-Fi',      match: ['space', 'nolan', 'interstellar', 'blade runner', 'sci-fi', 'science', 'alien'] },
  { id: 'animated',   label: '🎨 Animated',    match: ['animated', 'spirited', 'howl', 'pixar', 'ghibli', 'anime'] },
  { id: 'controversial', label: '🔥 Hot Takes', match: ['fight me', 'hot take', 'ranked', 'debate', 'controversial', 'unpopular', 'lowkey'] },
  { id: 'cinephile',  label: '🎬 Cinephile',   match: ['cinematography', 'soundtrack', 'director', 'dialogue', 'tarantino', 'kubrick', 'one-take', 'lens'] },
  { id: 'datenight',  label: '❤️ Date Night',  match: ['date night', 'romance', 'titanic', 'together', 'relationship'] },
  { id: 'world',      label: '🌍 World Cinema', match: ['korean', 'non-english', 'foreign', 'subtitle', 'parasite', 'world', 'french', 'italian'] },
];

// ─── Collection Card ─────────────────────────────────────────────────────────
function CollectionCard({ col, index }: { col: CollectionOut; index: number }) {
  const [imgError, setImgError] = useState(!col.cover_poster);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5), duration: 0.35 }}
      className="group"
    >
      <Link href={`/collections/${col.id}`} prefetch={false} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        <div style={{
          overflow: 'hidden', cursor: 'pointer', height: '100%',
          borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)',
          background: '#0e0e12',
          transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        }}
          className="hover-card"
        >
          {/* Cover image or Sarcastic Fallback */}
          <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: '#111' }}>
            {!imgError && col.cover_poster ? (
              <>
                <Image
                  src={`${TMDB_IMG}${col.cover_poster}`}
                  alt={col.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  className="group-hover:scale-105"
                  onError={() => setImgError(true)}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                }} />
                {/* Item count badge */}
                <div style={{
                  position: 'absolute', bottom: 10, left: 10,
                  background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 99, padding: '3px 10px',
                  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                  letterSpacing: '0.03em',
                }}>
                  {col.item_count} {col.item_count === 1 ? 'film' : 'films'}
                </div>
              </>
            ) : (
              <SarcasticPosterFallback title={col.name} itemCount={col.item_count} seed={col.id} />
            )}
          </div>

          <div style={{ padding: '14px 14px 16px' }}>
            <h3 style={{
              margin: 0, fontSize: 13, fontWeight: 700,
              color: 'white', lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {col.name}
            </h3>
            {col.description && (
              <p style={{
                margin: '5px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.5,
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

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CollectionsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');

  const [discoverCols, setDiscoverCols] = useState<CollectionOut[]>([]);
  const [mineCols, setMineCols] = useState<CollectionOut[]>([]);
  const [loadingCols, setLoadingCols] = useState(true);

  // Filter & search state
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLoadingCols(true);
    const fetches = [
      api.get('/collections').then(r => setDiscoverCols(r.data)).catch(() => {}),
    ];
    if (user) {
      fetches.push(api.get('/collections/my').then(r => setMineCols(r.data)).catch(() => {}));
    }
    Promise.all(fetches).finally(() => setLoadingCols(false));
  }, [user]);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filterCollections = (cols: CollectionOut[]) => {
    let result = cols;

    // Apply mood filter
    if (activeFilter !== 'all') {
      const filter = FILTERS.find(f => f.id === activeFilter);
      if (filter?.match) {
        const keywords = filter.match;
        result = result.filter(col => {
          const text = `${col.name} ${col.description || ''}`.toLowerCase();
          return keywords.some(kw => text.includes(kw));
        });
      }
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(col =>
        col.name.toLowerCase().includes(q) ||
        (col.description || '').toLowerCase().includes(q)
      );
    }

    return result;
  };

  const filteredDiscover = filterCollections(discoverCols);
  const filteredMine = filterCollections(mineCols);
  const displayCols = tab === 'discover' ? filteredDiscover : filteredMine;

  const createCollection = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const col = await api.post('/collections', {
        name: newName.trim(),
        description: newDesc.trim() || null,
        is_public: true,
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
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(229,9,20,0.06) 0%, transparent 70%)',
        filter: 'blur(120px)', zIndex: -1, pointerEvents: 'none',
      }} />

      <div className="container">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1px', margin: 0, color: 'white' }}>
              Explore <span style={{ color: 'var(--primary)' }}>Collections</span>
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 15, marginTop: 6, maxWidth: 460 }}>
              Curated lists by the community — from masterpieces to spicy hot takes.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
              style={{ padding: '11px 22px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Collection
            </button>
          )}
        </div>

        {/* ── Tab Controls ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
          {[
            { id: 'discover', label: 'Community Feed' },
            { id: 'mine', label: 'My Vault', auth: true },
          ].map(t => {
            if ((t as any).auth && !user) return null;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as 'discover' | 'mine')}
                style={{
                  padding: '11px 22px', position: 'relative', border: 'none', background: 'transparent',
                  color: active ? 'white' : 'var(--text-dim)',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'color 0.2s',
                }}
              >
                {t.label}
                {active && (
                  <motion.div
                    layoutId="tab-active"
                    style={{
                      position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
                      background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Search Bar ──────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', marginBottom: 20, maxWidth: 420 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '10px 40px 10px 40px',
              color: 'white', fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Mood/Vibe Filters (Collections only) ────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10,
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            {FILTERS.map(f => {
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    padding: '7px 16px', borderRadius: 99, whiteSpace: 'nowrap', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                    border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                    background: active ? 'rgba(229,9,20,0.15)' : 'rgba(255,255,255,0.04)',
                    color: active ? 'white' : 'rgba(255,255,255,0.5)',
                    boxShadow: active ? '0 0 12px rgba(229,9,20,0.25)' : 'none',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Collections Grid ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loadingCols ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 20 }}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 16 }} />
                ))}
              </div>
            </motion.div>
          ) : tab === 'mine' && !user ? (
            <motion.div key="no-auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
              <p>Sign in to see your personal vault.</p>
              <Link href="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: 16, padding: '10px 24px', borderRadius: 12 }}>Sign In</Link>
            </motion.div>
          ) : displayCols.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
              <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>
                {searchQuery || activeFilter !== 'all'
                  ? 'No collections match your filter. Try another vibe.'
                  : tab === 'mine' ? 'Your vault is empty. Create your first collection!' : 'No collections yet.'}
              </p>
              {(searchQuery || activeFilter !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                  style={{ marginTop: 16, background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, color: 'white', padding: '9px 20px', cursor: 'pointer', fontSize: 13 }}
                >
                  Clear filters
                </button>
              )}
              {tab === 'mine' && !searchQuery && activeFilter === 'all' && (
                <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ display: 'inline-block', marginTop: 16, padding: '10px 24px', borderRadius: 12 }}>
                  Create Collection
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`grid-${tab}-${activeFilter}-${searchQuery}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Result count */}
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20, fontWeight: 600 }}>
                {displayCols.length} collection{displayCols.length !== 1 ? 's' : ''}
                {activeFilter !== 'all' && ` · ${FILTERS.find(f => f.id === activeFilter)?.label}`}
                {searchQuery && ` · "${searchQuery}"`}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 20 }}>
                {displayCols.map((col, i) => (
                  <CollectionCard key={col.id} col={col} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Create Collection Modal ──────────────────────────────────────── */}
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
              <h2 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                New Collection
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>
                Curate a list for yourself or share it with the world.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Collection Title
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
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    className="input-field"
                    placeholder="Set the mood for this list…"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    onClick={() => setShowCreate(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', padding: '10px 16px' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createCollection}
                    disabled={creating || !newName.trim()}
                    className="btn-primary"
                    style={{ padding: '11px 26px', borderRadius: 12 }}
                  >
                    {creating ? <><Loader2 size={15} className="animate-spin" style={{ display: 'inline', marginRight: 8 }} />Creating…</> : 'Finalize List'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hover-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.14) !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
        }
        .group:hover .group-hover\\:scale-105 {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
