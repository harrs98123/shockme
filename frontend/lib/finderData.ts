// Data & types for the "Movie Finder" 4-step wizard (app/finder)

import {
  Smile,
  CloudDrizzle,
  Zap,
  Coffee,
  Ghost,
  Brain,
  Heart,
  Clock3,
  MoonStar,
  Sunrise,
  Flame,
  Wand2,
  Users,
  User,
  PartyPopper,
  CloudRain,
  UtensilsCrossed,
  BookOpen,
  Dumbbell,
  Thermometer,
  Rocket,
  Disc3,
  Tv,
  Film,
  TrendingUp,
  Gem,
  Shuffle,
  type LucideIcon,
} from 'lucide-react';

export const GENRE = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MUSIC: 10402,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIENCE_FICTION: 878,
  THRILLER: 53,
  WAR: 10752,
  WESTERN: 37,
} as const;

// A fixed palette of fully-literal utility classes so Tailwind's scanner
// always finds the complete token (no partial string interpolation).
export type Accent =
  | 'amber' | 'sky' | 'orange' | 'teal' | 'violet' | 'indigo' | 'rose'
  | 'slate' | 'yellow' | 'red' | 'fuchsia' | 'emerald' | 'blue' | 'cyan' | 'green';

export const ACCENT_STYLES: Record<Accent, { icon: string; badge: string; ring: string }> = {
  amber: { icon: 'text-amber-300', badge: 'bg-amber-500/10 border-amber-500/20', ring: 'ring-amber-400/60 border-amber-400/50' },
  sky: { icon: 'text-sky-300', badge: 'bg-sky-500/10 border-sky-500/20', ring: 'ring-sky-400/60 border-sky-400/50' },
  orange: { icon: 'text-orange-300', badge: 'bg-orange-500/10 border-orange-500/20', ring: 'ring-orange-400/60 border-orange-400/50' },
  teal: { icon: 'text-teal-300', badge: 'bg-teal-500/10 border-teal-500/20', ring: 'ring-teal-400/60 border-teal-400/50' },
  violet: { icon: 'text-violet-300', badge: 'bg-violet-500/10 border-violet-500/20', ring: 'ring-violet-400/60 border-violet-400/50' },
  indigo: { icon: 'text-indigo-300', badge: 'bg-indigo-500/10 border-indigo-500/20', ring: 'ring-indigo-400/60 border-indigo-400/50' },
  rose: { icon: 'text-rose-300', badge: 'bg-rose-500/10 border-rose-500/20', ring: 'ring-rose-400/60 border-rose-400/50' },
  slate: { icon: 'text-slate-300', badge: 'bg-slate-500/10 border-slate-500/20', ring: 'ring-slate-400/60 border-slate-400/50' },
  yellow: { icon: 'text-yellow-300', badge: 'bg-yellow-500/10 border-yellow-500/20', ring: 'ring-yellow-400/60 border-yellow-400/50' },
  red: { icon: 'text-red-300', badge: 'bg-red-500/10 border-red-500/20', ring: 'ring-red-400/60 border-red-400/50' },
  fuchsia: { icon: 'text-fuchsia-300', badge: 'bg-fuchsia-500/10 border-fuchsia-500/20', ring: 'ring-fuchsia-400/60 border-fuchsia-400/50' },
  emerald: { icon: 'text-emerald-300', badge: 'bg-emerald-500/10 border-emerald-500/20', ring: 'ring-emerald-400/60 border-emerald-400/50' },
  blue: { icon: 'text-blue-300', badge: 'bg-blue-500/10 border-blue-500/20', ring: 'ring-blue-400/60 border-blue-400/50' },
  cyan: { icon: 'text-cyan-300', badge: 'bg-cyan-500/10 border-cyan-500/20', ring: 'ring-cyan-400/60 border-cyan-400/50' },
  green: { icon: 'text-green-300', badge: 'bg-green-500/10 border-green-500/20', ring: 'ring-green-400/60 border-green-400/50' },
};

export interface GlowConfig {
  primary: string;
  secondary: string;
  badge: string;
  border: string;
  shadow: string;
}

export const DEFAULT_GLOW: GlowConfig = {
  primary: '#7c3aed',
  secondary: '#4f46e5',
  badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  border: 'rgba(124, 58, 237, 0.35)',
  shadow: 'rgba(124, 58, 237, 0.25)',
};

