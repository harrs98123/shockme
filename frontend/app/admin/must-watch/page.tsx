'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Plus,
  Search,
  Trash2,
  Clapperboard,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { adminApi, posterUrl } from '@/lib/api';
import { MustWatch } from '@/lib/types';

export default function AdminMustWatch() {
  const [movies, setMovies] = useState<MustWatch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchMustWatch();
  }, []);

  const fetchMustWatch = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getMustWatch();
      setMovies(data);
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
      const results = await adminApi.tmdbSearch(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const addMovie = async (movie: any) => {
    try {
      const res = await adminApi.addMustWatch(movie);
      setMovies([res, ...movies]);
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      alert('This movie is already in the list or there was an error.');
    }
  };

  const removeMovie = async (movieId: number) => {
    if (!confirm('Remove this movie from Must Watch?')) return;
    try {
      await adminApi.removeMustWatch(movieId);
      setMovies(movies.filter(m => m.movie_id !== movieId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 500, letterSpacing: '0.05em' }}>INITIALIZING DASHBOARD...</div>;

  return (
    <div style={{ padding: '80px 60px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: 'rgba(229, 9, 20, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(229, 9, 20, 0.2)'
          }}>
            <Star size={24} color="#E50914" fill="#E50914" />
          </div>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Must Watch Curation</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginTop: 4 }}>
              <ShieldCheck size={12} /> AUTHENTICATED ADMIN SESSION
            </div>
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, maxWidth: 700, lineHeight: 1.7, fontWeight: 400 }}>
          Directly influence the platform's discovery engine. Select masterpieces that define the CineMatch standard.
        </p>
      </header>

      {/* Search & Add Section */}
      <section style={{ marginBottom: 80 }}>
        <div style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 28,
          padding: 40,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Search size={16} color="#E50914" /> Search Global Library
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Enter movie title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                width: '100%', padding: '20px 24px', paddingRight: '140px', borderRadius: 20,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                color: 'white', fontSize: 16, outline: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              className="focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{
                position: 'absolute', right: 10, top: 10, bottom: 10,
                padding: '0 32px', background: '#E50914', color: 'white', fontWeight: 800,
                borderRadius: 14, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              {searching ? '...' : 'Search'}
            </button>
          </div>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20
                }}
              >
                {searchResults.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', gap: 20, padding: 20, borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.06)',
                    alignItems: 'center',
                    transition: 'all 0.3s'
                  }}>
                    <img src={posterUrl(m.poster_path)} style={{ width: 56, height: 84, borderRadius: 12, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 4 }}>{m.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{m.release_date?.split('-')[0]} • ⭐ {m.vote_average?.toFixed(1)}</div>
                    </div>
                    <button
                      onClick={() => addMovie(m)}
                      style={{
                        width: 42, height: 42, borderRadius: 12, background: 'rgba(229,9,20,0.1)', color: '#E50914',
                        border: '1px solid rgba(229,9,20,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Featured List */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 12 }}>
            Currently Featured <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{movies.length}</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 32 }}>
          <AnimatePresence>
            {movies.map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                style={{
                  borderRadius: 28, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)', position: 'relative'
                }}
              >
                <div style={{ position: 'relative', height: 200 }}>
                  <img src={posterUrl(m.backdrop_path || m.poster_path)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #080810 0%, transparent 70%)' }} />
                  <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 8, letterSpacing: '-0.02em' }}>{m.title}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#E50914' }}>
                        <Star size={14} fill="currentColor" /> {m.vote_average?.toFixed(1)}
                      </div>
                      <span style={{ opacity: 0.3 }}>•</span>
                      <span>{m.release_date?.split('-')[0]}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMovie(m.movie_id)}
                    style={{
                      position: 'absolute', top: 20, right: 20, width: 38, height: 38, borderRadius: 12,
                      background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#E50914';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {movies.length === 0 && (
            <div style={{
              gridColumn: '1 / -1', padding: '100px 0', textAlign: 'center', color: 'rgba(255,255,255,0.25)',
              borderRadius: 32, border: '1px dashed rgba(255,255,255,0.1)'
            }}>
              <Clapperboard size={54} style={{ margin: '0 auto 24px', opacity: 0.15 }} />
              <p style={{ fontWeight: 800, fontSize: 18, color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.02em' }}>No Curated Selections</p>
              <p style={{ fontSize: 14, marginTop: 10, maxWidth: 300, margin: '10px auto 0', lineHeight: 1.6 }}>Start adding cinematic masterpieces using the search tool above.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer Branding */}
      <footer style={{ marginTop: 100, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 40, paddingBottom: 40, opacity: 0.4 }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>
            🎬 CINEMATCH ARCHIVE SYSTEM
         </div>
      </footer>
    </div>
  );
}
