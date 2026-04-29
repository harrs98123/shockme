'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Brain,
  Zap,
  AlertCircle,
  Film,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Star,
  Quote
} from 'lucide-react';
import api from '@/lib/api';
import { Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import { useAuth } from '@/lib/auth-context';
import { AIChatInput } from '@/components/ui/ai-chat-input';

const SUGGESTED_MOODS = [
  { label: 'cyberpunk noir', icon: '🌃' },
  { label: 'rainy day jazz', icon: '🎷' },
  { label: 'space odyssey', icon: '🚀' },
  { label: 'cozy morning', icon: '⛅' },
  { label: 'twisted thriller', icon: '🎭' },
];

export default function MoodPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05010a] flex items-center justify-center"><div className="spinner" /></div>}>
      <MoodContent />
    </Suspense>
  );
}

function MoodContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const concept = searchParams.get('concept');
  const [mood, setMood] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Movie[]>([]);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  // User lists for MovieCard interactivity
  const [favIds, setFavIds] = useState<number[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserLists();
    }
  }, [user]);

  useEffect(() => {
    if (concept) {
      handleSearch(undefined, undefined, concept);
    }
  }, [concept]);

  const fetchUserLists = async () => {
    try {
      const [favRes, watchRes, watchedRes] = await Promise.all([
        api.get('/favorites/ids'),
        api.get('/watchlist/ids'),
        api.get('/watched/ids'),
      ]);
      setFavIds(favRes.data);
      setWatchlistIds(watchRes.data);
      setWatchedIds(watchedRes.data);
    } catch (err) {
      console.error('Failed to fetch user lists', err);
    }
  };

  const handleSearch = async (think?: boolean, deepSearch?: boolean, selectedMood?: string) => {
    const searchMood = selectedMood || mood;
    if (!searchMood.trim() || isSearching) return;

    if (selectedMood) setMood(selectedMood);

    setIsSearching(true);
    setError(null);
    setResults([]);
    setReasoning(null);
    setShowReasoning(false);

    try {
      const res = await api.post('/recommendations/mood', {
        mood: searchMood,
        think: think,
        deepSearch: deepSearch
      });
      setResults(res.data.results);
      setReasoning(res.data.reasoning);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Our neural engine is momentarily offline. Synchronizing...');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pt-32 pb-20 bg-[#05010a] relative overflow-hidden selection:bg-purple-500/30">
      {/* ── PURPLE GRADIENT BACKGROUND ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dynamic Purple Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#05010a] to-[#0a0214]" />

        {/* Ambient Purple Light Leaks */}
        <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 -left-1/4 w-[80%] h-[80%] bg-indigo-900/10 rounded-full blur-[140px]" />

        {/* High-End Texture Layer */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 font-[Inter]">

        {/* ── LUXURY MINIMAL HERO ── */}
        <div className="max-w-4xl mx-auto mb-32 text-center pt-10">
          <div className="inline-flex items-center gap-2 px-1 mb-12 text-[20px] lowercase font-black tracking-[0.5em] text-gray-400/60">
            <div className="w-8 h-px bg-white/5"></div>
            <span>neural analysis pathway</span>
            <div className="w-8 h-px bg-white/5"></div>
          </div>

          <h1 className="text-xs md:text-sm font-black tracking-[0.8em] mb-12 leading-relaxed text-white/90 lowercase">
            cinema, curated by your emotion.
          </h1>

          <div className="max-w-2xl mx-auto relative group mb-16">
            <div className="absolute -inset-32 bg-purple-500/[0.03] rounded-full blur-[140px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

            <div>
              <AIChatInput
                value={mood}
                onChange={setMood}
                onSearch={() => handleSearch()}
                loading={isSearching}
              />
            </div>
          </div>

          {/* Suggested Moods */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 opacity-50">
            {SUGGESTED_MOODS.map((m) => (
              <button
                key={m.label}
                onClick={() => handleSearch(undefined, undefined, m.label)}
                disabled={isSearching}
                className="group relative text-[9px] lowercase font-bold tracking-[0.3em] text-gray-400 hover:text-purple-400 transition-colors active:scale-95 disabled:opacity-30"
              >
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-px bg-purple-500/30 group-hover:w-full transition-all duration-300"></div>
                <span className="mr-1.5 opacity-40">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results Area ── */}
        <div>
          {isSearching && (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="relative w-[1px] h-32 mb-16 overflow-hidden bg-white/[0.03] rounded-full">
                <div className="w-full h-full bg-purple-500/40 animate-pulse" />
              </div>
              <p className="text-[8px] font-black lowercase tracking-[0.6em] text-purple-200/50 animate-pulse">resolving emotional data</p>
            </div>
          )}

          {error && !isSearching && (
            <div className="px-6 py-6 border-l-2 border-red-500/20 bg-white/[0.01] rounded-sm max-w-xl mx-auto backdrop-blur-sm">
              <div className="text-[9px] font-black lowercase tracking-[0.4em] text-red-400/70 flex items-center gap-3">
                <AlertCircle className="w-2.5 h-2.5" />
                neural error // {error}
              </div>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-32">
              <div className="flex items-end justify-between border-b border-white/5 pb-4">
                <h2 className="text-[9px] font-black lowercase tracking-[0.5em] text-gray-500 flex items-center gap-3 italic">
                  neural selections
                </h2>
                <div className="w-32 h-px bg-white/[0.03]"></div>
              </div>

              {/* INDEPENDENT CARD GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {results.map((movie) => (
                  <ResultCard
                    key={movie.id}
                    movie={movie}
                    isFav={favIds.includes(movie.id)}
                    isWatchlisted={watchlistIds.includes(movie.id)}
                    isWatched={watchedIds.includes(movie.id)}
                  />
                ))}
              </div>

              {/* Reasoning Toggle - Minimalist Log */}
              {reasoning && (
                <div className="max-w-2xl mx-auto pt-32">
                  <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="group mx-auto flex items-center gap-6 py-2 opacity-30 hover:opacity-100 transition-all"
                  >
                    <div className="text-[8px] font-black lowercase tracking-[0.6em] text-gray-400 group-hover:text-white italic">
                      {showReasoning ? 'terminate logical pathway' : 'access logical pathway'}
                    </div>
                    <div className="w-12 h-px bg-white/[0.03] group-hover:w-20 transition-all duration-500"></div>
                  </button>

                  {showReasoning && (
                    <div className="mt-16 p-12 bg-white/[0.01] border border-white/[0.02] rounded-xl text-[10px] text-gray-400 leading-relaxed font-mono lowercase tracking-tight shadow-xl">
                      <div className="mb-6 opacity-30 uppercase text-[8px] tracking-widest italic text-purple-300">log // neural_session_01</div>
                      {reasoning}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!isSearching && results.length === 0 && !error && (
            <div className="py-48 text-center">
              <div className="max-w-xs mx-auto">
                <div className="w-px h-32 bg-gradient-to-b from-transparent via-purple-500/[0.05] to-transparent mx-auto mb-12"></div>
                <h3 className="text-[9px] font-black lowercase tracking-[0.6em] text-gray-700 mb-2 italic">pathway pending</h3>
                <p className="text-[8px] text-gray-600 uppercase tracking-[0.4em] font-bold opacity-40">
                  awaiting emotional neural input.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── INDEPENDENT RESULT CARD COMPONENT ──
function ResultCard({ movie, isFav, isWatchlisted, isWatched }: { movie: Movie, isFav: boolean, isWatchlisted: boolean, isWatched: boolean }) {
  return (
    <div className="group relative flex flex-col sm:flex-row gap-8 p-6 bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.03] rounded-2xl transition-all duration-300">

      {/* Poster Independent Container */}
      <div className="w-full sm:w-48 shrink-0">
        <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-all duration-500 group-hover:scale-[1.02]">
          <MovieCard
            movie={movie}
            isFav={isFav}
            isWatchlisted={isWatchlisted}
            isWatched={isWatched}
          />
        </div>
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-1 py-2">
        <div className="flex items-center justify-between mb-6 opacity-50">
          <span className="text-[8px] font-bold lowercase tracking-[0.4em] text-purple-300 italic">match insight</span>
          {movie.vote_average && (
            <span className="text-[8px] font-black tracking-[0.3em] text-gray-400">{movie.vote_average.toFixed(1)} / 10.0</span>
          )}
        </div>

        <h3 className="text-xl md:text-2xl font-black mb-6 tracking-[-0.05em] text-white/80 group-hover:text-white transition-colors">
          {movie.title}
        </h3>

        <div className="relative flex-1 mb-8">
          <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-medium lowercase tracking-tight opacity-80 group-hover:opacity-100 transition-opacity">
            {movie.reason}
          </p>
        </div>

        <div className="pt-6 border-t border-white/[0.03] flex items-center justify-between mt-auto">
          <span className="text-[7px] font-black text-gray-600 uppercase tracking-[0.5em] group-hover:text-purple-400/50 transition-colors">
            correlation: 98.4%
          </span>
          <div className="w-8 h-px bg-white/[0.05] group-hover:w-16 transition-all duration-500"></div>
        </div>
      </div>
    </div>
  );
}