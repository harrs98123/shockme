'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  Check,
  Compass,
  Film,
  Layers,
  Loader2,
  RotateCcw,
  Shuffle,
  Star,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { Movie } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  STEP_META,
  ATMOSPHERE_OPTIONS,
  OCCASION_OPTIONS,
  ERA_OPTIONS,
  STYLE_OPTIONS,
  ACCENT_STYLES,
  GENRE_GLOW_MAP,
  DEFAULT_GLOW,
  GlowConfig,
  FinderSelections,
  AnyFinderOption,
  WizardOption,
} from '@/lib/finderData';
import MoodMovieCard from '@/components/MoodMovieCard';
import MoodFeaturedCard from '@/components/MoodFeaturedCard';

type Phase = 'wizard' | 'loading' | 'results';

interface ScoredMovie extends Movie {
  popularity?: number;
  adult?: boolean;
  _score: number;
  _matchReason?: string;
}

// How many movies to keep in the pool for shuffling
const TARGET_POOL = 48;
// Minimum results needed before we fall back to broader searches
const MIN_RESULTS_STRICT = 12;
const MIN_RESULTS_FALLBACK = 6;

const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
};

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.028 } },
};

const optionVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

// ── IMPROVED SCORING ENGINE ────────────────────────────────────────────────────
/**
 * Score a movie against the user's atmosphere + occasion selections.
 *
 * Strategy:
 * 1. PRIMARY genre hit  → strongest signal (atmosphere + occasion primary genres)
 * 2. SECONDARY genre hit → medium signal (atmosphere + occasion secondary genres)
 * 3. EXCLUDED genre hit  → heavy penalty (movies that clash with the mood)
 * 4. Quality (rating)    → bonus for highly rated films, heavy penalty below threshold
 * 5. Popularity signal   → log-scaled to avoid blockbuster dominance for niche queries
 * 6. Adult/garbage filter → discard adult content and very low-rated films
 */
function scoreMovie(
  m: Movie & { popularity?: number; adult?: boolean },
  atm: WizardOption,
  occ: WizardOption,
  styleMinRating: number,
): number {
  const rating = m.vote_average || 0;
  const voteCount = m.vote_count ?? 0;

  // Combined minimum rating from atmosphere, occasion, and style
  const effectiveMinRating = Math.max(
    atm.minRating ?? 5.5,
    occ.minRating ?? 5.5,
    styleMinRating,
    5.0,
  );
  // Discard low-quality junk with sufficient vote data
  if (rating < 4.0 && voteCount > 50) return -9999;

  const ids = new Set(m.genre_ids || []);

  // Count primary hits (atmosphere primary genres)
  const atmPrimaryHits = atm.genres.filter(g => ids.has(g)).length;
  // Count primary hits (occasion primary genres)
  const occPrimaryHits = occ.genres.filter(g => ids.has(g)).length;

  // Secondary genre hits
  const atmSecondaryHits = (atm.secondaryGenres || []).filter(g => ids.has(g)).length;
  const occSecondaryHits = (occ.secondaryGenres || []).filter(g => ids.has(g)).length;

  // Exclusion penalties — combine both atmosphere and occasion exclusions
  const combinedExclusions = new Set([
    ...(atm.excludeGenres || []),
    ...(occ.excludeGenres || []),
  ]);
  const exclusionHits = Array.from(combinedExclusions).filter(g => ids.has(g)).length;

  // Primary genre score — if no primary hits at all, severely penalize
  const primaryScore = (atmPrimaryHits * 6) + (occPrimaryHits * 5);
  const secondaryScore = (atmSecondaryHits * 2.5) + (occSecondaryHits * 2);
  const exclusionPenalty = exclusionHits * 8; // heavy penalty for wrong genres

  // Quality bonus — rated above quality floor gets bonus, below gets penalty
  const qualityBonus = rating >= effectiveMinRating
    ? (rating - effectiveMinRating) * 1.5
    : (rating - effectiveMinRating) * 3; // stronger penalty for below threshold

  // Popularity — log-scaled to balance discovery vs mass appeal
  const popularityBonus = Math.log10(Math.max((m.popularity || 0), 1)) * 1.2;

  // Bonus for movies that hit BOTH atmosphere AND occasion primary genres (cross-match reward)
  const crossMatchBonus = (atmPrimaryHits > 0 && occPrimaryHits > 0) ? 4 : 0;

  // Total score
  return primaryScore + secondaryScore - exclusionPenalty + qualityBonus + popularityBonus + crossMatchBonus;
}

