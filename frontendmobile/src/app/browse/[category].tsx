import React, { useState, useMemo, useCallback } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Filter,
  Film,
  Trophy,
  Award,
  Video,
  Layers,
  Globe,
  Languages,
  Users,
  Compass,
  Star,
  Clapperboard,
  RotateCcw,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { moviesApi, tvApi } from '@/api/movies';
import { curatedApi } from '@/api/curated';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { getEnglishTitle } from '@/lib/format';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GUTTER = spacing.sm;
const SIDE_PAD = spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - SIDE_PAD * 2 - GUTTER) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

// ─── Filter Definitions by Category ──────────────────────────────────────────

interface FilterOption {
  id: string;
  name: string;
  params?: Record<string, string | number>;
  endpoint?: string;
}

const GENRE_OPTIONS: FilterOption[] = [
  { id: '28', name: 'Action', params: { with_genres: '28' } },
  { id: '12', name: 'Adventure', params: { with_genres: '12' } },
  { id: '16', name: 'Animation', params: { with_genres: '16' } },
  { id: '35', name: 'Comedy', params: { with_genres: '35' } },
  { id: '80', name: 'Crime', params: { with_genres: '80' } },
  { id: '99', name: 'Documentary', params: { with_genres: '99' } },
  { id: '18', name: 'Drama', params: { with_genres: '18' } },
  { id: '10751', name: 'Family', params: { with_genres: '10751' } },
  { id: '14', name: 'Fantasy', params: { with_genres: '14' } },
  { id: '36', name: 'History', params: { with_genres: '36' } },
  { id: '27', name: 'Horror', params: { with_genres: '27' } },
  { id: '10402', name: 'Music', params: { with_genres: '10402' } },
  { id: '9648', name: 'Mystery', params: { with_genres: '9648' } },
  { id: '10749', name: 'Romance', params: { with_genres: '10749' } },
  { id: '878', name: 'Sci-Fi', params: { with_genres: '878' } },
  { id: '10770', name: 'TV Movie', params: { with_genres: '10770' } },
  { id: '53', name: 'Thriller', params: { with_genres: '53' } },
  { id: '10752', name: 'War', params: { with_genres: '10752' } },
  { id: '37', name: 'Western', params: { with_genres: '37' } },
];

const ANIME_OPTIONS: FilterOption[] = [
  { id: 'all', name: 'All Anime', endpoint: '/movies/anime' },
  {
    id: 'masterpieces',
    name: 'Top Rated Features',
    params: {
      with_genres: '16',
      with_original_language: 'ja',
      vote_average_gte: 7.8,
      vote_count_gte: 200,
      sort_by: 'vote_average.desc',
    },
  },
  {
    id: 'shonen',
    name: 'Action & Shonen',
    params: {
      with_genres: '16,28',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
    },
  },
  {
    id: 'romance',
    name: 'Romance & Drama',
    params: {
      with_genres: '16,10749',
      with_original_language: 'ja',
      sort_by: 'vote_average.desc',
    },
  },
  {
    id: 'scifi',
    name: 'Sci-Fi & Cyberpunk',
    params: {
      with_genres: '16,878',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
    },
  },
];

const AWARDS_OPTIONS: FilterOption[] = [
  {
    id: 'oscars',
    name: 'Academy Awards & Oscars',
    params: {
      with_keywords: '6091|8234|286595',
      vote_count_gte: 100,
      sort_by: 'vote_average.desc',
    },
  },
  {
    id: 'golden-globes',
    name: 'Golden Globes',
    params: {
      with_keywords: '11862',
      vote_count_gte: 100,
      sort_by: 'vote_average.desc',
    },
  },
  {
    id: 'cannes',
    name: 'Cannes Film Festival',
    params: {
      with_keywords: '13123',
      vote_count_gte: 50,
      sort_by: 'vote_average.desc',
    },
  },
  {
    id: 'all',
    name: 'All Acclaimed (8.0+)',
    params: {
      vote_average_gte: 8.0,
      vote_count_gte: 800,
      sort_by: 'vote_average.desc',
    },
  },
];

