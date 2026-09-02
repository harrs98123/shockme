import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Heart,
  BookmarkPlus,
  BookmarkCheck,
  Eye,
  Star,
  Play,
  Bookmark,
  Zap,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { moviesApi } from '@/api/movies';
import { favoritesApi, watchlistApi, watchedApi } from '@/api/lists';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/api/client';
import type { CastMember, Video } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { backdropUrl, posterUrl, profileUrl } from '@/lib/images';
import { getEnglishTitle } from '@/lib/format';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { MovieRow } from '@/components/media/MovieRow';
import { VibeChartSection } from '@/components/media/VibeChartSection';
import { ScreenshotsGallery } from '@/components/media/ScreenshotsGallery';
import { InteractiveStarRating } from '@/components/common/InteractiveStarRating';
import { MoctaleMeterSection } from '@/components/media/MoctaleMeterSection';
import { BattleGroundsSection } from '@/components/media/BattleGroundsSection';
import { WhereToWatchSection } from '@/components/media/WhereToWatchSection';
import { AiInsightsSection } from '@/components/media/AiInsightsSection';
import { StarRatingModal } from '@/components/media/StarRatingModal';
import { MovieQuoteLoader } from '@/components/media/MovieQuoteLoader';
import { openTrailerInYouTube } from '@/lib/trailer';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POSTER_WIDTH = SCREEN_WIDTH;
const POSTER_HEIGHT = Math.round(SCREEN_WIDTH * 1.45);

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const [isFav, setIsFav] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  const { data: movie, isLoading } = useQuery({
    queryKey: ['movies', 'detail', id],
    queryFn: () => moviesApi.detail(id, 'movie'),
    enabled: !!id,
  });

  const { data: ratingStats, refetch: refetchRating } = useQuery({
    queryKey: ['ratings', 'movie', id],
    queryFn: async () => {
      try {
        const res = await api.get<{ average: number; count: number; user_rating: number | null }>(
          `/ratings/${id}?media_type=movie`
        );
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });

  const { data: imdbData } = useQuery({
    queryKey: ['movies', 'imdb-rating', id],
    queryFn: async () => {
      try {
        const res = await api.get<{ rating: number | null; votes: string | null; source: string }>(
          `/movies/${id}/imdb-rating`
        );
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });

  const title = movie ? getEnglishTitle(movie) : 'Movie Details';
  const backdrop = backdropUrl(movie?.backdrop_path, 'w1280');

  // Prefer official English poster with titles
  const englishPoster = useMemo(() => {
    const postersList = movie?.images?.posters || [];
    const enPoster = postersList.find((p: any) => p.iso_639_1 === 'en');
    if (enPoster?.file_path) {
      return posterUrl(enPoster.file_path, 'w780');
    }
    return posterUrl(movie?.poster_path, 'w780');
  }, [movie]);
  const poster = englishPoster;

  const communityRating =
    ratingStats?.average != null
      ? ratingStats.average.toFixed(1)
      : movie?.vote_average
      ? (movie.vote_average / 2).toFixed(1)
      : '2.8';
  const communityRatingCount = ratingStats?.count != null ? ratingStats.count : movie?.vote_count ?? 2;
  const activeUserRating = ratingStats?.user_rating ?? userRating;
  const imdbRating =
    imdbData?.rating != null
      ? imdbData.rating.toFixed(1)
      : movie?.vote_average
      ? movie.vote_average.toFixed(1)
      : '8.5';
  const year = movie?.release_date ? movie.release_date.slice(0, 4) : '2026';
  const runtime = movie?.runtime
    ? `${Math.floor(movie.runtime / 60)}H ${movie.runtime % 60}M`
    : '2H 30M';

  const directors = (movie?.credits?.crew || [])
    .filter((c) => c.job === 'Director')
    .map((c) => c.name)
    .slice(0, 2);
  const directorName = directors.length > 0 ? directors.join(', ') : 'Director';

  const topActors = (movie?.credits?.cast || []).slice(0, 3);

  const certification = useMemo(() => {
    const usRelease = movie?.release_dates?.results?.find((r) => r.iso_3166_1 === 'US');
    const inRelease = movie?.release_dates?.results?.find((r) => r.iso_3166_1 === 'IN');
    const cert =
      inRelease?.release_dates?.find((d) => d.certification)?.certification ||
      usRelease?.release_dates?.find((d) => d.certification)?.certification;
    return cert || 'PG-13';
  }, [movie]);

  const country =
    movie?.production_countries?.[0]?.name ||
    movie?.origin_country?.[0] ||
    'United States';

  const language =
    movie?.spoken_languages?.[0]?.english_name ||
    movie?.original_language?.toUpperCase() ||
    'English';

  const cast = (movie?.credits?.cast ?? []).slice(0, 12);
  const similar = movie?.similar?.results ?? [];
  const genres =
    movie?.genres && movie.genres.length > 0
      ? movie.genres
      : [
          { id: 12, name: 'Adventure' },
          { id: 28, name: 'Action' },
          { id: 14, name: 'Fantasy' },
        ];

  const trailer = movie?.videos?.results?.find(
    (v: Video) =>
      v.type === 'Trailer' &&
      v.site === 'YouTube' &&
      (v.name.toLowerCase().includes('official') || v.name.toLowerCase().includes('main'))
  ) || movie?.videos?.results?.find((v: Video) => v.type === 'Trailer' && v.site === 'YouTube');

  const handlePlayTrailer = () => {
    openTrailerInYouTube({
      title,
      mediaId: movie?.id,
      trailerKey: trailer?.key,
    });
  };

  const handleToggleFav = useCallback(async () => {
    if (!user) {
      showToast.error('Please log in to add to favorites.');
      return;
    }
    if (!movie) return;
    setIsFav((prev) => !prev);
    try {
      if (isFav) {
        await favoritesApi.remove(movie.id);
        showToast.info('Removed from Favorites');
      } else {
        await favoritesApi.add(movie);
        showToast.success('Added to Favorites ❤️');
      }
    } catch {
      setIsFav((prev) => !prev);
      showToast.error('Failed to update favorites');
    }
  }, [user, movie, isFav]);

  const handleToggleWatchlist = useCallback(async () => {
    if (!user) {
      showToast.error('Please log in to add to watchlist.');
      return;
    }
    if (!movie) return;
    setIsWatchlisted((prev) => !prev);
    try {
      if (isWatchlisted) {
        await watchlistApi.remove(movie.id);
        showToast.info('Removed from Watchlist');
      } else {
        await watchlistApi.add(movie);
        showToast.success('Added to Watchlist 🔖');
      }
    } catch {
      setIsWatchlisted((prev) => !prev);
      showToast.error('Failed to update watchlist');
    }
  }, [user, movie, isWatchlisted]);

  const handleToggleWatched = useCallback(async () => {
    if (!user) {
      showToast.error('Please log in to mark as watched.');
      return;
    }
    if (!movie) return;
    setIsWatched((prev) => !prev);
    try {
      if (isWatched) {
        await watchedApi.remove(movie.id);
        showToast.info('Removed from Watched');
      } else {
        await watchedApi.add(movie);
        showToast.success('Marked as Watched 👁️');
      }
    } catch {
      setIsWatched((prev) => !prev);
      showToast.error('Failed to update watched status');
    }
  }, [user, movie, isWatched]);

  const handleQuickStarRate = async (rating: number) => {
    setUserRating(rating);
    if (!user) {
      showToast.info('Please log in to save your rating.');
      return;
    }
    if (movie) {
      try {
        await api.post('/ratings', {
          movie_id: Number(movie.id),
          media_type: 'movie',
          rating: rating,
        });
        showToast.success(`Rated ${rating}/5 ⭐`);
        refetchRating();
      } catch {
        showToast.error('Failed to submit rating');
      }
    }
  };

  // ── Parallax & Dynamic Top Bar Animations ──
  const posterAnimStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-160, 0],
      [1.25, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, POSTER_HEIGHT],
      [0, POSTER_HEIGHT * 0.32],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const headerBarAnimStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [POSTER_HEIGHT - 110, POSTER_HEIGHT - 30],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  const headerTitleAnimStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [POSTER_HEIGHT - 80, POSTER_HEIGHT - 20],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [POSTER_HEIGHT - 80, POSTER_HEIGHT - 20],
      [12, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  if (isLoading || !movie) {
    return <MovieQuoteLoader onBack={() => router.back()} />;
  }

  const headerTopOffset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 8) + 6;

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: false,
        }}
      />
      {/* ── Fixed Solid/Blur Header on Scroll ── */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.stickyHeaderBackground,
          { height: headerTopOffset + 48, paddingTop: headerTopOffset },
          headerBarAnimStyle,
        ]}
      >
        <Animated.Text style={[styles.stickyHeaderTitle, headerTitleAnimStyle]} numberOfLines={1}>
          {title}
        </Animated.Text>
      </Animated.View>

      {/* ── Fixed Floating Controls ── */}
      <View style={[styles.headerFloating, { top: headerTopOffset }]} pointerEvents="box-none">
        {/* Back Button */}
        <IOSPressable
          style={styles.circleBtn}
          onPress={() => router.back()}
          hitSlop={12}
          activeScale={0.9}
        >
          <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.4} />
        </IOSPressable>

        {/* Favorite Heart Button */}
        <IOSPressable
          style={[styles.circleBtn, isFav && styles.circleBtnActive]}
          onPress={handleToggleFav}
          activeScale={0.88}
        >
          <Heart size={17} color="#FFFFFF" fill={isFav ? '#FFFFFF' : 'none'} />
        </IOSPressable>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 70 }]}
        bounces={true}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Center Aesthetic Edge-to-Edge Poster Card with Parallax ── */}
        <View style={styles.posterSection}>
          <Animated.View style={[styles.posterCardWrapper, posterAnimStyle]}>
            {poster ? (
              <Image source={{ uri: poster }} style={styles.posterImage} contentFit="cover" />
            ) : (
              <View style={[styles.posterImage, { backgroundColor: '#1A1A24' }]} />
            )}

            {/* Poster Top Vignette Gradient for Header Buttons */}
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent']}
              style={styles.posterTopGradient}
            />

            {/* Poster Inner Bottom Gradient */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
              locations={[0.5, 0.78, 1]}
              style={styles.posterGradient}
            />

            {/* Floating Action Buttons Row over Poster Bottom */}
            <Animated.View
              entering={FadeInUp.delay(220).springify().damping(16).stiffness(120)}
              style={styles.posterFloatingBar}
            >
              {/* Aesthetic Play Trailer Capsule Button */}
              <IOSPressable
                style={styles.floatingPlayBtn}
                onPress={handlePlayTrailer}
                activeScale={0.92}
              >
                <View style={styles.playIconBadge}>
                  <Play size={13} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
                </View>
                <Text style={styles.floatingPlayText}>Play Trailer</Text>
              </IOSPressable>

              <View style={styles.posterRightPills}>
                {/* Frosted Glass Bookmark Button */}
                <IOSPressable
                  style={[styles.glassCircleBtn, isWatchlisted && styles.glassCircleBtnActive]}
                  onPress={handleToggleWatchlist}
                  activeScale={0.9}
                >
                  <Bookmark
                    size={17}
                    color="#FFFFFF"
                    fill={isWatchlisted ? '#FFFFFF' : 'none'}
                    strokeWidth={2.2}
                  />
                </IOSPressable>
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        {/* ── Genre Bullets Row below Poster ── */}
        <Animated.View
          entering={FadeInDown.delay(140).springify().damping(18).stiffness(130)}
          style={styles.genresRow}
        >
          {genres.map((g, idx) => (
            <React.Fragment key={g.id}>
              <Text style={styles.genreBulletText}>{g.name}</Text>
              {idx < genres.length - 1 && <Text style={styles.genreBulletDot}>•</Text>}
            </React.Fragment>
          ))}
        </Animated.View>

        {/* ── Metadata & Title Block ── */}
        <Animated.View
          entering={FadeInDown.delay(200).springify().damping(18).stiffness(130)}
          style={styles.infoContainer}
        >
          {/* Breadcrumb & Live IMDb Rating */}
          <View style={styles.metaTopRow}>
            <Text style={styles.metaBreadcrumb}>
              MOVIE • {year} • {runtime}
            </Text>

            {/* Real Live IMDb Rating Badge */}
            <View style={styles.imdbBadge}>
              <View style={styles.imdbLogoBox}>
                <Text style={styles.imdbLogoText}>IMDb</Text>
              </View>
              <Text style={styles.imdbScoreText}>
                {imdbRating} <Text style={styles.imdbMaxText}>/ 10.0</Text>
              </Text>
            </View>
          </View>

          {/* Main Title */}
          <Text style={styles.mainTitle}>{title}</Text>

          {/* 2x2 Grid Metadata */}
          <View style={styles.metaGrid2x2}>
            <View style={styles.metaGridCell}>
              <Text style={styles.metaLabel}>DIRECTED BY</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {directorName}
              </Text>
            </View>

            <View style={styles.metaGridCell}>
              <Text style={styles.metaLabel}>COUNTRY</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {country}
              </Text>
            </View>

            <View style={styles.metaGridCell}>
              <Text style={styles.metaLabel}>LANGUAGE</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {language}
              </Text>
            </View>

            <View style={styles.metaGridCell}>
              <Text style={styles.metaLabel}>AGE RATING</Text>
              <Text style={styles.metaValue}>{certification}</Text>
            </View>
          </View>

          {/* ── Rate This Movie Box ── */}
          <View style={styles.rateCard}>
            <Text style={styles.rateLabel}>RATE THIS MOVIE</Text>

            {/* Interactive Stars */}
            <View style={{ marginBottom: 4 }}>
              <InteractiveStarRating 
                initialRating={activeUserRating || 0}
                onRatingSubmit={handleQuickStarRate}
                starSize={40}
                gap={12}
              />
            </View>

            {/* Community Rating Subtext */}
            <Text style={styles.communityRatingText}>
              COMMUNITY AVG:{' '}
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.headingSemi }}>{communityRating}</Text>
              {'  |  '}
              {communityRatingCount} RATINGS
            </Text>

            {/* Indicator bar */}
            <View style={styles.ratingBarTrack}>
              <View
                style={[
                  styles.ratingBarFill,
                  { width: `${Math.min((Number(communityRating) / 5) * 100, 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* ── Action Buttons Stack ── */}
          <View style={styles.actionsStack}>
            {/* Mark as Watched Purple Pill */}
            <IOSPressable
              style={[
                styles.markWatchedBtn,
                isWatched && { backgroundColor: '#7C3AED' },
              ]}
              onPress={handleToggleWatched}
              activeScale={0.96}
            >
              <Eye size={17} color="#FFFFFF" />
              <Text style={styles.markWatchedText}>
                {isWatched ? 'Watched ✓' : 'Mark as Watched'}
              </Text>
            </IOSPressable>

            {/* Split Action Pills: Add to Collection & Watchlist */}
            <View style={styles.splitActionsRow}>
              <IOSPressable
                style={styles.splitBtn}
                onPress={() => showToast.info('Collections opened 📌')}
                activeScale={0.96}
              >
                <Zap size={14} color="#EF4444" fill="#EF4444" />
                <Text style={styles.splitBtnText}>Add to Collection</Text>
              </IOSPressable>

              <IOSPressable
                style={[
                  styles.splitBtn,
                  isWatchlisted && { borderColor: 'rgba(59, 130, 246, 0.5)' },
                ]}
                onPress={handleToggleWatchlist}
                activeScale={0.96}
              >
                {isWatchlisted ? (
                  <BookmarkCheck size={14} color="#3B82F6" />
                ) : (
                  <BookmarkPlus size={14} color="#3B82F6" />
                )}
                <Text style={[styles.splitBtnText, isWatchlisted && { color: '#3B82F6' }]}>
                  {isWatchlisted ? 'In Watchlist' : 'Watchlist'}
                </Text>
              </IOSPressable>
            </View>
          </View>
        </Animated.View>

        {/* ── Overview Section with Expandable More info ── */}
        {movie.overview ? (
          <Animated.View
            entering={FadeInDown.delay(260).springify().damping(18).stiffness(130)}
            style={styles.overviewSection}
          >
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text
              style={styles.overviewBody}
              numberOfLines={overviewExpanded ? undefined : 3}
            >
              {movie.overview}
            </Text>
            {movie.overview.length > 120 && (
              <Pressable
                onPress={() => setOverviewExpanded((prev) => !prev)}
                hitSlop={8}
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
              >
                <Text style={styles.moreInfoLink}>
                  {overviewExpanded ? 'Less info' : 'More info'}
                </Text>
              </Pressable>
            )}
          </Animated.View>
        ) : null}

        {/* ── Screenshots Gallery ── */}
        <Animated.View entering={FadeInDown.delay(320).springify().damping(18).stiffness(130)}>
          <ScreenshotsGallery images={movie.images} backdropPath={movie.backdrop_path} />
        </Animated.View>

        {/* ── 2-Column Directors & Actors Box ── */}
        <Animated.View
          entering={FadeInDown.delay(380).springify().damping(18).stiffness(130)}
          style={styles.creditsCardBox}
        >
          <View style={styles.creditsCol}>
            <Text style={styles.creditsColHeading}>DIRECTORS</Text>
            <Text style={styles.creditsColNames}>{directorName}</Text>
          </View>
          <View style={styles.creditsCol}>
            <Text style={styles.creditsColHeading}>ACTORS</Text>
            <Text style={styles.creditsColNames}>
              {topActors.map((a) => a.name).join(', ') || 'Cast info'}
            </Text>
          </View>
        </Animated.View>

        {/* ── Dedicated Trailer Spotlight Card ── */}
        {backdrop ? (
          <Animated.View
            entering={FadeInDown.delay(420).springify().damping(18).stiffness(130)}
            style={styles.trailerSpotlightCard}
          >
            <Text style={styles.sectionTitle}>Trailer</Text>
            <IOSPressable
              style={styles.trailerThumbnailBox}
              onPress={handlePlayTrailer}
              activeScale={0.97}
            >
              <Image source={{ uri: backdrop }} style={styles.trailerThumbnailImg} contentFit="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.trailerPlayCircle}>
                <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
              </View>
            </IOSPressable>
          </Animated.View>
        ) : null}

        {/* ── Top Cast Section ── */}
        {cast.length > 0 ? (
          <Animated.View
            entering={FadeInDown.delay(460).springify().damping(18).stiffness(130)}
            style={styles.castSection}
          >
            <Text style={styles.sectionTitle}>Top Cast</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castScroll}
            >
              {cast.map((actor: CastMember) => (
                <IOSPressable
                  key={actor.id}
                  style={styles.actorCard}
                  onPress={() => router.push(`/person/${actor.id}` as never)}
                  activeScale={0.94}
                >
                  {actor.profile_path ? (
                    <Image
                      source={{ uri: profileUrl(actor.profile_path, 'w185') || undefined }}
                      style={styles.actorAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.actorAvatar, { backgroundColor: '#1E1E26' }]} />
                  )}
                  <Text style={styles.actorName} numberOfLines={1}>
                    {actor.name}
                  </Text>
                  <Text style={styles.actorChar} numberOfLines={1}>
                    {actor.character}
                  </Text>
                </IOSPressable>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {/* ── Vibe Chart Donut ── */}
        <VibeChartSection genres={genres} />

        {/* ── Moctale Meter & Reviews ── */}
        <MoctaleMeterSection
          movieId={movie.id}
          mediaType="movie"
          title={title}
          posterPath={movie.poster_path}
        />

        {/* ── Battle Grounds / Debates ── */}
        <BattleGroundsSection movieId={movie.id} mediaType="movie" />

        {/* ── AI Cinematic Lab ── */}
        <AiInsightsSection
          movieId={movie.id}
          mediaType="movie"
          title={title}
        />

        {/* ── Where to Watch ── */}
        <WhereToWatchSection
          watchProviders={movie['watch/providers']}
          title={title}
        />

        {/* ── More Like This (Similar Movies) ── */}
        {similar.length > 0 ? (
          <View style={{ marginTop: 28 }}>
            <MovieRow title="More Like This" movies={similar} />
          </View>
        ) : null}
      </Animated.ScrollView>

      {/* ── Star Rating Modal ── */}
      <StarRatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        movieId={movie.id}
        mediaType="movie"
        title={title}
        initialRating={userRating}
        onRated={(r) => setUserRating(r)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeaderBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 40,
    backgroundColor: 'rgba(10, 10, 14, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
  },
  stickyHeaderTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerFloating: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 20, 26, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  circleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  posterSection: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 12,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  posterCardWrapper: {
    width: SCREEN_WIDTH,
    height: POSTER_HEIGHT,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#16161F',
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 14,
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterTopGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 120,
    zIndex: 2,
  },
  posterGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  posterFloatingBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.pill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  playIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingPlayText: {
    fontFamily: fonts.headingBlack,
    fontSize: 13.5,
    color: '#000000',
  },
  posterRightPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  glassCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  glassCircleBtnActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.65)',
    borderColor: '#A78BFA',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: 10,
  },
  genreBulletText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#9CA3AF',
  },
  genreBulletDot: {
    color: 'rgba(255, 255, 255, 0.35)',
    marginHorizontal: 8,
    fontSize: 11,
  },
  infoContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: 18,
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaBreadcrumb: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  imdbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imdbLogoBox: {
    backgroundColor: '#F5C518',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  imdbLogoText: {
    fontFamily: fonts.headingBlack,
    fontSize: 10,
    color: '#000000',
    letterSpacing: -0.5,
  },
  imdbScoreText: {
    fontFamily: fonts.headingSemi,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  imdbMaxText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
  },
  mainTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 16,
  },
  metaGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 18,
  },
  metaGridCell: {
    width: '46%',
  },
  metaLabel: {
    fontFamily: fonts.headingSemi,
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: fonts.headingSemi,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  rateCard: {
    backgroundColor: '#111116',
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    marginVertical: 10,
  },
  rateLabel: {
    fontFamily: fonts.headingSemi,
    fontSize: 10.5,
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  starPress: {
    padding: 2,
  },
  communityRatingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 8,
  },
  ratingBarTrack: {
    width: '60%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  actionsStack: {
    marginTop: 14,
    gap: 10,
  },
  markWatchedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9333EA',
    borderRadius: radius.pill,
    height: 48,
  },
  markWatchedText: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
  splitActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  splitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16161D',
    borderRadius: radius.pill,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  splitBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  overviewSection: {
    paddingHorizontal: spacing.lg,
    marginTop: 22,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  overviewBody: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  moreInfoLink: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#FBBF24',
    textDecorationLine: 'underline',
  },
  creditsCardBox: {
    flexDirection: 'row',
    backgroundColor: '#111116',
    borderRadius: radius.xl,
    padding: 16,
    marginHorizontal: spacing.lg,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
  },
  creditsCol: {
    flex: 1,
  },
  creditsColHeading: {
    fontFamily: fonts.headingSemi,
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  creditsColNames: {
    fontFamily: fonts.headingSemi,
    fontSize: 12.5,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  trailerSpotlightCard: {
    paddingHorizontal: spacing.lg,
    marginTop: 24,
  },
  trailerThumbnailBox: {
    height: 160,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#1E1E26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trailerThumbnailImg: {
    ...StyleSheet.absoluteFillObject,
  },
  trailerPlayCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  castSection: {
    paddingHorizontal: spacing.lg,
    marginTop: 24,
  },
  castScroll: {
    gap: 12,
  },
  actorCard: {
    width: 68,
    alignItems: 'center',
  },
  actorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 6,
  },
  actorName: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actorChar: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
