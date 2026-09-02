import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Compass,
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
  Rocket,
  Disc3,
  Tv,
  Film,
  RotateCcw,
  Shuffle,
  ChevronLeft,
  Gem,
  Award,
  Check,
  TrendingUp,
  UtensilsCrossed,
  BookOpen,
  Dumbbell,
  Thermometer,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
} from 'react-native-reanimated';

import { moviesApi } from '@/api/movies';
import { useAuth } from '@/hooks/useAuth';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { getEnglishTitle } from '@/lib/format';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { PlotmintLogo } from '@/components/ui/PlotmintLogo';
import { Avatar } from '@/components/avatar/Avatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - CARD_GAP) / 2;
const POSTER_WIDTH = (SCREEN_WIDTH - PADDING * 2 - CARD_GAP) / 2;
const POSTER_HEIGHT = Math.round(POSTER_WIDTH * 1.5);

// ─── Theme Ambient Gradient Colors for Every Selection ───────────────────────

interface ThemePalette {
  primary: string;
  secondary: string;
  bgColors: [string, string, string];
  cardBg: string;
  cardBorder: string;
}

const THEME_PALETTES: Record<string, ThemePalette> = {
  // Default Royal Purple
  default: {
    primary: '#C084FC',
    secondary: '#A855F7',
    bgColors: ['#281654', '#170B36', '#0B041C'],
    cardBg: 'rgba(255, 255, 255, 0.07)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
  },
  // Happy / Warm Gold
  happy: {
    primary: '#FBBF24',
    secondary: '#D97706',
    bgColors: ['#3A2406', '#221402', '#0E0700'],
    cardBg: 'rgba(251, 191, 36, 0.08)',
    cardBorder: 'rgba(251, 191, 36, 0.18)',
  },
  // Sad / Rainy Blue
  sad: {
    primary: '#38BDF8',
    secondary: '#0284C7',
    bgColors: ['#0A2D4A', '#051A2E', '#020C17'],
    cardBg: 'rgba(56, 189, 248, 0.08)',
    cardBorder: 'rgba(56, 189, 248, 0.18)',
  },
  // Exciting / Action Orange
  exciting: {
    primary: '#FB923C',
    secondary: '#EA580C',
    bgColors: ['#3D1705', '#240C02', '#0E0400'],
    cardBg: 'rgba(251, 146, 60, 0.08)',
    cardBorder: 'rgba(251, 146, 60, 0.18)',
  },
  // Relaxed / Family (Deep Emerald Teal - As seen in Screenshot 1)
  relaxed: {
    primary: '#2DD4BF',
    secondary: '#0D9488',
    bgColors: ['#083F35', '#04261F', '#02130F'],
    cardBg: 'rgba(45, 212, 191, 0.08)',
    cardBorder: 'rgba(45, 212, 191, 0.18)',
  },
  // Scary / Horror Crimson
  scary: {
    primary: '#F87171',
    secondary: '#DC2626',
    bgColors: ['#3D0B0B', '#240404', '#0F0101'],
    cardBg: 'rgba(248, 113, 113, 0.08)',
    cardBorder: 'rgba(248, 113, 113, 0.18)',
  },
  // Thought-provoking / Solo Indigo
  'thought-provoking': {
    primary: '#818CF8',
    secondary: '#6366F1',
    bgColors: ['#1C1852', '#0E0B32', '#050418'],
    cardBg: 'rgba(129, 140, 248, 0.08)',
    cardBorder: 'rgba(129, 140, 248, 0.18)',
  },
  // Romantic / Date Night Velvet Rose
  romantic: {
    primary: '#FB7185',
    secondary: '#E11D48',
    bgColors: ['#3D0A1E', '#250412', '#0F0106'],
    cardBg: 'rgba(251, 113, 133, 0.08)',
    cardBorder: 'rgba(251, 113, 133, 0.18)',
  },
  // Nostalgic Amber Sepia
  nostalgic: {
    primary: '#F59E0B',
    secondary: '#B45309',
    bgColors: ['#361F06', '#211202', '#0D0600'],
    cardBg: 'rgba(245, 158, 11, 0.08)',
    cardBorder: 'rgba(245, 158, 11, 0.18)',
  },
  // Dark / Late Night Midnight Violet
  dark: {
    primary: '#C084FC',
    secondary: '#7C3AED',
    bgColors: ['#280C42', '#160428', '#090112'],
    cardBg: 'rgba(192, 132, 252, 0.08)',
    cardBorder: 'rgba(192, 132, 252, 0.18)',
  },
  // Inspirational Sunrise Gold
  inspirational: {
    primary: '#FACC15',
    secondary: '#CA8A04',
    bgColors: ['#382E06', '#211B02', '#0D0A00'],
    cardBg: 'rgba(250, 204, 21, 0.08)',
    cardBorder: 'rgba(250, 204, 21, 0.18)',
  },
  // Intense Fire Red
  intense: {
    primary: '#EF4444',
    secondary: '#B91C1C',
    bgColors: ['#3D0909', '#250303', '#0F0101'],
    cardBg: 'rgba(239, 68, 68, 0.08)',
    cardBorder: 'rgba(239, 68, 68, 0.18)',
  },
  // Whimsical Cosmic Pink
  whimsical: {
    primary: '#F472B6',
    secondary: '#D946EF',
    bgColors: ['#380B3E', '#220427', '#0E0110'],
    cardBg: 'rgba(244, 114, 182, 0.08)',
    cardBorder: 'rgba(244, 114, 182, 0.18)',
  },
  // Family Movie Night (Emerald)
  'family-movie-night': {
    primary: '#34D399',
    secondary: '#10B981',
    bgColors: ['#073B2B', '#042419', '#02120C'],
    cardBg: 'rgba(52, 211, 153, 0.08)',
    cardBorder: 'rgba(52, 211, 153, 0.18)',
  },
};

