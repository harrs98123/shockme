import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Search as SearchIcon, X, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { moviesApi } from '@/api/movies';
import { useAuth } from '@/hooks/useAuth';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { useDebounce } from '@/hooks/useDebounce';
import { getEnglishTitle } from '@/lib/format';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { EmptyState } from '@/components/layout/States';
import { PlotmintLogo } from '@/components/ui/PlotmintLogo';
import { Avatar } from '@/components/avatar/Avatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 2;
const GUTTER = spacing.sm;
const SIDE_PAD = spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - SIDE_PAD * 2 - GUTTER * (COLUMNS - 1)) / COLUMNS;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.5);

type FilterType = 'all' | 'movie' | 'tv';

// ─── Grid Card ────────────────────────────────────────────────────────────────

function SearchCard({ item }: { item: Media }) {
  const title = getEnglishTitle(item);
  const mediaType = item.media_type ?? (item.title ? 'movie' : 'tv');
  const year = (item.release_date ?? item.first_air_date)?.slice(0, 4);
  const rating = item.vote_average?.toFixed(1);

  return (
    <IOSPressable
      style={styles.card}
      onPress={() => router.push(`/${mediaType}/${item.id}` as never)}
      activeScale={0.96}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <PosterImage
        path={item.poster_path}
        title={title}
        movieId={item.id}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        borderRadius={16}
      />
      <View style={styles.cardMeta}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.cardRow}>
          {rating && rating !== '0.0' ? (
            <View style={styles.ratingChip}>
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : null}
          {year ? <Text style={styles.yearText}>{year}</Text> : null}
          {mediaType === 'tv' ? (
            <Text style={styles.seriesTag}>SERIES</Text>
          ) : null}
        </View>
      </View>
    </IOSPressable>
  );
}

// ─── Search Screen ────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [query, setQuery] = useState('');
  const [forceQuery, setForceQuery] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  
  const debouncedQuery = useDebounce(query, 350);
  const activeQuery = forceQuery || debouncedQuery;

  // Primary Search Query
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['movies', 'search', activeQuery],
    queryFn: () => moviesApi.search(activeQuery),
    enabled: activeQuery.length >= 2,
    staleTime: 60 * 1000,
  });

  // Trending Fallback Query
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['movies', 'trending', 'search-fallback'],
    queryFn: () => moviesApi.trending(1),
    enabled: activeQuery.length < 2,
    staleTime: 5 * 60 * 1000,
  });

  const rawResults = data?.results ?? [];
  const filteredResults = rawResults.filter((item) => {
    if (filter === 'all') return true;
    const mediaType = item.media_type ?? (item.title ? 'movie' : 'tv');
    return mediaType === filter;
  });

  const trendingResults = trendingData?.results?.slice(0, 8) ?? [];

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Media>) => <SearchCard item={item} />,
    []
  );
  
  const keyExtractor = useCallback((item: Media) => String(item.id), []);
  
  const clearQuery = useCallback(() => {
    setQuery('');
    setForceQuery(null);
  }, []);

  const searching = isLoading || isFetching;

  // Filter Tabs Component
  const FilterTabs = () => (
    <View style={styles.filterRow}>
      {(['all', 'movie', 'tv'] as FilterType[]).map((type) => {
        const isActive = filter === type;
        const labels = { all: 'All Results', movie: 'Movies', tv: 'TV Shows' };
        return (
          <Pressable
            key={type}
            onPress={() => setFilter(type)}
            style={[styles.filterBtn, isActive && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
              {labels[type]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <LinearGradient
        colors={['rgba(139,92,246,0.14)', 'rgba(229,9,20,0.06)', 'transparent']}
        style={[styles.ambientGlow, { pointerEvents: 'none' }]}
      />

      <View style={styles.topBar}>
        <PlotmintLogo size={24} />

        <IOSPressable
          style={styles.avatarBtn}
          onPress={() => router.push('/(tabs)/profile' as never)}
          activeScale={0.92}
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

      <View style={styles.inputOuter}>
        <View style={styles.inputWrap}>
          <SearchIcon size={20} color="#38BDF8" style={styles.searchIcon} strokeWidth={2.4} />
          <TextInput
            style={styles.input}
            placeholder="Search for movies, series, shows..."
            placeholderTextColor="rgba(255, 255, 255, 0.45)"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (forceQuery) setForceQuery(null);
            }}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardAppearance="dark"
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <Pressable onPress={clearQuery} hitSlop={8}>
              <View style={styles.clearCircle}>
                <X size={12} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </Pressable>
          )}
        </View>
        
        {/* Filter Tabs show only when searching */}
        {activeQuery.length >= 2 && <FilterTabs />}
      </View>

      {/* Typo Correction Notice */}
      {data?.corrected_query && forceQuery === null && activeQuery.length >= 2 && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.typoNotice}>
          <Text style={styles.typoText}>
            Showing results for <Text style={styles.typoHighlight}>{data.corrected_query}</Text>
          </Text>
          <Pressable onPress={() => setForceQuery(debouncedQuery)} hitSlop={8}>
            <Text style={styles.typoLink}>
              Search instead for "{debouncedQuery}"
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Content States */}
      {activeQuery.length < 2 ? (
        // Trending Empty State
        <View style={styles.trendingContainer}>
          <View style={styles.trendingHeader}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={styles.trendingTitle}>Trending Now</Text>
          </View>
          {isTrendingLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList<Media>
              data={trendingResults}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              numColumns={COLUMNS}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
            />
          )}
        </View>
      ) : searching && !data ? (
        // Loading Skeleton
        <FlatList
          data={Array.from({ length: 6 }, (_, i) => i)}
          renderItem={({ item }) => (
            <View
              key={item}
              style={[styles.card, { backgroundColor: colors.surface2, height: CARD_HEIGHT + 45 }]}
            />
          )}
          keyExtractor={String}
          numColumns={COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />
      ) : filteredResults.length === 0 ? (
        <EmptyState
          title="No results"
          description={`Nothing matched your search.`}
        />
      ) : (
        <FlatList<Media>
          data={filteredResults}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08080C' },
  ambientGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE_PAD,
    paddingVertical: 10,
    marginBottom: 12,
  },
  avatarBtn: { padding: 2 },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#16151E',
  },
  inputOuter: { paddingHorizontal: SIDE_PAD, marginBottom: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  filterTextActive: {
    color: '#FFF',
    fontFamily: fonts.headingSemi,
  },
  typoNotice: {
    paddingHorizontal: SIDE_PAD,
    marginBottom: 16,
  },
  typoText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  typoHighlight: {
    fontFamily: fonts.headingSemi,
    color: '#FFF',
  },
  typoLink: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: '#38BDF8',
  },
  trendingContainer: {
    flex: 1,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIDE_PAD,
    marginBottom: 16,
    gap: 8,
  },
  trendingTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 18,
    color: '#FFF',
  },
  grid: { paddingHorizontal: SIDE_PAD, paddingBottom: 110 },
  row: { justifyContent: 'space-between', marginBottom: GUTTER },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  cardMeta: { padding: 8 },
  cardTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingChip: {
    backgroundColor: colors.amber,
    borderRadius: radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  ratingText: { fontFamily: fonts.headingBlack, fontSize: 9.5, color: '#000' },
  yearText: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  seriesTag: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: colors.primary,
    backgroundColor: 'rgba(229,9,20,0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
});
