import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { moviesApi, tvApi } from '@/api/movies';
import { favoritesApi, watchlistApi } from '@/api/lists';
import { useAuthStore } from '@/stores/auth.store';
import type { Media } from '@/types';
import { colors } from '@/theme';
import { HeroCarousel } from '@/components/media/HeroCarousel';
import { MovieRow } from '@/components/media/MovieRow';
import { TrendingRankedRow } from '@/components/media/TrendingRankedRow';
import { CategoryShowcaseGrid } from '@/components/home/CategoryShowcaseGrid';
import showToast from '@/lib/toast';

// ─── Query keys ──────────────────────────────────────────────────────────────

const KEYS = {
  trending:       ['movies', 'trending'] as const,
  trendingIndian: ['movies', 'trending-indian'] as const,
  popular:        ['movies', 'popular'] as const,
  topRated:       ['movies', 'top-rated'] as const,
  anime:          ['movies', 'anime'] as const,
  tvPopular:      ['tv', 'popular'] as const,
  watchlistIds:   ['lists', 'watchlist', 'ids'] as const,
  favIds:         ['lists', 'favorites', 'ids'] as const,
};

// ─── Home screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  // ── Movie rows ──────────────────────────────────────────────────────────────
  const trending = useQuery({
    queryKey: KEYS.trending,
    queryFn: () => moviesApi.trending(),
    staleTime: 5 * 60 * 1000,
  });

  const trendingIndian = useQuery({
    queryKey: KEYS.trendingIndian,
    queryFn: () => moviesApi.trendingIndian(),
    staleTime: 5 * 60 * 1000,
  });

  const popular = useQuery({
    queryKey: KEYS.popular,
    queryFn: () => moviesApi.popular(),
    staleTime: 10 * 60 * 1000,
  });

  const topRated = useQuery({
    queryKey: KEYS.topRated,
    queryFn: () => moviesApi.topRated(),
    staleTime: 30 * 60 * 1000,
  });

  const anime = useQuery({
    queryKey: KEYS.anime,
    queryFn: () => moviesApi.anime(),
    staleTime: 30 * 60 * 1000,
  });

  const tvPopular = useQuery({
    queryKey: KEYS.tvPopular,
    queryFn: () => tvApi.popular(),
    staleTime: 10 * 60 * 1000,
  });

  // ── List membership (watchlist + favs for logged-in users) ────────────────
  const watchlistIdsQuery = useQuery({
    queryKey: KEYS.watchlistIds,
    queryFn: () => watchlistApi.ids(),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const favIdsQuery = useQuery({
    queryKey: KEYS.favIds,
    queryFn: () => favoritesApi.ids(),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const watchlistIds = useMemo(
    () => watchlistIdsQuery.data ?? [],
    [watchlistIdsQuery.data]
  );
  const favIds = useMemo(
    () => favIdsQuery.data ?? [],
    [favIdsQuery.data]
  );

  // ── Hero candidates ────────────────────────────────────────────────────────
  const allTrending = trending.data?.results ?? [];
  const allPopular  = popular.data?.results ?? [];
  const source = allTrending.length > 0 ? allTrending : allPopular;
  const heroCandidates = source.filter(
    (m) =>
      Boolean(m.backdrop_path && m.poster_path && m.overview) &&
      (m.vote_average ?? 0) >= 6
  );
  const heroMovies =
    heroCandidates.length >= 4
      ? heroCandidates.slice(0, 8)
      : source.slice(0, 8);

  // ── Watchlist toggle (optimistic) ─────────────────────────────────────────
  const handleWatchlistToggle = useCallback(
    async (movie: Media) => {
      if (!user) {
        showToast.error('Log in to manage your Watchlist.');
        return;
      }
      const title = movie.title ?? movie.name ?? 'this title';
      const inList = watchlistIds.includes(movie.id);

      // Optimistic update
      qc.setQueryData<number[]>(KEYS.watchlistIds, (prev = []) =>
        inList ? prev.filter((id) => id !== movie.id) : [...prev, movie.id]
      );

      try {
        if (inList) {
          await watchlistApi.remove(movie.id);
          showToast.info(`Removed "${title}" from Watchlist`);
        } else {
          await watchlistApi.add(movie);
          showToast.success(`Added "${title}" to Watchlist`);
        }
      } catch {
        // Rollback
        qc.setQueryData<number[]>(KEYS.watchlistIds, (prev = []) =>
          inList ? [...prev, movie.id] : prev.filter((id) => id !== movie.id)
        );
        showToast.error('Failed to update Watchlist');
      }
    },
    [user, watchlistIds, qc]
  );

  // ── Fav toggle (optimistic) ───────────────────────────────────────────────
  const handleFavToggle = useCallback(
    async (movie: Media) => {
      if (!user) {
        showToast.error('Log in to manage your Favourites.');
        return;
      }
      const title = movie.title ?? movie.name ?? 'this title';
      const isFav = favIds.includes(movie.id);

      // Optimistic update
      qc.setQueryData<number[]>(KEYS.favIds, (prev = []) =>
        isFav ? prev.filter((id) => id !== movie.id) : [...prev, movie.id]
      );

      try {
        if (isFav) {
          await favoritesApi.remove(movie.id);
          showToast.info(`Removed "${title}" from Favourites`);
        } else {
          await favoritesApi.add(movie);
          showToast.success(`Added "${title}" to Favourites ❤️`);
        }
      } catch {
        // Rollback
        qc.setQueryData<number[]>(KEYS.favIds, (prev = []) =>
          isFav ? [...prev, movie.id] : prev.filter((id) => id !== movie.id)
        );
        showToast.error('Failed to update Favourites');
      }
    },
    [user, favIds, qc]
  );

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all(
      Object.values(KEYS).map((key) => qc.invalidateQueries({ queryKey: key }))
    );
    setRefreshing(false);
  }, [qc]);

  const heroLoading = trending.isLoading && popular.isLoading;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: 0 }]}
      showsVerticalScrollIndicator={false}
      bounces={true}
      scrollEventThrottle={16}
      decelerationRate="normal"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* ── Hero ──────────────────────────────────────────────────── */}
      {heroLoading ? (
        <View style={styles.heroSkeleton} />
      ) : heroMovies.length > 0 ? (
        <HeroCarousel
          movies={heroMovies}
          watchlistIds={watchlistIds}
          onWatchlistToggle={handleWatchlistToggle}
        />
      ) : null}

      {/* ── Trending Now ──────────────────────────────────────────── */}
      <MovieRow
        title="Trending Now"
        movies={trending.data?.results ?? []}
        isLoading={trending.isLoading}
        favIds={favIds}
        onFavToggle={handleFavToggle}
        seeMoreLink="/catalog/trending"
      />

      {/* ── Trending in India ─────────────────────────────────────── */}
      <TrendingRankedRow
        title="Trending in India"
        movies={trendingIndian.data?.results ?? []}
        isLoading={trendingIndian.isLoading}
        favIds={favIds}
        onFavToggle={handleFavToggle}
      />

      {/* ── Popular Movies ────────────────────────────────────────── */}
      <MovieRow
        title="Popular Movies"
        movies={popular.data?.results ?? []}
        isLoading={popular.isLoading}
        favIds={favIds}
        onFavToggle={handleFavToggle}
        seeMoreLink="/catalog/popular"
      />

      {/* ── Top Rated ─────────────────────────────────────────────── */}
      <MovieRow
        title="Top Rated Features"
        movies={topRated.data?.results ?? []}
        isLoading={topRated.isLoading}
        favIds={favIds}
        onFavToggle={handleFavToggle}
        seeMoreLink="/catalog/top-rated"
      />

      {/* ── Japanese Anime ────────────────────────────────────────── */}
      <MovieRow
        title="Japanese Anime"
        subtitle="Top picks from the world of animation"
        movies={anime.data?.results ?? []}
        isLoading={anime.isLoading}
        favIds={favIds}
        onFavToggle={handleFavToggle}
        seeMoreLink="/catalog/anime"
      />

      {/* ── Popular TV Series ─────────────────────────────────────── */}
      <MovieRow
        title="Popular TV Series"
        subtitle="Binge-worthy shows you can't miss"
        movies={tvPopular.data?.results ?? []}
        isLoading={tvPopular.isLoading}
        favIds={favIds}
        onFavToggle={handleFavToggle}
        seeMoreLink="/catalog/series"
      />

      {/* ── Aesthetic Category & Genre Showcase Grid ───────────────── */}
      <CategoryShowcaseGrid />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 110,
  },
  heroSkeleton: {
    width: '100%',
    height: Math.max(Math.round(Dimensions.get('window').height * 0.94), 780),
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
});