// ─── Data Definitions ─────────────────────────────────────────────────────────

interface WizardOption {
  id: string;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  genres: number[];
  secondaryGenres?: number[];
  excludeGenres?: number[];
  minRating?: number;
  params?: Record<string, string | number>;
}

// 1. Atmosphere Options (Step 1)
const ATMOSPHERE_OPTIONS: WizardOption[] = [
  {
    id: 'happy',
    label: 'Happy',
    icon: <Smile size={22} color="#EAB308" />,
    color: '#EAB308',
    genres: [35, 10751],
    secondaryGenres: [16, 10749, 12],
    excludeGenres: [27, 53, 80, 10752],
    minRating: 6.0,
  },
  {
    id: 'sad',
    label: 'Sad',
    icon: <CloudDrizzle size={22} color="#38BDF8" />,
    color: '#38BDF8',
    genres: [18],
    secondaryGenres: [10749, 36],
    excludeGenres: [35, 16, 28],
    minRating: 6.5,
  },
  {
    id: 'exciting',
    label: 'Exciting',
    icon: <Zap size={22} color="#F97316" />,
    color: '#F97316',
    genres: [28, 12],
    secondaryGenres: [878, 53, 80],
    excludeGenres: [99],
    minRating: 6.0,
  },
  {
    id: 'relaxed',
    label: 'Relaxed',
    icon: <Coffee size={22} color="#14B8A6" />,
    color: '#14B8A6',
    genres: [16, 35],
    secondaryGenres: [10751, 10749, 12],
    excludeGenres: [27, 53, 80, 10752],
    minRating: 6.0,
  },
  {
    id: 'scary',
    label: 'Scary',
    icon: <Ghost size={22} color="#C084FC" />,
    color: '#C084FC',
    genres: [27, 53],
    secondaryGenres: [9648, 80],
    excludeGenres: [35, 10751, 16, 10749],
    minRating: 5.5,
  },
  {
    id: 'thought-provoking',
    label: 'Thought-provoking',
    icon: <Brain size={22} color="#818CF8" />,
    color: '#818CF8',
    genres: [18, 9648],
    secondaryGenres: [878, 53, 36, 99],
    excludeGenres: [35, 28, 16],
    minRating: 7.0,
  },
  {
    id: 'romantic',
    label: 'Romantic',
    icon: <Heart size={22} color="#F43F5E" />,
    color: '#F43F5E',
    genres: [10749],
    secondaryGenres: [35, 18],
    excludeGenres: [27, 80, 10752],
    minRating: 6.0,
  },
  {
    id: 'nostalgic',
    label: 'Nostalgic',
    icon: <Clock3 size={22} color="#F59E0B" />,
    color: '#F59E0B',
    genres: [12, 10751, 35],
    secondaryGenres: [14, 18, 16],
    excludeGenres: [27, 53],
    minRating: 6.5,
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: <MoonStar size={22} color="#A855F7" />,
    color: '#A855F7',
    genres: [53, 80, 27],
    secondaryGenres: [9648, 18],
    excludeGenres: [10751, 35, 16],
    minRating: 6.5,
  },
  {
    id: 'inspirational',
    label: 'Inspirational',
    icon: <Sunrise size={22} color="#EAB308" />,
    color: '#EAB308',
    genres: [18, 36],
    secondaryGenres: [10402, 10751],
    excludeGenres: [27, 53, 80],
    minRating: 7.0,
  },
  {
    id: 'intense',
    label: 'Intense',
    icon: <Flame size={22} color="#EF4444" />,
    color: '#EF4444',
    genres: [53, 28, 80],
    secondaryGenres: [10752, 9648],
    excludeGenres: [10751, 35, 16],
    minRating: 6.5,
  },
  {
    id: 'whimsical',
    label: 'Whimsical',
    icon: <Wand2 size={22} color="#D946EF" />,
    color: '#D946EF',
    genres: [14, 16],
    secondaryGenres: [12, 10751, 35],
    excludeGenres: [27, 80, 10752],
    minRating: 6.5,
  },
];

