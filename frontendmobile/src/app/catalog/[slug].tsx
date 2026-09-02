import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Bookmark, Eye, Film } from 'lucide-react-native';

import { moviesApi, tvApi, type DiscoverParams } from '@/api/movies';
import { favoritesApi, watchlistApi, watchedApi } from '@/api/lists';
import { useAuth } from '@/hooks/useAuth';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { getEnglishTitle } from '@/lib/format';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

export const CATALOG_TYPE_MAP: Record<
  string,
  { title: string; subtitle: string; description: string }
> = {
  trending: {
    title: 'Trending Now',
    subtitle: 'Global favorites',
    description: 'The movies and shows everyone is watching right now.',
  },
  'trending-indian': {
    title: 'Trending in India',
    subtitle: 'Indian cinema & OTT',
    description: 'The most popular Indian movies and shows trending right now.',
  },
  popular: {
    title: 'Popular Movies',
    subtitle: 'Fan blockbusters',
    description: 'The most popular movies on plotmint right now.',
  },
  'top-rated': {
    title: 'Top Rated Features',
    subtitle: 'Critically acclaimed',
    description: 'The highest-rated movies of all time, ranked by audience score.',
  },
  anime: {
    title: 'Japanese Anime',
    subtitle: 'Top animation',
    description: 'Discover the best Japanese anime movies and series.',
  },
  series: {
    title: 'Popular TV Series',
    subtitle: 'Binge-worthy shows',
    description: 'The most popular TV series to binge right now.',
  },
  upcoming: {
    title: 'Upcoming Movies',
    subtitle: 'Future releases',
    description: 'Upcoming movie releases you should have on your radar.',
  },
  'now-playing': {
    title: 'Now Playing',
    subtitle: 'In Theaters',
    description: 'Movies currently playing and trending in theaters.',
  },
};

function CatalogMovieCard({
  item,
  isFav,
  isWatchlisted,
  isWatched,
  onToggleFav,
  onToggleWatchlist,
  onToggleWatched,
}: {
  item: Media;
  isFav: boolean;
  isWatchlisted: boolean;
  isWatched: boolean;
  onToggleFav: (media: Media) => void;
  onToggleWatchlist: (media: Media) => void;
  onToggleWatched: (media: Media) => void;
}) {
  const title = getEnglishTitle(item);
  const mediaType = item.media_type ?? (item.title ? 'movie' : 'tv');
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const year = (item.release_date ?? item.first_air_date)?.slice(0, 4);

  return (
    <IOSPressable
      style={styles.card}
      onPress={() => router.push(`/${mediaType}/${item.id}` as never)}
      activeScale={0.96}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.posterContainer}>
        <PosterImage
          path={item.poster_path}
          title={title}
          movieId={item.id}
          width={CARD_WIDTH}
          height={POSTER_HEIGHT}
          borderRadius={radius.md}
        />

        {/* Quick List Action Pills */}
        <View style={styles.cardActionPills}>
          <IOSPressable
            style={[styles.pillBtn, isFav && styles.pillBtnActiveRed]}
            onPress={() => onToggleFav(item)}
            activeScale={0.88}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={12}
              color={isFav ? '#FFFFFF' : 'rgba(255,255,255,0.85)'}
              fill={isFav ? '#FFFFFF' : 'transparent'}
            />
          </IOSPressable>

          <IOSPressable
            style={[styles.pillBtn, isWatchlisted && styles.pillBtnActiveBlue]}
            onPress={() => onToggleWatchlist(item)}
            activeScale={0.88}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Bookmark
              size={12}
              color={isWatchlisted ? '#FFFFFF' : 'rgba(255,255,255,0.85)'}
              fill={isWatchlisted ? '#FFFFFF' : 'transparent'}
            />
          </IOSPressable>

          <IOSPressable
            style={[styles.pillBtn, isWatched && styles.pillBtnActiveGreen]}
            onPress={() => onToggleWatched(item)}
            activeScale={0.88}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={isWatched ? 'Mark unwatched' : 'Mark watched'}
          >
            <Eye
              size={12}
              color={isWatched ? '#FFFFFF' : 'rgba(255,255,255,0.85)'}
            />
          </IOSPressable>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.movieTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.cardMeta}>
          {rating ? <Text style={styles.ratingText}>★ {rating}</Text> : null}
          {year ? <Text style={styles.yearText}>• {year}</Text> : null}
          {mediaType === 'tv' && <Text style={styles.seriesTag}>TV</Text>}
        </View>
      </View>
    </IOSPressable>
  );
}

const GENRE_NAME_MAP: Record<string, string> = {
  '28': 'Action',
  '12': 'Adventure',
  '16': 'Animation',
  '35': 'Comedy',
  '80': 'Crime',
  '99': 'Documentary',
  '18': 'Drama',
  '10751': 'Family',
  '14': 'Fantasy',
  '36': 'History',
  '27': 'Horror',
  '10402': 'Music',
  '9648': 'Mystery',
  '10749': 'Romance',
  '878': 'Sci-Fi',
  '10770': 'TV Movie',
  '53': 'Thriller',
  '10752': 'War',
  '37': 'Western',
};

