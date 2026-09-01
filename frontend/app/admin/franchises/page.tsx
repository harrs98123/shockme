'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Trash2,
  X,
  Clapperboard,
  Edit2,
  Star,
  Layers,
  Settings2,
  Tv,
  Film,
  Globe,
  Sparkles,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import api, { posterUrl, releaseYear } from '@/lib/api';
import { Franchise, FranchiseEntry } from '@/lib/types';
import toast from '@/lib/toast';

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
  const [searchMediaType, setSearchMediaType] = useState<'movie' | 'tv'>('movie');
  const [franchiseMovies, setFranchiseMovies] = useState<any[]>([]);

  // Timeline Entry State
  const [entries, setEntries] = useState<FranchiseEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<FranchiseEntry | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState({
    saga: '', phase: '', sub_timeline: '',
    timeline_order: '', release_order: '', watch_order: '',
    canon: true, multiverse: false, notes: '',
    requires_movie_ids: [] as number[],
  });

  useEffect(() => {
    fetchFranchises();
  }, []);

  const fetchFranchises = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/franchises');
      setFranchises(res.data);
      if (res.data.length > 0 && !selectedFranchise) {
        setSelectedFranchise(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch franchises:', err);
      toast.error('Failed to load franchises');
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
        toast.success('Franchise updated');
      } else {
        const res = await api.post('/admin/franchises', payload);
        const newFranchise = res.data;
        setFranchises([newFranchise, ...franchises]);
        setSelectedFranchise(newFranchise);
        toast.success('New universe created');
      }
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to save franchise:', err);
      toast.error('Failed to save franchise');
    }
  };

  const deleteFranchise = async (id: number) => {
    if (!confirm('Delete this franchise? All linked timeline data will be removed.')) return;
    try {
      await api.delete(`/admin/franchises/${id}`);
      const remaining = franchises.filter(f => f.id !== id);
      setFranchises(remaining);
      if (selectedFranchise?.id === id) {
        setSelectedFranchise(remaining.length > 0 ? remaining[0] : null);
      }
      toast.info('Franchise deleted');
    } catch (err) {
      console.error('Failed to delete franchise:', err);
      toast.error('Failed to delete franchise');
    }
  };

  // Movie Management
  useEffect(() => {
    if (selectedFranchise) {
      fetchFranchiseMovies();
      fetchEntries();
    } else {
      setFranchiseMovies([]);
      setEntries([]);
    }
  }, [selectedFranchise?.id]);

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

  const fetchEntries = async () => {
    if (!selectedFranchise) return;
    try {
      const res = await api.get(`/admin/franchises/${selectedFranchise.id}/entries`);
      setEntries(res.data);
    } catch (err) {
      console.error('Failed to fetch timeline entries:', err);
    }
  };

  const entryForMovie = (movieId: number) => entries.find(e => e.movie_id === movieId);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/admin/tmdb/search?q=${encodeURIComponent(searchQuery)}&media_type=${searchMediaType}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const addMovie = async (movie: any) => {
    if (!selectedFranchise || selectedFranchise.movie_ids.includes(movie.id)) return;
    try {
      await api.post(`/admin/franchises/${selectedFranchise.id}/movies?movie_id=${movie.id}&media_type=${searchMediaType}`);
      const updatedFranchise = {
        ...selectedFranchise,
        movie_ids: [...selectedFranchise.movie_ids, movie.id]
      };
      setSelectedFranchise(updatedFranchise);
      setFranchises(franchises.map(f => f.id === updatedFranchise.id ? updatedFranchise : f));
      setFranchiseMovies([...franchiseMovies, movie]);
      setSearchResults(searchResults.filter(m => m.id !== movie.id));
      fetchEntries();
      toast.success(`Added "${movie.title || movie.name}" to ${selectedFranchise.name}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add movie to franchise');
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
      setEntries(entries.filter(e => e.movie_id !== movieId));
      toast.info('Removed title from franchise');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove movie');
    }
  };

  const openEntryEdit = (movieId: number) => {
    const entry = entryForMovie(movieId);
    if (!entry) return;
    setEditingEntry(entry);
    setEntryForm({
      saga: entry.saga || '',
      phase: entry.phase || '',
      sub_timeline: entry.sub_timeline || '',
      timeline_order: entry.timeline_order?.toString() || '',
      release_order: entry.release_order?.toString() || '',
      watch_order: entry.watch_order?.toString() || '',
      canon: entry.canon,
      multiverse: entry.multiverse,
      notes: entry.notes || '',
      requires_movie_ids: entry.requires_movie_ids || [],
    });
    setShowEntryModal(true);
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFranchise || !editingEntry) return;
    try {
      const payload = {
        saga: entryForm.saga || null,
        phase: entryForm.phase || null,
        sub_timeline: entryForm.sub_timeline || null,
        timeline_order: entryForm.timeline_order ? parseInt(entryForm.timeline_order) : null,
        release_order: entryForm.release_order ? parseInt(entryForm.release_order) : null,
        watch_order: entryForm.watch_order ? parseInt(entryForm.watch_order) : null,
        canon: entryForm.canon,
        multiverse: entryForm.multiverse,
        notes: entryForm.notes || null,
        requires_movie_ids: entryForm.requires_movie_ids,
      };
      const res = await api.put(`/admin/franchises/${selectedFranchise.id}/entries/${editingEntry.id}`, payload);
      setEntries(entries.map(e => e.id === res.data.id ? res.data : e));
      setShowEntryModal(false);
      setEditingEntry(null);
      toast.success('Timeline details saved');
    } catch (err) {
      console.error('Failed to update timeline entry:', err);
      toast.error('Failed to save timeline');
    }
  };

  const toggleRequires = (movieId: number) => {
    setEntryForm(f => ({
      ...f,
      requires_movie_ids: f.requires_movie_ids.includes(movieId)
        ? f.requires_movie_ids.filter(id => id !== movieId)
        : [...f.requires_movie_ids, movieId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center p-8 text-zinc-500 font-mono text-xs">
        Loading Universes & Sagas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-zinc-100 font-[Inter] p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Layers size={14} className="text-purple-400" />
            <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">Universe Architect</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Franchises & Sagas</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Structure cinematic universes, chronological orders, sub-timelines and multiversal sagas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <Plus size={14} />
            <span>New Universe</span>
          </button>
        </div>
      </header>

      {/* Main Multi-panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Universes List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Universes ({franchises.length})
            </span>
          </div>

          <div className="space-y-2">
            {franchises.map((f) => {
              const active = selectedFranchise?.id === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFranchise(f)}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center gap-3.5 border cursor-pointer ${
                    active
                      ? 'bg-zinc-900/90 border-purple-500/40 shadow-sm shadow-purple-500/5'
                      : 'bg-zinc-950/40 border-white/[0.06] hover:bg-zinc-900/40 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border"
                    style={{
                      backgroundColor: `${f.color}15`,
                      borderColor: `${f.color}35`,
                    }}
                  >
                    {f.icon_emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{f.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-2">
                      <span>{f.movie_ids.length} titles</span>
                      <span>•</span>
                      <span className="truncate">{f.description || 'No description'}</span>
                    </div>
                  </div>

                  {active && (
                    <ChevronRight size={14} className="text-purple-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}

            {franchises.length === 0 && (
              <div className="p-8 text-center rounded-2xl bg-zinc-950/20 border border-white/[0.04] text-xs text-zinc-500 font-mono">
                No universes created yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Franchise Editor & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {selectedFranchise ? (
            <>
              {/* Franchise Banner Info Card */}
              <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.06] relative overflow-hidden space-y-4">
                <div
                  className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-10 pointer-events-none"
                  style={{ background: selectedFranchise.color }}
                />

                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border"
                      style={{
                        backgroundColor: `${selectedFranchise.color}20`,
                        borderColor: `${selectedFranchise.color}50`,
                      }}
                    >
                      {selectedFranchise.icon_emoji}
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">{selectedFranchise.name}</h2>
                      <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
                        {selectedFranchise.description || 'Timeline and watch order manager.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleOpenEdit}
                      className="p-2 rounded-xl bg-zinc-900 border border-white/[0.08] hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title="Edit Franchise"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => deleteFranchise(selectedFranchise.id)}
                      className="p-2 rounded-xl bg-zinc-900 border border-white/[0.08] hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 transition-all cursor-pointer"
                      title="Delete Franchise"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Add to Timeline search bar */}
                <div className="pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-2.5">
                    <button
                      onClick={() => setSearchMediaType('movie')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        searchMediaType === 'movie'
                          ? 'bg-zinc-800 text-white border border-white/10'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Film size={12} /> Movies
                    </button>
                    <button
                      onClick={() => setSearchMediaType('tv')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        searchMediaType === 'tv'
                          ? 'bg-zinc-800 text-white border border-white/10'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Tv size={12} /> TV Shows
                    </button>
                  </div>

                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder={`Search ${searchMediaType === 'movie' ? 'movie' : 'series'} to add to timeline...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-purple-500/50 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searching || !searchQuery.trim()}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {searching ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                      <span>Add</span>
                    </button>
                  </form>

                  {/* Search Results preview */}
                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                      {searchResults.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-between gap-3 hover:border-purple-500/30 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={posterUrl(m.poster_path, 'w92')}
                              alt={m.title}
                              className="w-8 h-11 rounded-md object-cover bg-white/5 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{m.title || m.name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {releaseYear(m.release_date || m.first_air_date)}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => addMovie(m)}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-[11px] font-bold transition-all cursor-pointer flex-shrink-0"
                          >
                            + Include
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Titles Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    Universe Titles & Chronology ({franchiseMovies.length})
                  </h3>
                </div>

                {franchiseMovies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {franchiseMovies.map((m) => {
                      const entry = entryForMovie(m.id);
                      return (
                        <motion.div
                          key={m.id}
                          layout
                          className="group relative rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-purple-500/30 overflow-hidden transition-all flex flex-col justify-between"
                        >
                          {/* Poster Frame */}
                          <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                            <img
                              src={posterUrl(m.poster_path, 'w342')}
                              alt={m.title || 'Movie'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />

                            {/* Watch Order Pill */}
                            {entry?.watch_order != null && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600/80 backdrop-blur-md border border-purple-400/30 text-[9px] font-mono text-white font-bold">
                                #{entry.watch_order} Watch
                              </div>
                            )}

                            {/* Actions Overlay */}
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEntryEdit(m.id)}
                                className="p-1.5 rounded-lg bg-black/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 cursor-pointer transition-all"
                                title="Timeline metadata"
                              >
                                <Settings2 size={12} />
                              </button>
                              <button
                                onClick={() => removeMovie(m.id)}
                                className="p-1.5 rounded-lg bg-black/70 hover:bg-rose-500/80 text-zinc-400 hover:text-white border border-white/10 cursor-pointer transition-all"
                                title="Remove from universe"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Info Footer */}
                          <div className="p-3">
                            <div className="text-xs font-bold text-white truncate" title={m.title || ''}>
                              {m.title || m.name}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center justify-between">
                              <span>{releaseYear(m.release_date || m.first_air_date)}</span>
                              {entry?.phase ? (
                                <span className="text-[9px] font-semibold text-purple-300 px-1 rounded bg-purple-500/10 border border-purple-500/20">
                                  {entry.phase}
                                </span>
                              ) : (
                                <span className="text-[9px] text-zinc-600">Canon</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center rounded-2xl bg-zinc-950/20 border border-white/[0.04] text-xs text-zinc-500 font-mono">
                    No titles linked to this universe yet. Search above to include films.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-24 text-center rounded-2xl bg-zinc-950/20 border border-white/[0.04] text-xs text-zinc-500 font-mono">
              Select or create a universe from the left panel.
            </div>
          )}
        </div>

      </div>

      {/* Universe Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-white/[0.08] p-6 rounded-2xl relative z-10 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white">
                  {isEditing ? 'Edit Universe' : 'Create New Universe'}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Franchise Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Dune Universe, Marvel Cinematic Universe"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-white text-xs focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief universe synopsis..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-white text-xs focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Color Theme</label>
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-full h-9 rounded-xl bg-zinc-900 border border-white/[0.08] cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Emoji Icon</label>
                    <input
                      type="text"
                      value={formEmoji}
                      onChange={(e) => setFormEmoji(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-white text-xs text-center font-emoji focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    {isEditing ? 'Save Changes' : 'Create Universe'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Timeline Entry Metadata Modal */}
      <AnimatePresence>
        {showEntryModal && editingEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEntryModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-950 border border-white/[0.08] p-6 rounded-2xl relative z-10 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-bold text-white">Timeline Metadata</h3>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{editingEntry.title}</p>
                </div>
                <button
                  onClick={() => setShowEntryModal(false)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEntrySubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Phase</label>
                    <input
                      type="text"
                      value={entryForm.phase}
                      onChange={(e) => setEntryForm({ ...entryForm, phase: e.target.value })}
                      placeholder="e.g. Phase 1"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Saga</label>
                    <input
                      type="text"
                      value={entryForm.saga}
                      onChange={(e) => setEntryForm({ ...entryForm, saga: e.target.value })}
                      placeholder="e.g. Infinity Saga"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Watch #</label>
                    <input
                      type="number"
                      value={entryForm.watch_order}
                      onChange={(e) => setEntryForm({ ...entryForm, watch_order: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Timeline #</label>
                    <input
                      type="number"
                      value={entryForm.timeline_order}
                      onChange={(e) => setEntryForm({ ...entryForm, timeline_order: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Release #</label>
                    <input
                      type="number"
                      value={entryForm.release_order}
                      onChange={(e) => setEntryForm({ ...entryForm, release_order: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Notes / Connections</label>
                  <textarea
                    rows={3}
                    value={entryForm.notes}
                    onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                    placeholder="Post-credits scenes, lore connections, prequel context..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-white text-xs resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEntryModal(false)}
                    className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    Save Timeline Info
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