// ── DISCOVER API HELPER ────────────────────────────────────────────────────────
async function runDiscover(
  params: Record<string, string | number | undefined>,
  pages: number[],
): Promise<Movie[]> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== 0)
  );
  const settled = await Promise.allSettled(
    pages.map(page => api.get('/movies/discover', { params: { ...cleaned, page } }))
  );
  const out: Movie[] = [];
  settled.forEach(r => {
    if (r.status === 'fulfilled') out.push(...(r.value.data.results || []));
  });
  return out;
}

export default function FinderPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selections, setSelections] = useState<FinderSelections>({});
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('wizard');
  const [pool, setPool] = useState<ScoredMovie[]>([]);
  const [results, setResults] = useState<ScoredMovie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState('');

  const [favIds, setFavIds] = useState<number[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);

  const topRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (user) fetchUserLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (phase === 'results' && resultsRef.current) {
      const y = resultsRef.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [phase]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  // Dynamic glow based on hover or selections
  const activeGlowKey = hoveredOptionId || selections.atmosphere || selections.occasion || '';
  const activeGlow: GlowConfig = GENRE_GLOW_MAP[activeGlowKey] || DEFAULT_GLOW;

  const selectOption = (stepKey: keyof FinderSelections, optionId: string) => {
    const next = { ...selections, [stepKey]: optionId };
    setSelections(next);

    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      if (stepKey === 'style') {
        setPhase('loading');
        generateResults(next);
      } else {
        setDirection(1);
        setStep(s => Math.min(STEP_META.length - 1, s + 1));
      }
    }, 340);
  };

  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setDirection(-1);
    setStep(s => Math.max(0, s - 1));
  };

  const startOver = () => {
    setSelections({});
    setStep(0);
    setDirection(-1);
    setPhase('wizard');
    setResults([]);
    setPool([]);
    setError(null);
    setLoadingStage('');
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── CORE RECOMMENDATION ENGINE ───────────────────────────────────────────────
  const generateResults = async (sel: FinderSelections) => {
    setError(null);
    setLoadingStage('Analysing your preferences…');

    try {
      const atm = ATMOSPHERE_OPTIONS.find(o => o.id === sel.atmosphere)!;
      const occ = OCCASION_OPTIONS.find(o => o.id === sel.occasion)!;
      const era = ERA_OPTIONS.find(o => o.id === sel.era)!;
      const style = STYLE_OPTIONS.find(o => o.id === sel.style)!;

      // Build primary genre intersection (genres shared between atm + occ = highest signal)
      const atmPrimary = new Set(atm.genres);
      const occPrimary = new Set(occ.genres);
      const sharedPrimary = [...atmPrimary].filter(g => occPrimary.has(g));

      // Union of all primary genres — any of these must appear
      const allPrimary = Array.from(new Set([...atm.genres, ...occ.genres]));

      // Secondary genres for fallback broadening
      const allSecondary = Array.from(new Set([
        ...(atm.secondaryGenres || []),
        ...(occ.secondaryGenres || []),
      ]));

      // Combined exclusion list for hard filtering
      const hardExclusions = new Set([
        ...(atm.excludeGenres || []),
        ...(occ.excludeGenres || []),
      ]);

      const merged = new Map<number, Movie>();
      const addAll = (list: Movie[]) => {
        list.forEach(m => {
          if (!m?.id) return;
          // Hard genre exclusion filter — skip movies with any excluded genre
          if (hardExclusions.size > 0) {
            const movieGenres = new Set(m.genre_ids || []);
            const hasExcluded = [...hardExclusions].some(g => movieGenres.has(g));
            if (hasExcluded) return;
          }
          // Hard quality floor — skip obvious junk
          if ((m.vote_average || 0) < 4.0 && (m.vote_count || 0) > 100) return;
          if (!merged.has(m.id)) merged.set(m.id, m);
        });
      };

      const genreAnd = sharedPrimary.length > 0
        ? sharedPrimary.join(',')   // AND (comma = all must match) — highest precision
        : allPrimary.join('|');     // OR (pipe = any match) — used if no shared primary

      const genreOr = allPrimary.join('|'); // OR fallback

      // ── TIER 1: Shared primary genres + era + style (highest precision) ──────
      setLoadingStage('Finding exact mood matches…');
      if (sharedPrimary.length > 0) {
        addAll(await runDiscover({
          with_genres: sharedPrimary.join(','),
          sort_by: style.sortBy,
          vote_count_gte: style.voteCountGte,
          vote_count_lte: style.voteCountLte || undefined,
          vote_average_gte: style.minRating,
          primary_release_date_gte: era.gte || undefined,
          primary_release_date_lte: era.lte || undefined,
        }, [1, 2, 3]));
      }

      // ── TIER 2: All primary genres OR + era + style quality floor ────────────
      if (merged.size < MIN_RESULTS_STRICT) {
        setLoadingStage('Expanding to genre matches…');
        addAll(await runDiscover({
          with_genres: genreOr,
          sort_by: style.sortBy,
          vote_count_gte: style.voteCountGte,
          vote_count_lte: style.voteCountLte || undefined,
          vote_average_gte: style.minRating,
          primary_release_date_gte: era.gte || undefined,
          primary_release_date_lte: era.lte || undefined,
        }, [1, 2, 3]));
      }

      // ── TIER 3: Atmosphere primary + era only (drop occasion constraint) ─────
      if (merged.size < MIN_RESULTS_STRICT) {
        setLoadingStage('Broadening atmosphere search…');
        addAll(await runDiscover({
          with_genres: atm.genres.join('|'),
          sort_by: style.sortBy,
          vote_count_gte: Math.max(style.voteCountGte / 2, 100),
          vote_average_gte: Math.max(style.minRating - 0.5, 5.5),
          primary_release_date_gte: era.gte || undefined,
          primary_release_date_lte: era.lte || undefined,
        }, [1, 2]));
      }

      // ── TIER 4: Secondary genres + era (drop primary genre constraint) ────────
      if (merged.size < MIN_RESULTS_STRICT && allSecondary.length > 0) {
        setLoadingStage('Searching complementary genres…');
        addAll(await runDiscover({
          with_genres: allSecondary.join('|'),
          sort_by: style.sortBy,
          vote_count_gte: Math.max(style.voteCountGte / 3, 100),
          vote_average_gte: Math.max(style.minRating - 0.5, 5.5),
          primary_release_date_gte: era.gte || undefined,
          primary_release_date_lte: era.lte || undefined,
        }, [1, 2]));
      }

      // ── TIER 5: Atmosphere primary only — drop era, keep quality ────────────
      if (merged.size < MIN_RESULTS_FALLBACK) {
        setLoadingStage('Widening the search net…');
        addAll(await runDiscover({
          with_genres: atm.genres.join('|'),
          sort_by: 'vote_average.desc',
          vote_count_gte: 500,
          vote_average_gte: 6.0,
        }, [1, 2]));
      }

      // ── TIER 6: Absolute fallback — popular era films with min quality ───────
      if (merged.size < MIN_RESULTS_FALLBACK) {
        setLoadingStage('Applying quality picks fallback…');
        addAll(await runDiscover({
          sort_by: 'vote_average.desc',
          vote_count_gte: 1000,
          vote_average_gte: 7.0,
          primary_release_date_gte: era.gte || undefined,
          primary_release_date_lte: era.lte || undefined,
        }, [1]));
      }

      setLoadingStage('Ranking your results…');

      // ── SCORING & RANKING ────────────────────────────────────────────────────
      const scored: ScoredMovie[] = Array.from(merged.values())
        .map(m => ({ ...m, _score: scoreMovie(m, atm, occ, style.minRating) }))
        // Filter out hard-negative scores (excluded genres, bad quality)
        .filter(m => m._score > -100)
        .sort((a, b) => b._score - a._score)
        .slice(0, TARGET_POOL);

      setPool(scored);
      setResults(pickDisplay(scored));
      setPhase('results');
      setLoadingStage('');

      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 70,
          startVelocity: 30,
          origin: { y: 0.25 },
          colors: [activeGlow.primary, '#f5f5f5', activeGlow.secondary],
        });
      }, 150);
    } catch (err) {
      console.error('Finder discovery failed', err);
      setError('Something interrupted the search reel. Please try again.');
      setPhase('results');
      setLoadingStage('');
    }
  };

  // Top picks are fixed; tail reshuffles for fresh discoveries on each click
  const pickDisplay = (source: ScoredMovie[]): ScoredMovie[] => {
    const top = source.slice(0, 16);
    const rest = [...source.slice(16)].sort(() => Math.random() - 0.5).slice(0, 8);
    return [...top, ...rest];
  };

  const shuffleResults = () => setResults(pickDisplay(pool));

  const currentMeta = STEP_META[step];
  const progressPct = phase === 'wizard' ? ((step + 1) / STEP_META.length) * 100 : 100;

  const summaryChips = useMemo(() => {
    const chips: { label: string; icon: AnyFinderOption['icon'] }[] = [];
    const atm = ATMOSPHERE_OPTIONS.find(o => o.id === selections.atmosphere);
    const occ = OCCASION_OPTIONS.find(o => o.id === selections.occasion);
    const era = ERA_OPTIONS.find(o => o.id === selections.era);
    const style = STYLE_OPTIONS.find(o => o.id === selections.style);
    if (atm) chips.push({ label: atm.label, icon: atm.icon });
    if (occ) chips.push({ label: occ.label, icon: occ.icon });
    if (era) chips.push({ label: era.label, icon: era.icon });
    if (style) chips.push({ label: style.label, icon: style.icon });
    return chips;
  }, [selections]);

  const topMatch = results[0];
  const remainingMatches = results.slice(1);

  const gridCols =
    step === 0 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' :
    step === 1 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' :
    step === 2 ? 'grid-cols-2 sm:grid-cols-4' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  const loadingMessages = [
    'Scanning atmosphere, occasion, era & style…',
    'Filtering by genre precision & mood alignment…',
    'Applying quality scoring & ranking…',
  ];

  return (
    <div ref={topRef} className="min-h-screen px-3.5 sm:px-6 pt-20 sm:pt-28 pb-24 sm:pb-20 bg-[var(--bg)] relative overflow-hidden text-[var(--text)]">
      {/* ── AMBIENT DYNAMIC BACKGROUND GLOW ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[var(--bg)] to-black" />
        <motion.div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[500px] rounded-full blur-[140px] pointer-events-none"
          animate={{ backgroundColor: activeGlow.primary, opacity: 0.65 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="absolute top-1/3 -left-40 w-[520px] h-[460px] rounded-full blur-[160px] pointer-events-none"
          animate={{ backgroundColor: activeGlow.secondary, opacity: 0.45 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="absolute bottom-10 -right-40 w-[550px] h-[460px] rounded-full blur-[160px] pointer-events-none"
          animate={{ backgroundColor: activeGlow.primary, opacity: 0.35 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: `radial-gradient(rgba(255,255,255,0.5) 1px, transparent 0)`, backgroundSize: '30px 30px' }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {phase !== 'results' && (
          <div className="min-h-[calc(100dvh-11rem)] py-4 sm:py-8 flex flex-col justify-center">
            {/* ── PROGRESS HEADER ── */}
            <div className="max-w-2xl mx-auto w-full mb-6 sm:mb-10">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  <Compass className="w-3.5 h-3.5" />
                  Movie Finder
                </span>
                {phase === 'wizard' && (
                  <span className="text-[11px] font-bold tracking-[0.18em] text-white/50 tabular-nums">
                    {String(step + 1).padStart(2, '0')} / {String(STEP_META.length).padStart(2, '0')}
                  </span>
                )}
              </div>
              <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${progressPct}%`, backgroundColor: activeGlow.primary }}
                  transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                />
              </div>
            </div>

            {/* ── WIZARD STEPS ── */}
            {phase === 'wizard' && (
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-5xl mx-auto w-full"
                >
                  <div className="flex items-center gap-3 mb-2 sm:mb-3">
                    <button
                      onClick={goBack}
                      disabled={step === 0}
                      className={`flex items-center gap-1 px-2.5 py-1.5 -ml-2.5 rounded-lg text-xs font-semibold text-white/50 hover:text-white transition-colors ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  </div>

                  <div className="text-center mb-5 sm:mb-9">
                    <h1 className="text-2xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight mb-2 text-white">{currentMeta.title}</h1>
                    <p className="text-xs sm:text-sm text-white/60 font-medium">{currentMeta.question}</p>
                  </div>

                  <motion.div variants={gridVariants} initial="hidden" animate="show" className={`grid gap-2.5 sm:gap-3 ${gridCols}`}>
                    {currentMeta.options.map(opt => {
                      const Icon = opt.icon;
                      const isSelected = selections[currentMeta.key] === opt.id;
                      const accent = ACCENT_STYLES[opt.accent];
                      const hasDesc = step === 3;
                      const isHov = hoveredOptionId === opt.id;

                      return (
                        <motion.button
                          key={opt.id}
                          variants={optionVariants}
                          whileHover={{ scale: 1.025 }}
                          whileTap={{ scale: 0.97 }}
                          onMouseEnter={() => setHoveredOptionId(opt.id)}
                          onMouseLeave={() => setHoveredOptionId(null)}
                          onClick={() => selectOption(currentMeta.key, opt.id)}
                          className={`relative flex rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                            hasDesc ? 'flex-row items-start gap-3 sm:gap-3.5 p-4 sm:p-5 text-left' : 'flex-col items-center gap-2 sm:gap-2.5 p-3 sm:p-4 text-center'
                          } ${
                            isSelected
                              ? `${accent.ring} ring-2 bg-white/[0.08] shadow-lg`
                              : isHov
                              ? 'border-white/30 bg-white/[0.05]'
                              : 'border-white/10 bg-white/[0.02]'
                          }`}
                        >
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                              className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                              style={{ background: activeGlow.primary }}
                            >
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </motion.span>
                          )}
                          <div className={`p-2 sm:p-2.5 rounded-xl border shrink-0 transition-transform duration-300 ${accent.badge} ${isHov ? 'scale-110' : ''}`}>
                            <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${accent.icon}`} />
                          </div>
                          <div className={hasDesc ? 'flex-1 min-w-0' : ''}>
                            <span className="text-xs sm:text-sm font-bold block text-white">{opt.label}</span>
                            {opt.sub && <span className="text-[10px] text-white/50 font-medium block mt-0.5">{opt.sub}</span>}
                            {opt.desc && <span className="text-[11px] text-white/60 font-medium block mt-1 leading-relaxed">{opt.desc}</span>}
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* ── LOADING STATE with animated stage text ── */}
            {phase === 'loading' && (
              <div className="flex flex-col items-center justify-center text-center py-10 gap-5">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/70"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
                  />
                  <Film className="w-6 h-6 text-white/70" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">
                    Building Your Perfect Reel
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingStage}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                      className="text-[11px] text-white/50 font-medium min-h-[16px]"
                    >
                      {loadingStage || loadingMessages[0]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 mt-6 w-full max-w-3xl">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[2/3] rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse"
                      style={{ animationDelay: `${i * 60}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && (
          <div ref={resultsRef} className="pt-2 sm:pt-6 space-y-8 sm:space-y-12">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-white/60" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-white/60">Your Custom Reel</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {summaryChips.map(chip => {
                    const Icon = chip.icon;
                    return (
                      <span key={chip.label} className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-200 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <Icon className="w-3.5 h-3.5 text-white/70" />
                        {chip.label}
                      </span>
                    );
                  })}
                  {results.length > 0 && (
                    <span className="text-xs font-bold text-gray-300 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
                      <Film className="w-3.5 h-3.5 text-white/70" />
                      {results.length} Matches
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={shuffleResults}
                  disabled={pool.length <= 16}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs font-bold hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Shuffle Picks
                </button>
                <button
                  onClick={startOver}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
                  style={{ background: activeGlow.primary }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Start Over
                </button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-xl mx-auto text-center backdrop-blur-md">
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-bold mb-2">
                  <AlertCircle className="w-5 h-5" />
                  Search Interrupted
                </div>
                <p className="text-xs text-gray-300">{error}</p>
              </div>
            )}

            {/* Top Featured Pick */}
            {!error && topMatch && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">Top Pick For You</h3>
                </div>
                <MoodFeaturedCard
                  movie={topMatch}
                  isFav={favIds.includes(topMatch.id)}
                  isWatchlisted={watchlistIds.includes(topMatch.id)}
                  accentGlow={activeGlow}
                />
              </div>
            )}

            {/* Remaining Grid */}
            {!error && remainingMatches.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-white/60" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/60">More Matches</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-6">
                  {remainingMatches.map((movie, i) => (
                    <MoodMovieCard
                      key={movie.id}
                      movie={movie}
                      index={i + 1}
                      isFav={favIds.includes(movie.id)}
                      isWatchlisted={watchlistIds.includes(movie.id)}
                      isWatched={watchedIds.includes(movie.id)}
                      accentGlow={activeGlow}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!error && results.length === 0 && (
              <div className="py-20 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                  <Film className="w-8 h-8 text-white/50" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">No Matches Found</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  That combination was too rare, even for us. Try a different era or style.
                </p>
                <button
                  onClick={startOver}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-lg hover:scale-105 active:scale-95"
                  style={{ background: activeGlow.primary }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