export default function CatalogScreen() {
  const { slug, with_genres, with_origin_country, with_original_language, sort_by } =
    useLocalSearchParams<{
      slug: string;
      with_genres?: string;
      with_origin_country?: string;
      with_original_language?: string;
      sort_by?: string;
    }>();

  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const genreName = with_genres ? GENRE_NAME_MAP[with_genres] : null;

  const typeConfig = CATALOG_TYPE_MAP[slug || 'trending'] || {
    title: genreName ? `${genreName} Movies` : slug === 'discover' ? 'Discover Cinema' : 'Catalog',
    subtitle: genreName ? `Curated ${genreName.toLowerCase()} collection` : 'Browsing all titles',
    description: genreName
      ? `Explore top-rated and trending ${genreName.toLowerCase()} movies.`
      : 'Explore our comprehensive movie and TV catalogue.',
  };

  // User list queries for active button states
  const { data: favIds = [] } = useQuery({
    queryKey: ['favorites', 'ids'],
    queryFn: () => (isAuthenticated ? favoritesApi.ids() : Promise.resolve([])),
    enabled: isAuthenticated,
  });

  const { data: watchIds = [] } = useQuery({
    queryKey: ['watchlist', 'ids'],
    queryFn: () => (isAuthenticated ? watchlistApi.ids() : Promise.resolve([])),
    enabled: isAuthenticated,
  });

  const { data: watchedIds = [] } = useQuery({
    queryKey: ['watched', 'ids'],
    queryFn: () => (isAuthenticated ? watchedApi.ids() : Promise.resolve([])),
    enabled: isAuthenticated,
  });

  // Infinite Query for Catalog Items
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: [
      'movies',
      'catalog',
      slug,
      with_genres,
      with_origin_country,
      with_original_language,
      sort_by,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      switch (slug) {
        case 'trending-indian':
          return moviesApi.trendingIndian(pageParam);
        case 'popular':
          return moviesApi.popular(pageParam);
        case 'top-rated':
          return moviesApi.topRated(pageParam);
        case 'anime':
          return moviesApi.anime(pageParam);
        case 'series':
          return tvApi.popular(pageParam);
        case 'upcoming':
          return moviesApi.discover({
            sort_by: 'primary_release_date.desc',
            page: pageParam,
          });
        case 'now-playing':
          return moviesApi.discover({
            sort_by: 'popularity.desc',
            page: pageParam,
          });
        case 'discover':
          return moviesApi.discover({
            with_genres,
            with_origin_country,
            with_original_language,
            sort_by: sort_by || 'popularity.desc',
            page: pageParam,
          });
        case 'trending':
        default:
          return moviesApi.trending(pageParam);
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });

  const allMovies = data?.pages.flatMap((page) => page.results) ?? [];

  // Toggle Handlers
  const handleToggleFav = async (media: Media) => {
    if (!isAuthenticated) {
      showToast.info('Sign in to save favorites');
      return;
    }
    const isFav = favIds.includes(media.id);
    try {
      if (isFav) {
        await favoritesApi.remove(media.id);
        showToast.info('Removed from Favorites');
      } else {
        await favoritesApi.add(media);
        showToast.success('Added to Favorites ❤️');
      }
      qc.invalidateQueries({ queryKey: ['favorites'] });
    } catch {
      showToast.error('Action failed');
    }
  };

  const handleToggleWatchlist = async (media: Media) => {
    if (!isAuthenticated) {
      showToast.info('Sign in to use watchlist');
      return;
    }
    const isSaved = watchIds.includes(media.id);
    try {
      if (isSaved) {
        await watchlistApi.remove(media.id);
        showToast.info('Removed from Watchlist');
      } else {
        await watchlistApi.add(media);
        showToast.success('Added to Watchlist 📌');
      }
      qc.invalidateQueries({ queryKey: ['watchlist'] });
    } catch {
      showToast.error('Action failed');
    }
  };

  const handleToggleWatched = async (media: Media) => {
    if (!isAuthenticated) {
      showToast.info('Sign in to track watched');
      return;
    }
    const isWatched = watchedIds.includes(media.id);
    try {
      if (isWatched) {
        await watchedApi.remove(media.id);
        showToast.info('Removed from Watched');
      } else {
        await watchedApi.add(media);
        showToast.success('Marked as Watched 🍿');
      }
      qc.invalidateQueries({ queryKey: ['watched'] });
    } catch {
      showToast.error('Action failed');
    }
  };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Media>) => (
      <CatalogMovieCard
        item={item}
        isFav={favIds.includes(item.id)}
        isWatchlisted={watchIds.includes(item.id)}
        isWatched={watchedIds.includes(item.id)}
        onToggleFav={handleToggleFav}
        onToggleWatchlist={handleToggleWatchlist}
        onToggleWatched={handleToggleWatched}
      />
    ),
    [favIds, watchIds, watchedIds, isAuthenticated]
  );

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <View style={styles.root}>
      {/* Native Apple Header */}
      <IOSHeader
        title={typeConfig.title}
        subtitle={typeConfig.subtitle}
        rightAction={<Film size={18} color={colors.primary} />}
      />

      {/* Catalog Grid */}
      <FlatList<Media>
        data={allMovies}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        onRefresh={refetch}
        refreshing={isRefetching || (isLoading && allMovies.length === 0)}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          typeConfig.description ? (
            <View style={styles.descriptionHeader}>
              <Text style={styles.descriptionText}>{typeConfig.description}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyWrap}>
              <Film size={40} color={colors.secondaryLabel} />
              <Text style={styles.emptyTitle}>No content found</Text>
              <Text style={styles.emptySub}>
                We couldn't find any titles in this catalog collection.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  gridContainer: {
    padding: spacing.lg,
    paddingBottom: 110,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  descriptionHeader: {
    paddingBottom: 16,
  },
  descriptionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.secondaryLabel,
    lineHeight: 18,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  posterContainer: {
    position: 'relative',
  },
  cardActionPills: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'column',
    gap: 4,
  },
  pillBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  pillBtnActiveRed: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  pillBtnActiveBlue: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  pillBtnActiveGreen: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  cardInfo: {
    padding: 10,
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFC107',
  },
  yearText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  seriesTag: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: colors.primary,
    backgroundColor: 'rgba(229,9,20,0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
