'use client';

import { useState, useEffect, useCallback } from 'react';
import SwipeDeck from '@/components/SwipeDeck';
import { Movie } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const CATEGORIES = [
  { id: 'trending', label: 'Trending', endpoint: '/movies/trending' },
  { id: 'new', label: 'New', endpoint: '/movies/popular' },
  { id: 'movies', label: 'Movies', endpoint: '/movies/top-rated' },
  { id: 'serials', label: 'Serials', endpoint: '/movies/tv/popular' },
  { id: 'tvshows', label: 'TV shows', endpoint: '/movies/tv/trending' },
  { id: 'cartoons', label: 'Cartoons', endpoint: '/movies/anime' },
];

export default function SwipePage() {
  const [activeCategory, setActiveCategory] = useState('trending');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoryMovies = useCallback(async (endpoint: string) => {
    setLoading(true);
    try {
      // 1. Fetch category movies
      const res = await fetch(`${API_BASE}${endpoint}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      let categoryMovies: Movie[] = data.results || [];

      // 2. Fetch user favorite IDs if logged in to filter out already favorited movies
      const token = typeof window !== 'undefined' ? localStorage.getItem('cinematch_token') : null;
      if (token) {
        try {
          const favRes = await fetch(`${API_BASE}/favorites/ids`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (favRes.ok) {
            const favIds: number[] = await favRes.json();
            const favSet = new Set(favIds.map(Number));
            categoryMovies = categoryMovies.filter(m => !favSet.has(Number(m.id)));
          }
        } catch (e) {
          console.error('Failed to filter favorite IDs:', e);
        }
      }

      setMovies(categoryMovies);
    } catch (error) {
      console.error('Error fetching swipe movies:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cat = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
    fetchCategoryMovies(cat.endpoint);
  }, [activeCategory, fetchCategoryMovies]);

  return (
    <div className="min-h-screen bg-[#07040d] text-white overflow-hidden flex flex-col relative font-[family-name:var(--font-geist-sans)] selection:bg-purple-500/30">
      {/* Dynamic Purple Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_20%,rgba(139,92,246,0.15),transparent_70%)]" />

      {/* Top Category Navigation Header */}
      <header className="w-full pt-20 sm:pt-24 pb-2 sm:pb-4 px-6 sm:px-8 flex items-center justify-start sm:justify-center gap-5 sm:gap-12 overflow-x-auto no-scrollbar shrink-0 z-20">
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap text-lg sm:text-2xl font-bold transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'text-white scale-105 drop-shadow-[0_0_14px_rgba(168,85,247,0.8)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </header>

      {/* Main Centered Swipe Deck Area */}
      <main className="flex-1 w-full h-full relative flex flex-col items-center justify-center pb-20 sm:pb-28 overflow-hidden z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-purple-400">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-sm font-semibold text-zinc-400">Loading {CATEGORIES.find(c => c.id === activeCategory)?.label}...</p>
          </div>
        ) : (
          <SwipeDeck key={activeCategory} initialMovies={movies} />
        )}
      </main>
    </div>
  );
}