// 2. Occasion Options (Step 2 - 10 Options matching Screenshot 1)
const OCCASION_OPTIONS: WizardOption[] = [
  {
    id: 'date-night',
    label: 'Date Night',
    icon: <Heart size={20} color="#F43F5E" />,
    color: '#F43F5E',
    genres: [10749, 35],
    secondaryGenres: [18, 14],
    minRating: 6.2,
  },
  {
    id: 'family-movie-night',
    label: 'Family Movie Night',
    icon: <Users size={20} color="#34D399" />,
    color: '#34D399',
    genres: [10751, 16],
    secondaryGenres: [12, 35, 14],
    excludeGenres: [27, 53, 80, 10752],
    minRating: 6.5,
  },
  {
    id: 'solo-watch',
    label: 'Solo Watch',
    icon: <User size={20} color="#60A5FA" />,
    color: '#60A5FA',
    genres: [18, 9648],
    secondaryGenres: [878, 53, 36],
    minRating: 6.8,
  },
  {
    id: 'friends-hangout',
    label: 'Friends Hangout',
    icon: <PartyPopper size={20} color="#FBBF24" />,
    color: '#FBBF24',
    genres: [35, 28],
    secondaryGenres: [12, 27, 878],
    minRating: 6.0,
  },
  {
    id: 'rainy-day',
    label: 'Rainy Day',
    icon: <CloudRain size={20} color="#38BDF8" />,
    color: '#38BDF8',
    genres: [18, 9648],
    secondaryGenres: [10749, 14, 16],
    minRating: 6.5,
  },
  {
    id: 'late-night',
    label: 'Late Night',
    icon: <MoonStar size={20} color="#A78BFA" />,
    color: '#A78BFA',
    genres: [53, 27],
    secondaryGenres: [878, 9648, 80],
    minRating: 6.2,
  },
  {
    id: 'dinner-party',
    label: 'Dinner Party',
    icon: <UtensilsCrossed size={20} color="#EAB308" />,
    color: '#EAB308',
    genres: [35, 18],
    secondaryGenres: [10749, 14],
    minRating: 6.3,
  },
  {
    id: 'study-break',
    label: 'Study Break',
    icon: <BookOpen size={20} color="#2DD4BF" />,
    color: '#2DD4BF',
    genres: [16, 35],
    secondaryGenres: [12],
    minRating: 6.0,
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: <Dumbbell size={20} color="#F43F5E" />,
    color: '#F43F5E',
    genres: [28, 53],
    secondaryGenres: [12, 80],
    minRating: 6.0,
  },
  {
    id: 'sick-day',
    label: 'Sick Day',
    icon: <Thermometer size={20} color="#38BDF8" />,
    color: '#38BDF8',
    genres: [10751, 16, 35],
    secondaryGenres: [14],
    excludeGenres: [27, 53],
    minRating: 6.5,
  },
];

