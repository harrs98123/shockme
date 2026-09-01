'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gem,
  Plus,
  Search,
  Trash2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import api, { posterUrl, releaseYear } from '@/lib/api';
import { GemOverride } from '@/lib/types';
import toast from '@/lib/toast';

export default function AdminGems() {
  const [gems, setGems] = useState<GemOverride[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Add state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  // New Gem Form Config
  const [customScore, setCustomScore] = useState<number>(9.5);
  const [customRarity, setCustomRarity] = useState<string>('legendary');

  // Filter state
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedRarityFilter, setSelectedRarityFilter] = useState<string>('all');

  useEffect(() => {
    fetchGems();
  }, []);

  const fetchGems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/gems');
      setGems(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch gems list');
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
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const addGem = async (movie: any) => {
    setAddingId(movie.id);
    try {
      const res = await api.post('/admin/gems', {
        movie_id: movie.id,
        media_type: 'movie',
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        release_date: movie.release_date,
        overview: movie.overview,
        gem_score: customScore,
        rarity: customRarity,
      });
      setGems([res.data, ...gems]);
      setSearchResults([]);
      setSearchQuery('');
      toast.success(`Added "${movie.title || movie.name}" to Hidden Gems`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'This movie is already in the gems vault.');
    } finally {
      setAddingId(null);
    }
  };

  const removeGem = async (id: number) => {
    if (!confirm('Remove this movie from curated gems?')) return;
    try {
      await api.delete(`/admin/gems/${id}`);
      setGems(gems.filter((g) => g.id !== id));
      toast.info('Removed from curated gems');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove gem');
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'rare':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'cult':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const filteredGems = gems.filter((g) => {
    const matchesSearch = (g.title || '').toLowerCase().includes(filterQuery.toLowerCase());
    const matchesRarity = selectedRarityFilter === 'all' || (g.rarity || '').toLowerCase() === selectedRarityFilter;
    return matchesSearch && matchesRarity;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center p-8 text-zinc-500 font-mono text-xs">
        Loading Hidden Gems Vault...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-zinc-100 font-[Inter] p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Gem size={14} className="text-emerald-400" />
            <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">Vault Curator</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Hidden Gems Vault</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/[0.06]">
            Total Gems: <strong className="text-white">{gems.length}</strong>
          </span>
        </div>
      </header>

      {/* TMDB Fast Search & Preset Options Card */}
      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.06] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={15} className="text-emerald-400" />
            Curate New Hidden Gem
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">Fast TMDB Ingestion</span>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2.5 flex-1">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search indie or rare movie title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-emerald-600/10"
            >
              {searching ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
              <span>{searching ? 'Searching...' : 'Search'}</span>
            </button>
          </form>

          {/* Rarity & Score Presets */}
          <div className="flex items-center gap-2">
            <select
              value={customRarity}
              onChange={(e) => setCustomRarity(e.target.value)}
              className="bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="legendary">⭐ Legendary</option>
              <option value="rare">🔮 Rare Gem</option>
              <option value="cult">🔥 Cult Classic</option>
              <option value="underrated">✨ Underrated</option>
            </select>

            <div className="flex items-center gap-1 bg-zinc-900 px-3 py-2 rounded-xl border border-white/[0.08] text-xs">
              <span className="text-zinc-500 font-mono">Score:</span>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={customScore}
                onChange={(e) => setCustomScore(parseFloat(e.target.value) || 9.0)}
                className="w-12 bg-transparent text-emerald-400 font-bold font-mono outline-none text-center"
              />
            </div>
          </div>
        </div>

        {/* Search Results Drawer */}
        {searchResults.length > 0 && (
          <div className="pt-3 border-t border-white/[0.04]">
            <div className="text-[11px] font-mono text-zinc-400 mb-3">
              Search Results ({searchResults.length}):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {searchResults.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-zinc-900/70 border border-white/[0.06] flex gap-3 items-start hover:border-emerald-500/30 transition-all"
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
                        {releaseYear(m.release_date)} • <span className="text-emerald-400 font-mono">★ {m.vote_average?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => addGem(m)}
                      disabled={addingId === m.id}
                      className="mt-2 w-full py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      {addingId === m.id ? 'Adding...' : `+ Add as ${customRarity}`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Curated Gems Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Vault Collection</h3>
            <span className="text-[10px] font-mono text-zinc-500">({filteredGems.length} titles)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Rarity filter pills */}
            <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-white/[0.06]">
              {['all', 'legendary', 'rare', 'cult', 'underrated'].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRarityFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                    selectedRarityFilter === r
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Title filter */}
            <div className="relative w-full sm:w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter vault..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
          </div>
        </div>

        {filteredGems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {filteredGems.map((gem) => (
              <motion.div
                key={gem.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-emerald-500/30 overflow-hidden transition-all flex flex-col justify-between"
              >
                {/* Poster Box */}
                <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={posterUrl(gem.poster_path, 'w342')}
                    alt={gem.title || 'Movie'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Gem Score Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold">
                    <Gem size={10} className="text-emerald-400" />
                    <span>{gem.gem_score ? gem.gem_score.toFixed(1) : '9.5'}</span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeGem(gem.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-500/80 text-zinc-400 hover:text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remove from Gems Vault"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Info Box */}
                <div className="p-3">
                  <div className="text-xs font-bold text-white truncate" title={gem.title || ''}>
                    {gem.title}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center justify-between">
                    <span>{releaseYear(gem.release_date)}</span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${getRarityBadge(gem.rarity || 'rare')}`}>
                      {gem.rarity || 'rare'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl bg-zinc-950/20 border border-white/[0.04] text-xs text-zinc-500 font-mono">
            {filterQuery || selectedRarityFilter !== 'all'
              ? 'No gems matching current filter.'
              : 'No hidden gems in vault yet. Search above to add.'}
          </div>
        )}
      </div>

    </div>
  );
}