const FRANCHISE_OPTIONS: FilterOption[] = [
  {
    id: 'marvel',
    name: 'Marvel Cinematic Universe',
    params: { with_companies: '420|7505|13252', sort_by: 'primary_release_date.desc' },
  },
  {
    id: 'dc',
    name: 'DC Universe',
    params: { with_companies: '4043|128064|9993', sort_by: 'primary_release_date.desc' },
  },
  {
    id: 'starwars',
    name: 'Star Wars / Lucasfilm',
    params: { with_companies: 1, sort_by: 'primary_release_date.asc' },
  },
  {
    id: 'disney',
    name: 'Disney Classics',
    params: { with_companies: '2|6125', sort_by: 'popularity.desc' },
  },
  {
    id: 'pixar',
    name: 'Pixar Animation',
    params: { with_companies: 3, sort_by: 'vote_average.desc' },
  },
  {
    id: 'warner',
    name: 'Warner Bros. Blockbusters',
    params: { with_companies: '174|2739', sort_by: 'popularity.desc' },
  },
];

const FAMILY_OPTIONS: FilterOption[] = [
  {
    id: 'all',
    name: 'All Family Friendly',
    params: {
      with_genres: '10751',
      without_genres: '27,53,80,10752',
      vote_average_gte: 6.5,
      sort_by: 'popularity.desc',
    },
  },
  {
    id: 'animation',
    name: 'Animated Gems',
    params: {
      with_genres: '10751,16',
      without_genres: '27,53,80',
      vote_average_gte: 7.0,
      sort_by: 'vote_average.desc',
    },
  },
  {
    id: 'adventure',
    name: 'Magical Adventure',
    params: {
      with_genres: '10751,12,14',
      without_genres: '27,53,80',
      vote_average_gte: 6.5,
      sort_by: 'popularity.desc',
    },
  },
  {
    id: 'comedy',
    name: 'Family Comedy',
    params: {
      with_genres: '10751,35',
      without_genres: '27,53,80',
      vote_average_gte: 6.2,
      sort_by: 'popularity.desc',
    },
  },
];

const COUNTRY_OPTIONS: FilterOption[] = [
  { id: 'US', name: 'United States (Hollywood)', params: { with_origin_country: 'US' } },
  { id: 'IN', name: 'India (Bollywood / Regional)', params: { with_origin_country: 'IN' } },
  { id: 'KR', name: 'South Korea (K-Cinema)', params: { with_origin_country: 'KR' } },
  { id: 'JP', name: 'Japan', params: { with_origin_country: 'JP' } },
  { id: 'GB', name: 'United Kingdom', params: { with_origin_country: 'GB' } },
  { id: 'FR', name: 'France', params: { with_origin_country: 'FR' } },
  { id: 'ES', name: 'Spain', params: { with_origin_country: 'ES' } },
  { id: 'IT', name: 'Italy', params: { with_origin_country: 'IT' } },
];

const LANGUAGE_OPTIONS: FilterOption[] = [
  { id: 'en', name: 'English', params: { with_original_language: 'en' } },
  { id: 'hi', name: 'Hindi', params: { with_original_language: 'hi' } },
  { id: 'ko', name: 'Korean', params: { with_original_language: 'ko' } },
  { id: 'ja', name: 'Japanese', params: { with_original_language: 'ja' } },
  { id: 'te', name: 'Telugu', params: { with_original_language: 'te' } },
  { id: 'ta', name: 'Tamil', params: { with_original_language: 'ta' } },
  { id: 'es', name: 'Spanish', params: { with_original_language: 'es' } },
  { id: 'fr', name: 'French', params: { with_original_language: 'fr' } },
  { id: 'de', name: 'German', params: { with_original_language: 'de' } },
];

// ─── Header Configurations ───────────────────────────────────────────────────

interface HeaderMeta {
  title: string;
  badge: string;
  accent: string;
  description: string;
  options: FilterOption[];
}