export const GENRE_GLOW_MAP: Record<string, GlowConfig> = {
  scary: { primary: '#dc2626', secondary: '#7f1d1d', badge: 'bg-red-500/15 text-red-400 border-red-500/30', border: 'rgba(220, 38, 38, 0.45)', shadow: 'rgba(220, 38, 38, 0.3)' },
  happy: { primary: '#f59e0b', secondary: '#b45309', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', border: 'rgba(245, 158, 11, 0.45)', shadow: 'rgba(245, 158, 11, 0.3)' },
  sad: { primary: '#0284c7', secondary: '#1e3a8a', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30', border: 'rgba(2, 132, 199, 0.45)', shadow: 'rgba(2, 132, 199, 0.3)' },
  exciting: { primary: '#ea580c', secondary: '#9a3412', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', border: 'rgba(234, 88, 12, 0.45)', shadow: 'rgba(234, 88, 12, 0.3)' },
  relaxed: { primary: '#0d9488', secondary: '#065f46', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30', border: 'rgba(13, 148, 136, 0.45)', shadow: 'rgba(13, 148, 136, 0.3)' },
  'thought-provoking': { primary: '#6366f1', secondary: '#312e81', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', border: 'rgba(99, 102, 241, 0.45)', shadow: 'rgba(99, 102, 241, 0.3)' },
  romantic: { primary: '#e11d48', secondary: '#881337', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30', border: 'rgba(225, 29, 72, 0.45)', shadow: 'rgba(225, 29, 72, 0.3)' },
  nostalgic: { primary: '#d97706', secondary: '#78350f', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', border: 'rgba(217, 119, 6, 0.45)', shadow: 'rgba(217, 119, 6, 0.3)' },
  dark: { primary: '#581c87', secondary: '#31105e', badge: 'bg-purple-900/30 text-purple-300 border-purple-500/30', border: 'rgba(88, 28, 135, 0.45)', shadow: 'rgba(88, 28, 135, 0.3)' },
  inspirational: { primary: '#eab308', secondary: '#713f12', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30', border: 'rgba(234, 179, 8, 0.45)', shadow: 'rgba(234, 179, 8, 0.3)' },
  intense: { primary: '#ef4444', secondary: '#991b1b', badge: 'bg-red-500/15 text-red-400 border-red-500/30', border: 'rgba(239, 68, 68, 0.45)', shadow: 'rgba(239, 68, 68, 0.3)' },
  whimsical: { primary: '#d946ef', secondary: '#701a75', badge: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30', border: 'rgba(217, 70, 239, 0.45)', shadow: 'rgba(217, 70, 239, 0.3)' },
  'date-night': { primary: '#e11d48', secondary: '#881337', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30', border: 'rgba(225, 29, 72, 0.45)', shadow: 'rgba(225, 29, 72, 0.3)' },
  'family-movie-night': { primary: '#10b981', secondary: '#064e3b', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', border: 'rgba(16, 185, 129, 0.45)', shadow: 'rgba(16, 185, 129, 0.3)' },
  'solo-watch': { primary: '#6366f1', secondary: '#312e81', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', border: 'rgba(99, 102, 241, 0.45)', shadow: 'rgba(99, 102, 241, 0.3)' },
  'friends-hangout': { primary: '#f97316', secondary: '#7c2d12', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30', border: 'rgba(249, 115, 22, 0.45)', shadow: 'rgba(249, 115, 22, 0.3)' },
  'rainy-day': { primary: '#3b82f6', secondary: '#1e3a8a', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30', border: 'rgba(59, 130, 246, 0.45)', shadow: 'rgba(59, 130, 246, 0.3)' },
  'late-night': { primary: '#8b5cf6', secondary: '#4c1d95', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30', border: 'rgba(139, 92, 246, 0.45)', shadow: 'rgba(139, 92, 246, 0.3)' },
  'dinner-party': { primary: '#f59e0b', secondary: '#78350f', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', border: 'rgba(245, 158, 11, 0.45)', shadow: 'rgba(245, 158, 11, 0.3)' },
  'study-break': { primary: '#14b8a6', secondary: '#134e4a', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30', border: 'rgba(20, 184, 166, 0.45)', shadow: 'rgba(20, 184, 166, 0.3)' },
  workout: { primary: '#ef4444', secondary: '#7f1d1d', badge: 'bg-red-500/15 text-red-300 border-red-500/30', border: 'rgba(239, 68, 68, 0.45)', shadow: 'rgba(239, 68, 68, 0.3)' },
  'sick-day': { primary: '#06b6d4', secondary: '#164e63', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', border: 'rgba(6, 182, 212, 0.45)', shadow: 'rgba(6, 182, 212, 0.3)' },
};

export interface BaseOption {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: Accent;
}

export interface WizardOption extends BaseOption {
  /** Primary genres that strongly define this vibe (high weight in scoring) */
  genres: number[];
  /** Secondary / complementary genres that enhance the vibe (medium weight) */
  secondaryGenres?: number[];
  /** Genre IDs that should NEVER appear in results for this mood */
  excludeGenres?: number[];
  /** Minimum vote_average to consider quality threshold */
  minRating?: number;
}

// --- ATMOSPHERE OPTIONS ---
// Each entry now has richer genre coverage + explicit exclusions.
export const ATMOSPHERE_OPTIONS: WizardOption[] = [
  {
    id: 'happy',
    label: 'Happy',
    icon: Smile,
    genres: [GENRE.COMEDY, GENRE.FAMILY],
    secondaryGenres: [GENRE.ANIMATION, GENRE.ROMANCE, GENRE.ADVENTURE],
    excludeGenres: [GENRE.HORROR, GENRE.THRILLER, GENRE.CRIME, GENRE.WAR],
    minRating: 6.0,
    accent: 'amber',
  },
  {
    id: 'sad',
    label: 'Sad',
    icon: CloudDrizzle,
    genres: [GENRE.DRAMA],
    secondaryGenres: [GENRE.ROMANCE, GENRE.HISTORY],
    excludeGenres: [GENRE.COMEDY, GENRE.ANIMATION, GENRE.ACTION],
    minRating: 6.5,
    accent: 'sky',
  },
  {
    id: 'exciting',
    label: 'Exciting',
    icon: Zap,
    genres: [GENRE.ACTION, GENRE.ADVENTURE],
    secondaryGenres: [GENRE.SCIENCE_FICTION, GENRE.THRILLER, GENRE.CRIME],
    excludeGenres: [GENRE.DOCUMENTARY],
    minRating: 6.0,
    accent: 'orange',
  },
  {
    id: 'relaxed',
    label: 'Relaxed',
    icon: Coffee,
    genres: [GENRE.ANIMATION, GENRE.COMEDY],
    secondaryGenres: [GENRE.FAMILY, GENRE.ROMANCE, GENRE.ADVENTURE],
    excludeGenres: [GENRE.HORROR, GENRE.THRILLER, GENRE.CRIME, GENRE.WAR],
    minRating: 6.0,
    accent: 'teal',
  },
  {
    id: 'scary',
    label: 'Scary',
    icon: Ghost,
    genres: [GENRE.HORROR, GENRE.THRILLER],
    secondaryGenres: [GENRE.MYSTERY, GENRE.CRIME],
    excludeGenres: [GENRE.COMEDY, GENRE.FAMILY, GENRE.ANIMATION, GENRE.ROMANCE],
    minRating: 5.5,
    accent: 'violet',
  },
  {
    id: 'thought-provoking',
    label: 'Thought-provoking',
    icon: Brain,
    genres: [GENRE.DRAMA, GENRE.MYSTERY],
    secondaryGenres: [GENRE.SCIENCE_FICTION, GENRE.THRILLER, GENRE.HISTORY, GENRE.DOCUMENTARY],
    excludeGenres: [GENRE.COMEDY, GENRE.ACTION, GENRE.ANIMATION],
    minRating: 7.0,
    accent: 'indigo',
  },
  {
    id: 'romantic',
    label: 'Romantic',
    icon: Heart,
    genres: [GENRE.ROMANCE, GENRE.DRAMA],
    secondaryGenres: [GENRE.COMEDY],
    excludeGenres: [GENRE.HORROR, GENRE.THRILLER, GENRE.CRIME, GENRE.ACTION, GENRE.WAR],
    minRating: 6.0,
    accent: 'rose',
  },
  {
    id: 'nostalgic',
    label: 'Nostalgic',
    icon: Clock3,
    genres: [GENRE.DRAMA, GENRE.FAMILY],
    secondaryGenres: [GENRE.COMEDY, GENRE.ROMANCE, GENRE.ADVENTURE, GENRE.ANIMATION],
    excludeGenres: [GENRE.HORROR],
    minRating: 6.5,
    accent: 'amber',
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: MoonStar,
    genres: [GENRE.THRILLER, GENRE.CRIME],
    secondaryGenres: [GENRE.DRAMA, GENRE.MYSTERY, GENRE.HORROR],
    excludeGenres: [GENRE.COMEDY, GENRE.FAMILY, GENRE.ANIMATION, GENRE.ROMANCE],
    minRating: 6.5,
    accent: 'slate',
  },
  {
    id: 'inspirational',
    label: 'Inspirational',
    icon: Sunrise,
    genres: [GENRE.DRAMA, GENRE.HISTORY],
    secondaryGenres: [GENRE.DOCUMENTARY, GENRE.ADVENTURE, GENRE.FAMILY],
    excludeGenres: [GENRE.HORROR, GENRE.THRILLER],
    minRating: 7.0,
    accent: 'yellow',
  },
  {
    id: 'intense',
    label: 'Intense',
    icon: Flame,
    genres: [GENRE.THRILLER, GENRE.ACTION],
    secondaryGenres: [GENRE.CRIME, GENRE.DRAMA, GENRE.WAR],
    excludeGenres: [GENRE.COMEDY, GENRE.ANIMATION, GENRE.FAMILY, GENRE.ROMANCE],
    minRating: 6.5,
    accent: 'red',
  },
  {
    id: 'whimsical',
    label: 'Whimsical',
    icon: Wand2,
    genres: [GENRE.FANTASY, GENRE.ANIMATION],
    secondaryGenres: [GENRE.FAMILY, GENRE.ADVENTURE, GENRE.COMEDY],
    excludeGenres: [GENRE.HORROR, GENRE.THRILLER, GENRE.CRIME, GENRE.WAR],
    minRating: 6.0,
    accent: 'fuchsia',
  },
];

// --- OCCASION OPTIONS ---
export const OCCASION_OPTIONS: WizardOption[] = [
  {
    id: 'date-night',
    label: 'Date Night',
    icon: Heart,
    genres: [GENRE.ROMANCE, GENRE.COMEDY],
    secondaryGenres: [GENRE.DRAMA, GENRE.ADVENTURE],
    excludeGenres: [GENRE.HORROR, GENRE.CRIME, GENRE.WAR],
    minRating: 6.5,
    accent: 'rose',
  },
  {
    id: 'family-movie-night',
    label: 'Family Movie Night',
    icon: Users,
    genres: [GENRE.FAMILY, GENRE.ANIMATION],
    secondaryGenres: [GENRE.COMEDY, GENRE.ADVENTURE, GENRE.FANTASY],
    excludeGenres: [GENRE.HORROR, GENRE.THRILLER, GENRE.CRIME, GENRE.WAR],
    minRating: 6.0,
    accent: 'emerald',
  },
  {
    id: 'solo-watch',
    label: 'Solo Watch',
    icon: User,
    genres: [GENRE.DRAMA, GENRE.MYSTERY],
    secondaryGenres: [GENRE.THRILLER, GENRE.SCIENCE_FICTION, GENRE.CRIME],
    minRating: 6.5,
    accent: 'indigo',
  },
  {
    id: 'friends-hangout',
    label: 'Friends Hangout',
    icon: PartyPopper,
    genres: [GENRE.COMEDY, GENRE.ACTION],
    secondaryGenres: [GENRE.ADVENTURE, GENRE.CRIME, GENRE.SCIENCE_FICTION],
    excludeGenres: [GENRE.DOCUMENTARY],
    minRating: 6.0,
    accent: 'orange',
  },
  {
    id: 'rainy-day',
    label: 'Rainy Day',
    icon: CloudRain,
    genres: [GENRE.DRAMA, GENRE.ROMANCE],
    secondaryGenres: [GENRE.MYSTERY, GENRE.COMEDY, GENRE.FANTASY],
    excludeGenres: [GENRE.ACTION, GENRE.WAR],
    minRating: 6.5,
    accent: 'blue',
  },
  {
    id: 'late-night',
    label: 'Late Night',
    icon: MoonStar,
    genres: [GENRE.THRILLER, GENRE.HORROR],
    secondaryGenres: [GENRE.MYSTERY, GENRE.CRIME, GENRE.SCIENCE_FICTION],
    excludeGenres: [GENRE.FAMILY, GENRE.ANIMATION, GENRE.COMEDY],
    minRating: 6.0,
    accent: 'violet',
  },
  {
    id: 'dinner-party',
    label: 'Dinner Party',
    icon: UtensilsCrossed,
    genres: [GENRE.COMEDY, GENRE.DRAMA],
    secondaryGenres: [GENRE.ROMANCE, GENRE.CRIME],
    excludeGenres: [GENRE.HORROR, GENRE.WAR],
    minRating: 6.5,
    accent: 'amber',
  },
  {
    id: 'study-break',
    label: 'Study Break',
    icon: BookOpen,
    genres: [GENRE.COMEDY, GENRE.ANIMATION],
    secondaryGenres: [GENRE.ADVENTURE, GENRE.FAMILY, GENRE.SCIENCE_FICTION],
    excludeGenres: [GENRE.HORROR, GENRE.THRILLER, GENRE.WAR],
    minRating: 6.0,
    accent: 'teal',
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: Dumbbell,
    genres: [GENRE.ACTION, GENRE.ADVENTURE],
    secondaryGenres: [GENRE.SCIENCE_FICTION, GENRE.THRILLER, GENRE.CRIME],
    excludeGenres: [GENRE.DOCUMENTARY, GENRE.ROMANCE],
    minRating: 6.0,
    accent: 'red',
  },
  {
    id: 'sick-day',
    label: 'Sick Day',
    icon: Thermometer,
    genres: [GENRE.COMEDY, GENRE.FAMILY],
    secondaryGenres: [GENRE.ANIMATION, GENRE.ADVENTURE, GENRE.ROMANCE],
    excludeGenres: [GENRE.HORROR, GENRE.THRILLER, GENRE.CRIME, GENRE.WAR],
    minRating: 6.0,
    accent: 'cyan',
  },
];

export interface EraOption extends BaseOption {
  sub: string;
  gte: string;
  lte: string;
}

export const ERA_OPTIONS: EraOption[] = [
  { id: 'modern', label: 'Modern', sub: '2010 — Now', icon: Rocket, gte: '2010-01-01', lte: '', accent: 'violet' },
  { id: '2000s', label: '2000s', sub: '2000 — 2009', icon: Disc3, gte: '2000-01-01', lte: '2009-12-31', accent: 'blue' },
  { id: '90s', label: '90s', sub: '1990 — 1999', icon: Tv, gte: '1990-01-01', lte: '1999-12-31', accent: 'teal' },
  { id: 'classic', label: 'Classic', sub: 'Pre-1990', icon: Film, gte: '', lte: '1989-12-31', accent: 'amber' },
];

export interface StyleOption extends BaseOption {
  desc: string;
  sortBy: string;
  voteCountGte: number;
  voteCountLte: number;
  minRating: number;
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'blockbuster',
    label: 'Blockbuster',
    desc: 'Big hits everyone already loves',
    icon: TrendingUp,
    sortBy: 'popularity.desc',
    voteCountGte: 2000,
    voteCountLte: 0,
    minRating: 6.5,
    accent: 'amber',
  },
  {
    id: 'hidden-gem',
    label: 'Hidden Gem',
    desc: 'Underrated finds few have seen',
    icon: Gem,
    sortBy: 'vote_average.desc',
    voteCountGte: 200,
    voteCountLte: 8000,
    minRating: 7.0,
    accent: 'emerald',
  },
  {
    id: 'any',
    label: 'Any',
    desc: 'Surprise me with the best of both',
    icon: Shuffle,
    sortBy: 'vote_average.desc',
    voteCountGte: 300,
    voteCountLte: 0,
    minRating: 6.0,
    accent: 'fuchsia',
  },
];

export interface FinderSelections {
  atmosphere?: string;
  occasion?: string;
  era?: string;
  style?: string;
}

// Union view of every option shape, used wherever a step renders options generically.
export interface AnyFinderOption extends BaseOption {
  genres?: number[];
  secondaryGenres?: number[];
  excludeGenres?: number[];
  minRating?: number;
  sub?: string;
  gte?: string;
  lte?: string;
  desc?: string;
  sortBy?: string;
  voteCountGte?: number;
  voteCountLte?: number;
}

export interface FinderStep {
  key: keyof FinderSelections;
  title: string;
  question: string;
  options: AnyFinderOption[];
}

export const STEP_META: FinderStep[] = [
  { key: 'atmosphere', title: 'The Atmosphere', question: 'What feeling should this movie give you?', options: ATMOSPHERE_OPTIONS },
  { key: 'occasion', title: 'The Occasion', question: "What's the occasion tonight?", options: OCCASION_OPTIONS },
  { key: 'era', title: 'The Era', question: 'Which era should we pull films from?', options: ERA_OPTIONS },
  { key: 'style', title: 'The Style', question: 'Blockbuster hit, or hidden gem?', options: STYLE_OPTIONS },
];
