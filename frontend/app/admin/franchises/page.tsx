'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Trash2,
  X,
  Clapperboard,
  Palette,
  LayoutGrid,
  ChevronRight,
  Info,
  Edit2,
  ExternalLink,
  Star,
  Calendar,
  Layers,
} from 'lucide-react';
import api, { posterUrl } from '@/lib/api';
import { Franchise, Movie } from '@/lib/types';

export default function AdminFranchises() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);

  // Form State (Create/Edit)
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState('#8B5CF6');
  const [formEmoji, setFormEmoji] = useState('🎬');

  // Movie Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [franchiseMovies, setFranchiseMovies] = useState<any[]>([]);

  useEffect(() => {
    fetchFranchises();
  }, []);

  const fetchFranchises = async () => {
    try {
      const res = await api.get('/admin/franchises');
      setFranchises(res.data);
      // Select first one by default if none selected
      if (res.data.length > 0 && !selectedFranchise) {
        setSelectedFranchise(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch franchises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormName('');
    setFormDesc('');
    setFormColor('#8B5CF6');
    setFormEmoji('🎬');
    setShowCreateModal(true);
  };

  const handleOpenEdit = () => {
    if (!selectedFranchise) return;
    setIsEditing(true);
    setFormName(selectedFranchise.name);
    setFormDesc(selectedFranchise.description || '');
    setFormColor(selectedFranchise.color);
    setFormEmoji(selectedFranchise.icon_emoji);
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formName,
        description: formDesc,
        color: formColor,
        icon_emoji: formEmoji
      };

      if (isEditing && selectedFranchise) {
        const res = await api.put(`/admin/franchises/${selectedFranchise.id}`, payload);
        const updated = res.data;
        setFranchises(franchises.map(f => f.id === updated.id ? updated : f));
        setSelectedFranchise(updated);
      } else {
        const res = await api.post('/admin/franchises', payload);
        const newFranchise = res.data;
        setFranchises([newFranchise, ...franchises]);
        setSelectedFranchise(newFranchise);
      }
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to save franchise:', err);
    }
  };

  const deleteFranchise = async (id: number) => {
    if (!confirm('Delete this franchise? All movie links will be lost.')) return;
    try {
      await api.delete(`/admin/franchises/${id}`);
      const remaining = franchises.filter(f => f.id !== id);
      setFranchises(remaining);
      if (selectedFranchise?.id === id) {
        setSelectedFranchise(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error('Failed to delete franchise:', err);
    }
  };

  // Movie Management
  useEffect(() => {
    if (selectedFranchise) {
      fetchFranchiseMovies();
    } else {
      setFranchiseMovies([]);
    }
  }, [selectedFranchise?.id]); // Only re-fetch if franchise ID changes

  const fetchFranchiseMovies = async () => {
    if (!selectedFranchise) return;
    const movieDetails = [];
    for (const id of selectedFranchise.movie_ids) {
      try {
        const res = await api.get(`/movies/${id}`);
        movieDetails.push(res.data);
      } catch (e) { console.error(e); }
    }
    setFranchiseMovies(movieDetails);
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

  const addMovie = async (movie: any) => {
    if (!selectedFranchise || selectedFranchise.movie_ids.includes(movie.id)) return;
    try {
      await api.post(`/admin/franchises/${selectedFranchise.id}/movies?movie_id=${movie.id}`);
      const updatedFranchise = {
        ...selectedFranchise,
        movie_ids: [...selectedFranchise.movie_ids, movie.id]
      };
      setSelectedFranchise(updatedFranchise);
      setFranchises(franchises.map(f => f.id === updatedFranchise.id ? updatedFranchise : f));
      setFranchiseMovies([...franchiseMovies, movie]);
      setSearchResults(searchResults.filter(m => m.id !== movie.id));
    } catch (err) {
      console.error(err);
    }
  };

  const removeMovie = async (movieId: number) => {
    if (!selectedFranchise) return;
    try {
      await api.delete(`/admin/franchises/${selectedFranchise.id}/movies/${movieId}`);
      const updatedFranchise = {
        ...selectedFranchise,
        movie_ids: selectedFranchise.movie_ids.filter(id => id !== movieId)
      };
      setSelectedFranchise(updatedFranchise);
      setFranchises(franchises.map(f => f.id === updatedFranchise.id ? updatedFranchise : f));
      setFranchiseMovies(franchiseMovies.filter(m => m.id !== movieId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div style={{ padding: 48, color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div className="spinner" />
      <span>Initializing cinematic data...</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 0px)', overflow: 'hidden', background: '#080810' }}>
      
      {/* Sidebar: Franchise List */}
      <aside style={{ 
        width: 320, 
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.01)'
      }}>
        <div style={{ padding: '32px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Universes</h2>
          <button 
            onClick={handleOpenCreate}
            style={{ 
              width: 32, height: 32, borderRadius: 8, background: '#8B5CF6', color: 'white', 
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Plus size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 24px' }}>
          {franchises.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              No universes created yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {franchises.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFranchise(f)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: selectedFranchise?.id === f.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFranchise?.id !== f.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFranchise?.id !== f.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {selectedFranchise?.id === f.id && (
                    <motion.div 
                      layoutId="sidebar-active"
                      style={{ position: 'absolute', left: 0, width: 3, height: 20, background: f.color, borderRadius: '0 4px 4px 0' }} 
                    />
                  )}
                  <div style={{ 
                    width: 36, height: 36, borderRadius: 10, background: `${f.color}15`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    border: `1px solid ${f.color}33`, flexShrink: 0
                  }}>
                    {f.icon_emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: selectedFranchise?.id === f.id ? 700 : 600, color: selectedFranchise?.id === f.id ? 'white' : 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                      {f.movie_ids.length} films
                    </div>
                  </div>
                  {selectedFranchise?.id === f.id && (
                    <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {selectedFranchise ? (
            <motion.div
              key={selectedFranchise.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '48px 64px' }}
            >
              {/* Franchise Header Card */}
              <div style={{ 
                position: 'relative', 
                padding: 40, 
                borderRadius: 32, 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 48,
                overflow: 'hidden'
              }}>
                {/* Visual Glow */}
                <div style={{ 
                  position: 'absolute', top: -100, right: -100, width: 300, height: 300, 
                  background: selectedFranchise.color, filter: 'blur(100px)', opacity: 0.08, pointerEvents: 'none' 
                }} />
                
                <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: 72, height: 72, borderRadius: 20, background: `${selectedFranchise.color}15`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
                    border: `1px solid ${selectedFranchise.color}44`
                  }}>
                    {selectedFranchise.icon_emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                      <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', margin: 0 }}>{selectedFranchise.name}</h1>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleOpenEdit} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteFranchise(selectedFranchise.id)} style={{ padding: 8, borderRadius: 8, background: 'rgba(248,113,113,0.1)', color: '#F87171', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
                      {selectedFranchise.description || "The universe awaits. Start by adding movies to this collection."}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 48 }}>
                {/* Search & Add Movies */}
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Search size={14} /> Expand Timeline
                  </h3>
                  <div style={{ position: 'relative', marginBottom: 24 }}>
                    <input 
                      type="text" 
                      placeholder="Search for movies to add..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      style={{ 
                        width: '100%', padding: '16px 52px 16px 16px', borderRadius: 16, 
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white', fontSize: 14, outline: 'none'
                      }}
                    />
                    <button 
                      onClick={handleSearch}
                      style={{ 
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', 
                        width: 40, height: 40, borderRadius: 12, background: selectedFranchise.color, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer'
                      }}
                    >
                      {searching ? <div className="spinner-small" /> : <Search size={18} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ 
                          display: 'flex', flexDirection: 'column', gap: 12,
                          padding: 16, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        {searchResults.map(m => (
                          <div 
                            key={m.id} 
                            onClick={() => addMovie(m)}
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: 14, padding: 10, borderRadius: 14, 
                              cursor: 'pointer', transition: 'background 0.2s', position: 'relative'
                            }}
                            className="search-result-item"
                          >
                            <img src={posterUrl(m.poster_path)} style={{ width: 40, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{m.release_date?.split('-')[0]}</div>
                            </div>
                            <div className="add-icon" style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
                              <Plus size={14} color={selectedFranchise.color} />
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => setSearchResults([])}
                          style={{ padding: '8px', color: 'rgba(255,255,255,0.2)', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                        >
                          Cancel Search
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Collection View */}
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layers size={14} /> Current Collection ({franchiseMovies.length})
                  </h3>
                  
                  {franchiseMovies.length === 0 ? (
                    <div style={{ padding: 48, borderRadius: 24, border: '1px dashed rgba(255,255,255,0.06)', textAlign: 'center' }}>
                       <Clapperboard size={32} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 16px' }} />
                       <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }}>This universe is empty.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
                      {franchiseMovies.map(m => (
                        <motion.div 
                          key={m.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{ position: 'relative' }}
                          className="group"
                        >
                          <div style={{ 
                            position: 'relative', aspectRatio: '2/3', borderRadius: 16, overflow: 'hidden', 
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
                          }}>
                            <img src={posterUrl(m.poster_path)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ 
                              position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)',
                              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12
                            }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={8} /> {m.vote_average?.toFixed(1)}</span>
                                <span>{m.release_date?.split('-')[0]}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeMovie(m.id)}
                              style={{ 
                                position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8,
                                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: '#F87171',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                                opacity: 0.8
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, opacity: 0.3 }}
            >
              <div style={{ width: 80, height: 80, borderRadius: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={40} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Select a universe to begin</div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: 500, background: '#12121A', padding: 40, borderRadius: 32, position: 'relative',
                border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 64px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 8 }}>
                  {isEditing ? 'Pulse Edit' : 'Birth a Universe'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                  Define the core identity of this cinematic collection.
                </p>
              </div>

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Identity Name</label>
                  <input
                    type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Marvel Cinematic Universe"
                    style={{ width: '100%', padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: 15 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Summary</label>
                  <textarea
                    rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Briefly describe the legend..."
                    style={{ width: '100%', padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'none', fontSize: 14 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Aura Color</label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: formColor, border: '2px solid rgba(255,255,255,0.2)', boxShadow: `0 0 20px ${formColor}44` }} />
                      <input
                        type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)}
                        style={{ flex: 1, height: 48, padding: 0, borderRadius: 14, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sigil (Emoji)</label>
                    <input
                      type="text" value={formEmoji} onChange={(e) => setFormEmoji(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', textAlign: 'center', fontSize: 24 }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '18px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Hold On</button>
                  <button type="submit" style={{ flex: 1, padding: '18px', borderRadius: 20, background: '#8B5CF6', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)' }}>
                    {isEditing ? 'Confirm Pulse' : 'Emerge'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .search-result-item:hover {
          background: rgba(255,255,255,0.05) !important;
        }
        .search-result-item .add-icon {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .search-result-item:hover .add-icon {
          opacity: 1;
        }
        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
}