function getCategoryConfig(categoryKey: string): HeaderMeta {
  const norm = categoryKey.toLowerCase();
  switch (norm) {
    case 'anime':
      return {
        title: 'Anime Vault',
        badge: 'JAPANESE ANIMATION',
        accent: '#EC4899',
        description: 'Explore legendary anime series and cinematic masterworks.',
        options: ANIME_OPTIONS,
      };
    case 'awards':
      return {
        title: 'Award Winners',
        badge: 'HIGHEST ACCLAIM',
        accent: '#F87171',
        description: 'Oscar, Cannes, BAFTA and festival winning cinema rated 8.0+.',
        options: AWARDS_OPTIONS,
      };
    case 'franchise':
      return {
        title: 'Movie Franchises',
        badge: 'CURATED UNIVERSES',
        accent: '#38BDF8',
        description: "Step into the world's most iconic sagas and cinematic universes.",
        options: FRANCHISE_OPTIONS,
      };
    case 'family':
      return {
        title: 'Family Friendly',
        badge: 'ALL AGES',
        accent: '#FBBF24',
        description: 'Wholesome, fun and heartwarming cinema for the whole family.',
        options: FAMILY_OPTIONS,
      };
    case 'country':
      return {
        title: 'World Cinema',
        badge: 'BY COUNTRY',
        accent: '#60A5FA',
        description: 'Discover masterpieces from celebrated film cultures across the globe.',
        options: COUNTRY_OPTIONS,
      };
    case 'language':
      return {
        title: 'Languages',
        badge: 'ORIGINAL AUDIO',
        accent: '#34D399',
        description: 'Watch films in their authentic, original audio languages.',
        options: LANGUAGE_OPTIONS,
      };
    default:
      return {
        title: 'Genres',
        badge: 'BROWSE BY GENRE',
        accent: '#F472B6',
        description: 'Select your preferred genre to discover top rated features.',
        options: GENRE_OPTIONS,
      };
  }
}

