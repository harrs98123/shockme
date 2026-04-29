'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gem,
  Plus,
  Search,
  Trash2,
  Star,
} from 'lucide-react';
import api, { posterUrl } from '@/lib/api';
import { GemOverride } from '@/lib/types';

export default function AdminGems() {
  const [gems, setGems] = useState<GemOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchGems();
  }, []);

  const fetchGems = async () => {
    try {
      const res = await api.get('/admin/gems');
      setGems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/admin/tmdb/search?q=${searchQuery}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const addGem = async (movie: any) => {
    try {
      const res = await api.post('/admin/gems', {
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        release_date: movie.release_date,
        overview: movie.overview,
        gem_score: 9.5,
        rarity: 'legendary',
      });
      setGems([res.data, ...gems]);
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      alert('This movie is already in the gems list or there was an error.');
    }
  };

  const removeGem = async (id: number) => {
    if (!confirm('Remove this movie from curated gems?')) return;
    try {
      await api.delete(`/admin/gems/${id}`);
      setGems(gems.filter((g) => g.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const rarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' };
      case 'rare': return { text: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)' };
      default: return { text: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' };
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at 20% 0%, #1a0a2e 0%, #0a0a0f 50%, #000 100%)',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.08)',
            borderTop: '2px solid rgba(255,255,255,0.7)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 20% 0%, #1a0a2e 0%, #0a0a0f 50%, #000000 100%)',
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        color: '#f3f4f6',
      }}
    >
      {/* Noise texture */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, padding: '48px 48px 80px', maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 56 }}
        >
          {/* Glow */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0,
            width: 400, height: 200,
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(40px)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))',
              border: '1px solid rgba(139,92,246,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139,92,246,0.25)',
            }}>
              <Gem size={20} color="#a78bfa" />
            </div>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 10px', borderRadius: 999,
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.25)',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#a78bfa', marginBottom: 4,
              }}>
                Admin Panel
              </div>
            </div>
          </div>

          <h1 style={{
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: 12,
            background: 'linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.45) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Hidden Gems Curation
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, maxWidth: 520, lineHeight: 1.6, fontWeight: 300 }}>
            Manually feature underrated masterpieces. These movies will appear at the top of the "Hidden Gems" page for all users.
          </p>

          {gems.length > 0 && (
            <div style={{
              marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: 'rgba(255,255,255,0.35)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              {gems.length} gem{gems.length !== 1 ? 's' : ''} currently featured
            </div>
          )}
        </motion.header>

        {/* ── Search Section ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 56 }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 24,
            padding: 32,
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'white',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              <Search size={15} color="#34d399" />
              Find a Movie to Feature
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by title (e.g. 'Oldboy', 'The Wailing')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  width: '100%',
                  padding: '15px 120px 15px 20px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  padding: '9px 20px',
                  background: searching ? 'rgba(52,211,153,0.5)' : 'linear-gradient(135deg, #34d399, #10b981)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: 13,
                  borderRadius: 10,
                  border: 'none',
                  cursor: searching ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  letterSpacing: '0.02em',
                }}
              >
                {searching ? '...' : 'Search'}
              </button>
            </div>

            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    marginTop: 24,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 12,
                  }}
                >
                  {searchResults.map((m, idx) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.35 }}
                      style={{
                        display: 'flex', gap: 14, padding: 14,
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        alignItems: 'center',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(52,211,153,0.25)';
                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(52,211,153,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                      }}
                    >
                      <div style={{
                        width: 40, height: 60, borderRadius: 8, overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.05)',
                      }}>
                        <img
                          src={posterUrl(m.poster_path)}
                          alt={m.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 700, color: 'white',
                          marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{m.release_date?.split('-')[0]}</span>
                          <span>•</span>
                          <Star size={10} fill="#f59e0b" color="#f59e0b" />
                          <span>{m.vote_average?.toFixed(1)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => addGem(m)}
                        style={{
                          padding: 8, borderRadius: 10, flexShrink: 0,
                          background: 'rgba(52,211,153,0.1)',
                          color: '#34d399',
                          border: '1px solid rgba(52,211,153,0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,211,153,0.2)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(52,211,153,0.4)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,211,153,0.1)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(52,211,153,0.2)';
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ── Featured Gems Grid ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <h2 style={{
              fontSize: 18, fontWeight: 800, color: 'white',
              letterSpacing: '-0.02em',
            }}>
              Currently Featured
              <span style={{
                marginLeft: 10, fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.3)', letterSpacing: 0,
              }}>
                ({gems.length})
              </span>
            </h2>
          </div>

          {gems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '80px 0', textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                borderRadius: 24,
                border: '1px dashed rgba(255,255,255,0.07)',
              }}
            >
              <Gem size={44} style={{ margin: '0 auto 16px', color: 'rgba(255,255,255,0.12)' }} />
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 15 }}>
                No curated gems yet. Use the search bar above to feature some movies.
              </p>
            </motion.div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20,
            }}>
              {gems.map((g, idx) => {
                const rarity = rarityColor(g.rarity);
                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 30, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: idx * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', cursor: 'default' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)';
                    }}
                    // @ts-ignore
                    style={{
                      borderRadius: 20, overflow: 'hidden', position: 'relative', cursor: 'default',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                      transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    {/* Backdrop */}
                    <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                      <img
                        src={posterUrl(g.backdrop_path || g.poster_path)}
                        alt={g.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, display: 'block' }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(8,8,14,1) 0%, rgba(8,8,14,0.5) 50%, transparent 100%)',
                      }} />

                      {/* Rarity badge */}
                      <div style={{
                        position: 'absolute', top: 12, left: 12,
                        padding: '4px 10px', borderRadius: 999,
                        background: rarity.bg, border: `1px solid ${rarity.border}`,
                        fontSize: 10, fontWeight: 800, letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: rarity.text,
                      }}>
                        {g.rarity}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeGem(g.id)}
                        style={{
                          position: 'absolute', top: 10, right: 10,
                          padding: 7, borderRadius: 10,
                          background: 'rgba(0,0,0,0.55)',
                          border: '1px solid rgba(255,255,255,0.09)',
                          color: 'rgba(248,113,113,0.7)',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                          backdropFilter: 'blur(6px)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.85)';
                          (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(248,113,113,0.7)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.09)';
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '14px 16px 18px' }}>
                      <div style={{
                        fontSize: 15, fontWeight: 800, color: 'white',
                        marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.3,
                      }}>
                        {g.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                            {g.vote_average?.toFixed(1)}
                          </span>
                          {g.release_date && (
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>
                              · {g.release_date.split('-')[0]}
                            </span>
                          )}
                        </div>

                        {g.gem_score && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 999,
                            background: 'rgba(139,92,246,0.12)',
                            border: '1px solid rgba(139,92,246,0.22)',
                          }}>
                            <Gem size={10} color="#a78bfa" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>
                              {g.gem_score.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}