// 3. Era Options (Step 3)
const ERA_OPTIONS: WizardOption[] = [
  {
    id: 'modern',
    label: 'Modern / Current (2020s)',
    icon: <Rocket size={22} color="#38BDF8" />,
    color: '#38BDF8',
    genres: [],
    params: { 'primary_release_date.gte': '2020-01-01' },
  },
  {
    id: '2010s',
    label: 'Recent Classics (2010s)',
    icon: <Disc3 size={22} color="#818CF8" />,
    color: '#818CF8',
    genres: [],
    params: {
      'primary_release_date.gte': '2010-01-01',
      'primary_release_date.lte': '2019-12-31',
    },
  },
  {
    id: '2000s',
    label: 'Golden 2000s',
    icon: <Tv size={22} color="#F59E0B" />,
    color: '#F59E0B',
    genres: [],
    params: {
      'primary_release_date.gte': '2000-01-01',
      'primary_release_date.lte': '2009-12-31',
    },
  },
  {
    id: '90s',
    label: '90s Nostalgia',
    icon: <Film size={22} color="#EC4899" />,
    color: '#EC4899',
    genres: [],
    params: {
      'primary_release_date.gte': '1990-01-01',
      'primary_release_date.lte': '1999-12-31',
    },
  },
];

// 4. Style Options (Step 4 - Horizontal Full Width Cards matching Screenshot 2)
const STYLE_OPTIONS: WizardOption[] = [
  {
    id: 'blockbuster',
    label: 'Blockbuster',
    subtitle: 'Big hits everyone already loves',
    icon: <TrendingUp size={22} color="#FBBF24" />,
    color: '#FBBF24',
    genres: [],
    params: { 'vote_count.gte': 800, sort_by: 'popularity.desc' },
  },
  {
    id: 'hidden-gems',
    label: 'Hidden Gem',
    subtitle: 'Underrated finds few have seen',
    icon: <Gem size={22} color="#34D399" />,
    color: '#34D399',
    genres: [],
    params: { 'vote_average.gte': 7.2, 'vote_count.gte': 100, sort_by: 'vote_average.desc' },
  },
  {
    id: 'surprise',
    label: 'Any',
    subtitle: 'Surprise me with the best of both',
    icon: <Shuffle size={22} color="#C084FC" />,
    color: '#C084FC',
    genres: [],
  },
];

const STEPS_CONFIG = [
  {
    stepNum: 1,
    title: 'The Atmosphere',
    subtitle: 'What feeling should this movie give you?',
    options: ATMOSPHERE_OPTIONS,
    layout: 'grid',
  },
  {
    stepNum: 2,
    title: 'The Occasion',
    subtitle: "What's the occasion tonight?",
    options: OCCASION_OPTIONS,
    layout: 'grid',
  },
  {
    stepNum: 3,
    title: 'The Era',
    subtitle: 'What time period are you in the mood for?',
    options: ERA_OPTIONS,
    layout: 'grid',
  },
  {
    stepNum: 4,
    title: 'The Style',
    subtitle: 'Blockbuster hit, or hidden gem?',
    options: STYLE_OPTIONS,
    layout: 'list', // Horizontal full width cards
  },
];