export default function CategoryBrowseScreen() {
  const { category = 'genre', initialId } = useLocalSearchParams<{ category: string; initialId?: string }>();
  const config = useMemo(() => getCategoryConfig(category), [category]);

  const initialFilter = useMemo(() => {
    if (initialId) {
      const match = config.options.find((opt) => opt.id === initialId);
      if (match) return match;
    }
    return config.options[0];
  }, [config, initialId]);

  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(initialFilter);

  // Keep state updated if URL param category or initialId changes
  React.useEffect(() => {
    if (initialId) {
      const match = config.options.find((opt) => opt.id === initialId);
      if (match) {
        setSelectedFilter(match);
        return;
      }
    }
    setSelectedFilter(config.options[0]);
  }, [config, initialId]);

  // Live Query
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['movies', 'browse-category', category, selectedFilter.id],
    queryFn: async () => {
      if (selectedFilter.endpoint === '/movies/anime') {
        return moviesApi.anime();
      }
      
      const params = selectedFilter.params || {};
      
      // Fetch both movies and TV for Franchise and Award categories
      if (category === 'franchise' || category === 'awards') {
        const [moviesRes, tvRes] = await Promise.all([
          moviesApi.discover(params).catch(() => ({ results: [] })),
          tvApi.discover(params).catch(() => ({ results: [] }))
        ]);
        
        // Tag them so the UI knows where to route when clicked
        const typedMovies = (moviesRes?.results || []).map(m => ({ ...m, media_type: 'movie' as const }));
        const typedTv = (tvRes?.results || []).map(t => ({ ...t, media_type: 'tv' as const }));
        
        const merged = [...typedMovies, ...typedTv];
        
        // Local sort
        const sortParam = (params.sort_by as string) || 'popularity.desc';
        merged.sort((a, b) => {
          if (sortParam.includes('primary_release_date')) {
            const dateA = new Date(a.release_date || a.first_air_date || '1970-01-01').getTime();
            const dateB = new Date(b.release_date || b.first_air_date || '1970-01-01').getTime();
            return sortParam.includes('desc') ? dateB - dateA : dateA - dateB;
          }
          if (sortParam.includes('vote_average')) {
            return (b.vote_average || 0) - (a.vote_average || 0);
          }
          // Fallback to popularity
          return (b.popularity || 0) - (a.popularity || 0);
        });
        
        return {
          results: merged,
          page: 1,
          total_pages: 1,
          total_results: merged.length
        };
      }
      
      return moviesApi.discover(params);
    },
    staleTime: 5 * 60 * 1000,
  });

  const movies = data?.results ?? [];

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Media>) => {
      const itemTitle = getEnglishTitle(item);
      const mediaType = item.media_type ?? (item.title ? 'movie' : 'tv');
      const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
      const year = (item.release_date ?? item.first_air_date)?.slice(0, 4);

      return (
        <IOSPressable
          style={styles.card}
          onPress={() => router.push(`/${mediaType}/${item.id}` as never)}
          activeScale={0.96}
          accessibilityRole="button"
          accessibilityLabel={itemTitle}
        >
          <PosterImage
            path={item.poster_path}
            title={itemTitle}
            movieId={item.id}
            width={CARD_WIDTH}
            height={POSTER_HEIGHT}
            borderRadius={16}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.movieTitle} numberOfLines={1}>
              {itemTitle}
            </Text>
            <View style={styles.metaRow}>
              {rating ? (
                <View style={styles.ratingChip}>
                  <Text style={styles.ratingChipText}>★ {rating}</Text>
                </View>
              ) : null}
              {year ? <Text style={styles.yearText}>{year}</Text> : null}
            </View>
          </View>
        </IOSPressable>
      );
    },
    []
  );

  const keyExtractor = useCallback((item: Media) => String(item.id), []);

  return (
    <View style={styles.root}>
      {/* ── iOS Navigation Bar ── */}
      <IOSHeader
        title={config.title}
        subtitle={config.badge}
        rightAction={<Filter size={18} color={config.accent} />}
      />

      {/* ── Filter Chips Bar ── */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {config.options.map((opt) => {
            const isSelected = selectedFilter.id === opt.id;
            return (
              <IOSPressable
                key={opt.id}
                style={[
                  styles.chip,
                  isSelected && {
                    backgroundColor: `${config.accent}25`,
                    borderColor: config.accent,
                  },
                ]}
                onPress={() => setSelectedFilter(opt)}
                activeScale={0.94}
                accessibilityRole="button"
                accessibilityLabel={opt.name}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && { color: '#FFFFFF', fontFamily: fonts.headingBlack },
                  ]}
                >
                  {opt.name}
                </Text>
              </IOSPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Movie Grid ── */}
      <FlatList<Media>
        data={movies}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        onRefresh={refetch}
        refreshing={isRefetching}
        // Same tuning as MovieRow's horizontal rails: bounds how much work
        // mounts up front and off-screen instead of relying on RN's more
        // generous defaults, since this grid can hold ~40 poster rows
        // (movies+TV merged) for the franchise/awards categories.
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.categoryHeroBanner}>
            <LinearGradient
              colors={[`${config.accent}20`, 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={[styles.badgeTag, { borderColor: `${config.accent}40` }]}>
              <Text style={[styles.badgeTagText, { color: config.accent }]}>
                {config.badge}
              </Text>
            </View>
            <Text style={styles.heroBannerTitle}>{config.title}</Text>
            <Text style={styles.heroBannerSubtitle}>{config.description}</Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={config.accent} />
              <Text style={[styles.loadingText, { color: config.accent }]}>
                Loading {config.title.toLowerCase()}…
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No matching films</Text>
              <Text style={styles.emptySub}>
                Try selecting a different filter above.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  filterScroll: {
    paddingHorizontal: SIDE_PAD,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  categoryHeroBanner: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#121118',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  badgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    marginBottom: 8,
  },
  badgeTagText: {
    fontFamily: fonts.headingBlack,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  heroBannerTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroBannerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 17,
  },
  gridContainer: {
    paddingHorizontal: SIDE_PAD,
    paddingTop: 12,
    paddingBottom: 110,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: GUTTER,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#16151E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardInfo: {
    padding: 8,
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 12.5,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metaRow: {
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
  yearText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 12,
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
