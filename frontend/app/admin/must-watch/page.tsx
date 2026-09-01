'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Plus,
  Search,
  Trash2,
  Sparkles,
  RefreshCw,
  Film,
  CheckCircle2,
} from 'lucide-react';
import api, { posterUrl, releaseYear } from '@/lib/api';
import { MustWatch } from '@/lib/types';
import toast from '@/lib/toast';

export default function AdminMustWatch() {
  const [movies, setMovies] = useState<MustWatch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Add state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  // Local filter
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    loadMustWatch();
  }, []);

  const loadMustWatch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/must-watch');
      setMovies(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Must Watch list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await api.get(`/admin/tmdb/search?q=${encodeURIComponent(searchQuery)}&media_type=movie`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('TMDB Search failed');
    } finally {
      setSearching(false);
    }
  };

  const addMovie = async (movie: any) => {
    setAddingId(movie.id);
    try {
      const res = await api.post('/admin/must-watch', {
        movie_id: movie.id,
        media_type: 'movie',
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        overview: movie.overview,
      });
      setMovies([res.data, ...movies]);
      setSearchResults([]);
      setSearchQuery('');
      toast.success(`"${movie.title || movie.name}" added to Must Watch`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'This title is already in the list or failed to add.');
    } finally {
      setAddingId(null);
    }
  };

  const removeMovie = async (movieId: number) => {
    if (!confirm('Remove this title from Must Watch collection?')) return;
    try {
      await api.delete(`/admin/must-watch/${movieId}`);
      setMovies((prev) => prev.filter((m) => m.movie_id !== movieId));
      toast.info('Removed from Must Watch');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove title');
    }
  };

  const filteredMovies = movies.filter((m) =>
    (m.title || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center p-8 text-zinc-500 font-mono text-xs">
        Loading Must Watch roster...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-zinc-100 font-[Inter] p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Star size={14} className="text-amber-400" />
            <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">Master Roster</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Must Watch Curation</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Essential cinema recommendations featured prominently across customer discovery reels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/[0.06]">
            Total Curated: <strong className="text-white">{movies.length}</strong>
          </span>
        </div>
      </header>

      {/* TMDB Fast Search & Add Card */}
      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.06] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={15} className="text-amber-400" />
            Quick Add via TMDB
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">Live Global Catalog</span>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2.5 max-w-xl">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search movie title to feature (e.g. Dune, Parasite, Spirited Away)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-amber-500/10"
          >
            {searching ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
            <span>{searching ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        {/* Search Results Drawer */}
        {searchResults.length > 0 && (
          <div className="pt-2 border-t border-white/[0.04]">
            <div className="text-[11px] font-mono text-zinc-400 mb-3">
              Found {searchResults.length} matches on TMDB:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {searchResults.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-zinc-900/70 border border-white/[0.06] flex gap-3 items-start hover:border-amber-500/30 transition-all"
                >
                  <img
                    src={posterUrl(m.poster_path, 'w185')}
                    alt={m.title}
                    className="w-12 h-16 rounded-lg object-cover flex-shrink-0 bg-white/5 border border-white/10"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="text-xs font-bold text-white truncate">{m.title}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {releaseYear(m.release_date)} • <span className="text-amber-400 font-mono">★ {m.vote_average?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => addMovie(m)}
                      disabled={addingId === m.id}
                      className="mt-2 w-full py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      {addingId === m.id ? 'Adding...' : '+ Feature Title'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Existing Curated Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">Curated Collection</h3>

          {/* Filter search in list */}
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter current list..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white/20 transition-all"
            />
          </div>
        </div>

        {filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {filteredMovies.map((movie) => (
              <motion.div
                key={movie.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-amber-500/30 overflow-hidden transition-all flex flex-col justify-between"
              >
                {/* Poster Box */}
                <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={posterUrl(movie.poster_path, 'w342')}
                    alt={movie.title || 'Movie'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Top Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-amber-400">
                    <Star size={9} fill="currentColor" />
                    <span>{movie.vote_average?.toFixed(1) || '0.0'}</span>
                  </div>

                  {/* Remove Overlay Button */}
                  <button
                    onClick={() => removeMovie(movie.movie_id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-500/80 text-zinc-400 hover:text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remove from Must Watch"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Info Box */}
                <div className="p-3">
                  <div className="text-xs font-bold text-white truncate" title={movie.title || ''}>
                    {movie.title}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center justify-between">
                    <span>{releaseYear(movie.release_date)}</span>
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Must Watch
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl bg-zinc-950/20 border border-white/[0.04] text-xs text-zinc-500 font-mono">
            {filterQuery ? 'No movies matching your filter.' : 'No Must Watch titles curated yet. Search above to add.'}
          </div>
        )}
      </div>

    </div>
  );
}

