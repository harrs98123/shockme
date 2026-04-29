'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Media } from '@/lib/types';

interface CollectionOut {
  id: number;
  name: string;
  item_count: number;
}

interface Props {
  movie: Media;
  /** If true, also shows the "Add to Rank Collection" quick button */
  showRankButton?: boolean;
}

function mediaPayload(movie: Media) {
  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
  const title = movie.title || movie.name || 'Untitled';
  const dateStr = movie.release_date || movie.first_air_date;

  return {
    movie_id: movie.id,
    media_type: mediaType,
    title: title,
    poster_path: movie.poster_path ?? null,
    backdrop_path: movie.backdrop_path ?? null,
    release_year: dateStr?.slice(0, 4) ?? null,
    vote_average: movie.vote_average ?? null,
  };
}

export default function AddToCollectionButton({ movie, showRankButton = false }: Props) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [collections, setCollections] = useState<CollectionOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [toast, setToast] = useState('');
  const [rankAdded, setRankAdded] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    api.get('/collections/my').then(r => {
      setCollections(r.data);
    }).catch(() => { }).finally(() => setLoading(false));
  }, [isOpen, user]);

  const addToCollection = async (colId: number, colName: string) => {
    try {
      const res = await api.post(`/collections/${colId}/add`, mediaPayload(movie));
      if (res.data.status === 'already_added') showToast(`Already in "${colName}"`);
      else showToast(`Added to "${colName}" ✓`);
      setIsOpen(false);
    } catch { showToast('Failed to add'); }
  };

  const createAndAdd = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const col = await api.post('/collections', { name: newName.trim(), is_public: true });
      await api.post(`/collections/${col.data.id}/add`, mediaPayload(movie));
      showToast(`Added to "${newName.trim()}" ✓`);
      setNewName('');
      setIsOpen(false);
    } catch { showToast('Failed to create collection'); }
    setCreating(false);
  };

  const addToRank = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { showToast('Login to use Rank Collection'); return; }
    try {
      const res = await api.post('/collections/rank-pool/add', mediaPayload(movie));
      if (res.data.status === 'already_added') showToast('Already in Rank Collection');
      else { showToast('Added to Rank Collection 🏆'); setRankAdded(true); }
    } catch { showToast('Failed to add'); }
  };

  const toggleModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  return (
    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      {/* ── Main Trigger Button ── */}
      <button
        onClick={toggleModal}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 10,
          border: '1.2px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)', color: 'white',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        Save
      </button>

      {/* ── Quick Rank Button ── */}
      {showRankButton && (
        <button
          onClick={addToRank}
          title="Add to Rank List"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10,
            border: `1.2px solid ${rankAdded ? '#a78bfa88' : 'rgba(255,255,255,0.12)'}`,
            background: rankAdded ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)',
            color: rankAdded ? '#a78bfa' : 'var(--text-dim)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🏆
        </button>
      )}

      {/* ── Modal Portal ── */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(0,0,0,0.88)',
                  backdropFilter: 'blur(16px)',
                  zIndex: 1000,
                }}
              />

              {/* Modal Content */}
              <div style={{
                position: 'fixed', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1001, pointerEvents: 'none',
                padding: 24,
              }}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 30 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  style={{
                    width: '100%', maxWidth: 440,
                    background: '#121212',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 32, overflow: 'hidden',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 20px rgba(139,92,246,0.1)',
                    pointerEvents: 'auto',
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: '36px 36px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <h2 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
                        Add to Vault
                      </h2>
                      <button 
                        onClick={() => setIsOpen(false)} 
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', border: 'none', 
                          color: 'white', cursor: 'pointer', fontSize: 20,
                          width: 34, height: 34, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 800, margin: 0, opacity: 0.8 }}>
                      Saving: <span style={{ color: 'white' }}>{movie.title || movie.name}</span>
                    </p>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '12px 0' }}>
                    {loading ? (
                      <div style={{ padding: 60, textAlign: 'center' }}>
                        <div className="spinner" style={{ width: 34, height: 34, margin: '0 auto' }} />
                        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 16 }}>Scanning collections...</p>
                      </div>
                    ) : collections.length === 0 ? (
                      <div style={{ padding: '24px 36px 36px' }}>
                        <div style={{
                          padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.02)',
                          border: '1px dashed rgba(255,255,255,0.15)', textAlign: 'center', marginBottom: 24
                        }}>
                          <div style={{ fontSize: 40, marginBottom: 12 }}>🛸</div>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No vaults found. Start your curation now.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <input
                            placeholder="Collection Name..."
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && createAndAdd()}
                            style={{
                              width: '100%', padding: '16px 20px', borderRadius: 16,
                              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)',
                              color: 'white', fontSize: 15, outline: 'none',
                            }}
                            autoFocus
                          />
                          <button
                            onClick={createAndAdd}
                            disabled={creating || !newName.trim()}
                            className="btn-primary"
                            style={{ padding: '16px', borderRadius: 16, fontSize: 15, fontWeight: 800 }}
                          >
                            {creating ? 'Creating...' : 'Create & Complete'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ maxHeight: 340, overflowY: 'auto', padding: '12px 24px' }}>
                          {collections.map(col => (
                            <button
                              key={col.id}
                              onClick={() => addToCollection(col.id, col.name)}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                width: '100%', padding: '16px 20px', borderRadius: 20,
                                background: 'transparent',
                                border: 'none', color: 'white', fontSize: 16, cursor: 'pointer',
                                textAlign: 'left', transition: 'all 0.2s', margin: '4px 0'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              <span style={{ fontWeight: 600 }}>📁 {col.name}</span>
                              <span style={{
                                color: 'var(--text-dim)', fontSize: 11, background: 'rgba(255,255,255,0.06)',
                                padding: '3px 10px', borderRadius: 10, fontWeight: 700
                              }}>{col.item_count}</span>
                            </button>
                          ))}
                        </div>

                        {/* Inline Create Footer */}
                        <div style={{
                          padding: '24px 36px 36px', borderTop: '1px solid rgba(255,255,255,0.06)',
                          background: 'rgba(0,0,0,0.2)'
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                            Quick Deploy New Vault
                          </p>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <input
                              placeholder="New vault..."
                              value={newName}
                              onChange={e => setNewName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && createAndAdd()}
                              style={{
                                flex: 1, padding: '14px 18px', borderRadius: 14,
                                background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)',
                                color: 'white', fontSize: 14, outline: 'none',
                              }}
                            />
                            <button
                              onClick={createAndAdd}
                              disabled={creating || !newName.trim()}
                              style={{
                                padding: '0 24px', borderRadius: 14,
                                background: 'var(--primary)', border: 'none',
                                color: 'white', fontSize: 14, fontWeight: 800,
                                cursor: creating ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {creating ? '...' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Floating Toast Portal */}
      {mounted && toast && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            style={{
              position: 'fixed', bottom: 48, left: '50%', x: '-50%', zIndex: 100000,
              background: '#111', border: '1px solid var(--primary)',
              borderRadius: 20, padding: '16px 32px',
              color: 'white', fontSize: 15, fontWeight: 800,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 20px rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', gap: 12,
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: 22 }}>✨</span>
            {toast}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
