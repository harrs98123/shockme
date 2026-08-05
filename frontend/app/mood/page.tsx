'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Brain,
  AlertCircle,
  ChevronDown,
  Flame,
  Wand2,
  SlidersHorizontal,
  Compass,
  Zap,
  CloudRain,
  Rocket,
  Eye,
  Coffee,
  Moon,
  Radio,
  Film,
  TrendingUp,
  Layers,
} from 'lucide-react';
import api from '@/lib/api';
import { Movie } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { AIChatInput } from '@/components/ui/ai-chat-input';
import MoodMovieCard from '@/components/MoodMovieCard';
import MoodFeaturedCard from '@/components/MoodFeaturedCard';

const SUGGESTED_MOODS = [
  {
    label: 'cyberpunk neon thrill',
    icon: Radio,
    color: 'from-cyan-500/20 to-blue-500/20 hover:border-cyan-500/50 text-cyan-400',
    desc: 'High-tech, neon-drenched synthwave thrillers',
  },
  {
    label: 'rainy day melancholy',
    icon: CloudRain,
    color: 'from-blue-500/20 to-indigo-500/20 hover:border-indigo-500/50 text-indigo-300',
    desc: 'Cozy, reflective, subtle human emotional dramas',
  },
  {
    label: 'mind-bending sci-fi',
    icon: Rocket,
    color: 'from-purple-500/20 to-fuchsia-500/20 hover:border-purple-500/50 text-purple-300',
    desc: 'Time loops, multi-dimensional space Odysseys',
  },
  {
    label: 'twisted psychological thriller',
    icon: Eye,
    color: 'from-rose-500/20 to-red-500/20 hover:border-rose-500/50 text-rose-400',
    desc: 'Unpredictable suspense, dark secrets, cerebral twists',
  },
  {
    label: 'adrenaline-pumping action',
    icon: Zap,
    color: 'from-amber-500/20 to-orange-500/20 hover:border-amber-500/50 text-amber-400',
    desc: 'High-octane stunts, relentless pace, epic battles',
  },
  {
    label: 'cozy feel-good comfort',
    icon: Coffee,
    color: 'from-emerald-500/20 to-teal-500/20 hover:border-emerald-500/50 text-emerald-300',
    desc: 'Warm smiles, heartwarming stories, joyful vibes',
  },
  {
    label: 'gothic supernatural mystery',
    icon: Moon,
    color: 'from-violet-500/20 to-purple-500/20 hover:border-violet-500/50 text-violet-300',
    desc: 'Eerie shadows, ancient lore, haunted atmospheres',
  },
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
  const [lastMood, setLastMood] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Movie[]>([]);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(true);
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'date'>('match');
  const resultsRef = useRef<HTMLDivElement | null>(null);

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

  // Smooth scroll down to results section when new search arrives
  useEffect(() => {
    if (results.length > 0 && resultsRef.current) {
      const navOffset = 90;
      const y = resultsRef.current.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [results]);

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
    setShowReasoning(true);
    setLastMood(searchMood);

    try {
      const res = await api.post('/recommendations/mood', {
        mood: searchMood,
        think: think,
        deepSearch: deepSearch
      });
      setResults(res.data.results || []);
      setReasoning(res.data.reasoning || null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Neural engine timed out. Please try another prompt.');
    } finally {
      setIsSearching(false);
    }
  };

  // Sort results based on selected dropdown option
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'rating') return (b.vote_average || 0) - (a.vote_average || 0);
    if (sortBy === 'date') {
      const dateA = new Date(a.release_date || a.first_air_date || 0).getTime();
      const dateB = new Date(b.release_date || b.first_air_date || 0).getTime();
      return dateB - dateA;
    }
    return 0; // Default: 'match' ranking order from AI engine
  });

  const topMatch = sortedResults[0];
  const remainingMatches = sortedResults.slice(1);

  return (
    <div className="min-h-screen px-3.5 sm:px-6 pt-20 sm:pt-28 pb-28 sm:pb-24 bg-[#05010a] relative overflow-hidden text-white font-[Inter]">
      {/* ── AMBIENT ARTISTIC BACKGROUND LIGHTS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/25 via-[#05010a] to-[#07020e]" />
        <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[180px]" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-fuchsia-600/10 rounded-full blur-[160px]" />

        {/* Dynamic Subtle Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── HERO HEADER ── */}
        <div className="max-w-4xl mx-auto text-center pt-2 sm:pt-6 pb-8 sm:pb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest mb-4 sm:mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 animate-pulse" />
            <span>Neural Vibe Engine</span>
          </div>

          <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 sm:mb-6 leading-[1.12]">
            Describe your <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Vibe.</span>
            <br />
            We curate the Cinema.
          </h1>

          <p className="text-xs sm:text-base text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed font-normal">
            Type any feeling, atmosphere, scene description, or mood in any language.
            Our AI neural engine maps your exact emotion directly to cinema recommendations.
          </p>

          {/* AI Search Input */}
          <div className="max-w-2xl mx-auto relative mb-8 sm:mb-12">
            <AIChatInput
              value={mood}
              onChange={setMood}
              onSearch={() => handleSearch()}
              loading={isSearching}
            />
          </div>

          {/* Suggested Preset Mood Pills with SVG Icons */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Popular Atmospheric Vibes</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-4xl mx-auto">
              {SUGGESTED_MOODS.map((m) => {
                const IconComponent = m.icon;
                return (
                  <button
                    key={m.label}
                    onClick={() => handleSearch(undefined, undefined, m.label)}
                    disabled={isSearching}
                    title={m.desc}
                    className={`group relative flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-gradient-to-r ${m.color} border border-white/10 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 shadow-lg`}
                  >
                    <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform group-hover:rotate-12" />
                    <span className="text-[11px] sm:text-xs font-bold capitalize">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RESULTS AREA ── */}
        <div ref={resultsRef} className="pt-4">

          {/* Loading Skeleton & Pulse State */}
          {isSearching && (
            <div className="space-y-10 py-8">
              <div className="flex flex-col items-center justify-center text-center py-10">
                <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                  <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-purple-300/80 animate-pulse">
                  Deconstructing Emotional Spectrum & Resolving Cinematic Matches...
                </p>
              </div>

              {/* Skeleton Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse"
                    style={{ animationDelay: `${i * 70}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !isSearching && (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-xl mx-auto text-center backdrop-blur-md">
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-bold mb-2">
                <AlertCircle className="w-5 h-5" />
                Neural Connection Issue
              </div>
              <p className="text-xs text-gray-300">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {!isSearching && results.length > 0 && (
            <div className="space-y-8 sm:space-y-12">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
                      Neural Cinema Matches
                    </h2>
                  </div>
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    <span className="text-lg sm:text-2xl font-black capitalize text-white">
                      &quot;{lastMood}&quot;
                    </span>
                    <span className="text-xs font-bold text-gray-300 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-purple-400" />
                      {results.length} Matches
                    </span>
                  </div>
                </div>

                {/* Sort & Reasoning Toggle Controls */}
                <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-transparent border-0 outline-none text-white font-bold cursor-pointer pr-1"
                    >
                      <option value="match" className="bg-[#0f071a]">AI Match Score</option>
                      <option value="rating" className="bg-[#0f071a]">Highest Rating</option>
                      <option value="date" className="bg-[#0f071a]">Release Year</option>
                    </select>
                  </div>

                  {reasoning && (
                    <button
                      onClick={() => setShowReasoning(!showReasoning)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/20 transition-all"
                    >
                      <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>AI Insights</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 shrink-0 ${
                          showReasoning ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* AI Reasoning Insight Box */}
              {reasoning && showReasoning && (
                <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#0d061c] border border-purple-500/25 backdrop-blur-md relative overflow-hidden shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-purple-400 mb-3">
                    <Brain className="w-4 h-4" />
                    AI Neural Breakdown
                  </div>
                  <p className="text-gray-200 text-sm md:text-base leading-relaxed font-normal">
                    {reasoning}
                  </p>
                </div>
              )}

              {/* ── TOP FEATURED MATCH (#1 SPOTLIGHT) ── */}
              {topMatch && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4.5 h-4.5 text-amber-400" fill="currentColor" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      Vibe Spotlight Match
                    </h3>
                  </div>
                  <MoodFeaturedCard
                    movie={topMatch}
                    isFav={favIds.includes(topMatch.id)}
                    isWatchlisted={watchlistIds.includes(topMatch.id)}
                  />
                </div>
              )}

              {/* ── REMAINING MOOD RECOMMENDATIONS GRID ── */}
              {remainingMatches.length > 0 && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4.5 h-4.5 text-purple-400" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
                      Recommended Vibe Selections
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
                    {remainingMatches.map((movie, i) => (
                      <MoodMovieCard
                        key={movie.id}
                        movie={movie}
                        index={i + 1}
                        isFav={favIds.includes(movie.id)}
                        isWatchlisted={watchlistIds.includes(movie.id)}
                        isWatched={watchedIds.includes(movie.id)}
                        moodQuery={lastMood}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isSearching && results.length === 0 && !error && (
            <div className="py-24 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/10">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Neural Pathway Ready
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Choose an atmospheric vibe above or type your exact mood in the search box to discover your personalized cinematic matches.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