function FinderResultCard({ movie }: { movie: Media }) {
  const title = getEnglishTitle(movie);
  const mediaType = movie.media_type ?? (movie.title ? 'movie' : 'tv');
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const year = (movie.release_date ?? movie.first_air_date)?.slice(0, 4);

  return (
    <IOSPressable
      style={styles.resultCard}
      onPress={() => router.push(`/${mediaType}/${movie.id}` as never)}
      activeScale={0.96}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <PosterImage
        path={movie.poster_path}
        title={title}
        movieId={movie.id}
        width={POSTER_WIDTH}
        height={POSTER_HEIGHT}
        borderRadius={16}
      />
      <View style={styles.resultCardInfo}>
        <Text style={styles.resultMovieTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.resultMetaRow}>
          {rating ? (
            <View style={styles.ratingChip}>
              <Text style={styles.ratingChipText}>★ {rating}</Text>
            </View>
          ) : null}
          {year ? <Text style={styles.resultYearText}>{year}</Text> : null}
        </View>
      </View>
    </IOSPressable>
  );
}

export default function FinderScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<WizardOption | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<WizardOption | null>(null);
  const [selectedEra, setSelectedEra] = useState<WizardOption | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<WizardOption | null>(null);
  const [isShowingResults, setIsShowingResults] = useState(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Determine Current Full-Screen Background Theme ──
  const activePaletteKey = useMemo(() => {
    if (selectedAtmosphere?.id && THEME_PALETTES[selectedAtmosphere.id]) {
      return selectedAtmosphere.id;
    }
    return 'default';
  }, [selectedAtmosphere]);

  const activeTheme: ThemePalette = THEME_PALETTES[activePaletteKey] || THEME_PALETTES.default;

  // TMDB Multi-Tier Discover Query Parameters
  const queryParams = useMemo(() => {
    if (!selectedAtmosphere) return null;

    const withGenres = Array.from(
      new Set([
        ...selectedAtmosphere.genres,
        ...(selectedOccasion?.genres || []),
      ])
    ).join(',');

    const withoutGenres = Array.from(
      new Set([
        ...(selectedAtmosphere.excludeGenres || []),
        ...(selectedOccasion?.excludeGenres || []),
      ])
    ).join(',');

    return {
      with_genres: withGenres || undefined,
      without_genres: withoutGenres || undefined,
      vote_average_gte: selectedAtmosphere.minRating || 6.0,
      vote_count_gte: 80,
      sort_by: 'popularity.desc',
      ...(selectedEra?.params || {}),
      ...(selectedStyle?.params || {}),
    };
  }, [selectedAtmosphere, selectedOccasion, selectedEra, selectedStyle]);

  const {
    data: discoverData,
    isLoading: isFetchingResults,
    refetch,
  } = useQuery({
    queryKey: ['finder', 'discover', queryParams],
    queryFn: () => moviesApi.discover(queryParams || {}),
    enabled: isShowingResults && Boolean(queryParams),
    staleTime: 5 * 60 * 1000,
  });

  const results = discoverData?.results ?? [];

  const handleSelectOption = (option: WizardOption) => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

    if (currentStep === 1) {
      setSelectedAtmosphere(option);
      advanceTimerRef.current = setTimeout(() => {
        setDirection(1);
        setCurrentStep(2);
      }, 280);
    } else if (currentStep === 2) {
      setSelectedOccasion(option);
      advanceTimerRef.current = setTimeout(() => {
        setDirection(1);
        setCurrentStep(3);
      }, 280);
    } else if (currentStep === 3) {
      setSelectedEra(option);
      advanceTimerRef.current = setTimeout(() => {
        setDirection(1);
        setCurrentStep(4);
      }, 280);
    } else if (currentStep === 4) {
      setSelectedStyle(option);
      advanceTimerRef.current = setTimeout(() => {
        setIsShowingResults(true);
      }, 280);
    }
  };

  const handleBack = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (isShowingResults) {
      setIsShowingResults(false);
      setDirection(-1);
      setCurrentStep(4);
    } else if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setDirection(-1);
    setCurrentStep(1);
    setSelectedAtmosphere(null);
    setSelectedOccasion(null);
    setSelectedEra(null);
    setSelectedStyle(null);
    setIsShowingResults(false);
  };

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const currentConfig = STEPS_CONFIG[currentStep - 1];

  const getSelectedIdForCurrentStep = () => {
    if (currentStep === 1) return selectedAtmosphere?.id;
    if (currentStep === 2) return selectedOccasion?.id;
    if (currentStep === 3) return selectedEra?.id;
    if (currentStep === 4) return selectedStyle?.id;
    return null;
  };

  const selectedOptionId = getSelectedIdForCurrentStep();

  const renderResultItem = useCallback(
    ({ item }: ListRenderItemInfo<Media>) => <FinderResultCard movie={item} />,
    []
  );
  const keyExtractor = useCallback((item: Media) => String(item.id), []);

  return (
    <View style={styles.root}>
      {/* ── Dynamic Full-Screen Theme Background Gradient ── */}
      <LinearGradient
        colors={activeTheme.bgColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.mainWrapper, { paddingTop: insets.top + 6 }]}>
        {/* ── Top Bar Header (Logo + Avatar) ── */}
        <View style={styles.topBar}>
          <PlotmintLogo size={24} />

          <IOSPressable
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile' as never)}
            activeScale={0.92}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <View style={styles.avatarWrap}>
              <Avatar
                src={user?.avatar_url}
                seed={user?.username || user?.name}
                name={user?.name || 'You'}
                size={34}
                borderRadius={17}
              />
            </View>
          </IOSPressable>
        </View>

        {/* ── Step Tracker Progress Bar (01 / 04) ── */}
        <View style={styles.trackerContainer}>
          <View style={styles.trackerTopRow}>
            <View style={styles.trackerTitleRow}>
              <Compass size={14} color={activeTheme.primary} />
              <Text style={[styles.trackerTitle, { color: activeTheme.primary }]}>
                MOVIE FINDER
              </Text>
            </View>

            <Text style={[styles.trackerCounter, { color: activeTheme.primary }]}>
              {isShowingResults ? '04 / 04' : `0${currentStep} / 04`}
            </Text>
          </View>

          {/* 4-Segment Progress Bar */}
          <View style={styles.progressBarRow}>
            {[1, 2, 3, 4].map((stepIdx) => {
              const isActive = isShowingResults || stepIdx <= currentStep;
              return (
                <View
                  key={stepIdx}
                  style={[
                    styles.progressSegment,
                    isActive && {
                      backgroundColor: activeTheme.primary,
                      shadowColor: activeTheme.primary,
                      shadowOpacity: 0.9,
                      shadowRadius: 5,
                      elevation: 3,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Back Button Row (When Step > 1) */}
        {currentStep > 1 || isShowingResults ? (
          <View style={styles.backRow}>
            <IOSPressable
              style={styles.backTextBtn}
              onPress={handleBack}
              activeScale={0.9}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ChevronLeft size={16} color="rgba(255,255,255,0.7)" strokeWidth={2.4} />
              <Text style={styles.backText}>Back</Text>
            </IOSPressable>
          </View>
        ) : null}

        {/* ── Main Wizard Step or Results View ── */}
        {isShowingResults ? (
          // Results View
          <Animated.View
            entering={FadeIn.duration(350)}
            exiting={FadeOut.duration(200)}
            style={{ flex: 1 }}
          >
            <FlatList<Media>
              data={results}
              renderItem={renderResultItem}
              keyExtractor={keyExtractor}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              ListHeaderComponent={
                <View style={styles.resultsHeader}>
                  <Text style={styles.stepTitle}>Your Curated Cinema</Text>
                  <Text style={styles.stepSubtitle}>
                    Matched for {selectedAtmosphere?.label} • {selectedOccasion?.label || 'Cinema'}
                  </Text>

                  <View style={styles.actionRow}>
                    <IOSPressable
                      style={[styles.resetPillBtn, { borderColor: `${activeTheme.primary}50` }]}
                      onPress={handleReset}
                      activeScale={0.92}
                      accessibilityRole="button"
                      accessibilityLabel="Restart Finder"
                    >
                      <RotateCcw size={13} color={activeTheme.primary} />
                      <Text style={[styles.resetPillText, { color: activeTheme.primary }]}>
                        Restart
                      </Text>
                    </IOSPressable>

                    <IOSPressable
                      style={[styles.shufflePillBtn, { backgroundColor: activeTheme.primary }]}
                      onPress={() => refetch()}
                      activeScale={0.92}
                      accessibilityRole="button"
                      accessibilityLabel="Shuffle Results"
                    >
                      <Shuffle size={13} color="#000000" />
                      <Text style={[styles.shufflePillText, { color: '#000000' }]}>Shuffle</Text>
                    </IOSPressable>
                  </View>
                </View>
              }
              ListEmptyComponent={
                isFetchingResults ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={activeTheme.primary} />
                    <Text style={[styles.loadingText, { color: activeTheme.primary }]}>
                      Curating matched features…
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No matching films found</Text>
                    <Text style={styles.emptySub}>
                      Try selecting a different atmosphere or era combination.
                    </Text>
                  </View>
                )
              }
            />
          </Animated.View>
        ) : (
          // Animated Wizard Step Transitions
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.wizardContent}
            keyboardShouldPersistTaps="handled"
            bounces={true}
          >
            <Animated.View
              key={`step-${currentStep}`}
              entering={direction > 0 ? SlideInRight.duration(260) : SlideInLeft.duration(260)}
              exiting={direction > 0 ? SlideOutLeft.duration(200) : SlideOutRight.duration(200)}
              style={{ width: '100%', alignItems: 'center' }}
            >
              {/* Step Heading */}
              <Text style={styles.stepTitle}>{currentConfig.title}</Text>
              <Text style={styles.stepSubtitle}>{currentConfig.subtitle}</Text>

              {/* Step 4 List Layout OR Steps 1-3 Grid Layout */}
              {currentConfig.layout === 'list' ? (
                // Horizontal Full Width Cards (Step 4 - As seen in Screenshot 2)
                <View style={styles.listOptionsWrap}>
                  {currentConfig.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;

                    return (
                      <IOSPressable
                        key={opt.id}
                        style={[
                          styles.listCard,
                          {
                            backgroundColor: activeTheme.cardBg,
                            borderColor: isSelected ? opt.color : activeTheme.cardBorder,
                          },
                          isSelected && {
                            backgroundColor: `${opt.color}25`,
                            shadowColor: opt.color,
                            shadowOpacity: 0.45,
                            shadowRadius: 10,
                            elevation: 5,
                          },
                        ]}
                        onPress={() => handleSelectOption(opt)}
                        activeScale={0.97}
                        activeOpacity={0.9}
                        accessibilityRole="button"
                        accessibilityLabel={opt.label}
                      >
                        {/* Icon Bubble */}
                        <View
                          style={[
                            styles.listIconCircle,
                            {
                              backgroundColor: `${opt.color}20`,
                              borderColor: `${opt.color}40`,
                            },
                          ]}
                        >
                          {opt.icon}
                        </View>

                        {/* Title & Subtitle */}
                        <View style={styles.listTextWrap}>
                          <Text style={styles.listCardTitle}>{opt.label}</Text>
                          {opt.subtitle ? (
                            <Text style={styles.listCardSubtitle}>{opt.subtitle}</Text>
                          ) : null}
                        </View>

                        {/* Check Badge if Selected */}
                        {isSelected && (
                          <View style={[styles.listCheckBadge, { backgroundColor: opt.color }]}>
                            <Check size={12} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </IOSPressable>
                    );
                  })}
                </View>
              ) : (
                // 2-Column Grid Cards (Steps 1, 2, 3 - As seen in Screenshot 1)
                <View style={styles.optionsGrid}>
                  {currentConfig.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;

                    return (
                      <IOSPressable
                        key={opt.id}
                        style={[
                          styles.optionCard,
                          {
                            width: CARD_WIDTH,
                            backgroundColor: activeTheme.cardBg,
                            borderColor: isSelected ? opt.color : activeTheme.cardBorder,
                          },
                          isSelected && {
                            backgroundColor: `${opt.color}25`,
                            shadowColor: opt.color,
                            shadowOpacity: 0.5,
                            shadowRadius: 10,
                            elevation: 6,
                          },
                        ]}
                        onPress={() => handleSelectOption(opt)}
                        activeScale={0.94}
                        activeOpacity={0.88}
                        accessibilityRole="button"
                        accessibilityLabel={opt.label}
                      >
                        {/* Glowing Circular Icon Bubble */}
                        <View
                          style={[
                            styles.iconCircle,
                            {
                              backgroundColor: `${opt.color}18`,
                              borderColor: isSelected ? opt.color : `${opt.color}35`,
                            },
                          ]}
                        >
                          {opt.icon}
                        </View>

                        {/* Option Label */}
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && { color: '#FFFFFF', fontFamily: fonts.headingBlack },
                          ]}
                          numberOfLines={2}
                        >
                          {opt.label}
                        </Text>

                        {/* Selected Checkmark Badge */}
                        {isSelected && (
                          <View style={[styles.checkBadge, { backgroundColor: opt.color }]}>
                            <Check size={10} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </IOSPressable>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#090414',
  },
  mainWrapper: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    paddingVertical: 10,
  },
  avatarBtn: {
    padding: 2,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  trackerContainer: {
    paddingHorizontal: PADDING,
    paddingVertical: 8,
    marginBottom: 4,
  },
  trackerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trackerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackerTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 11,
    letterSpacing: 1,
  },
  trackerCounter: {
    fontFamily: fonts.headingBlack,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  backRow: {
    paddingHorizontal: PADDING,
    paddingVertical: 4,
    marginBottom: 6,
  },
  backTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  wizardContent: {
    paddingHorizontal: PADDING,
    paddingTop: 8,
    paddingBottom: 110,
    alignItems: 'center',
  },
  stepTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    justifyContent: 'space-between',
    width: '100%',
  },
  optionCard: {
    height: 106,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  optionLabel: {
    fontFamily: fonts.headingSemi,
    fontSize: 12.5,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listOptionsWrap: {
    width: '100%',
    gap: 14,
  },
  listCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    position: 'relative',
  },
  listIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  listTextWrap: {
    flex: 1,
  },
  listCardTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  listCardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  listCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsContent: {
    paddingBottom: 110,
  },
  resultsHeader: {
    paddingHorizontal: PADDING,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  resetPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  resetPillText: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
  },
  shufflePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  shufflePillText: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    marginBottom: PADDING,
  },
  resultCard: {
    width: POSTER_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  resultCardInfo: {
    padding: 8,
  },
  resultMovieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 12.5,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingChip: {
    backgroundColor: colors.amber,
    borderRadius: radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  ratingChipText: {
    fontFamily: fonts.headingBlack,
    fontSize: 9.5,
    color: '#000000',
  },
  resultYearText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
