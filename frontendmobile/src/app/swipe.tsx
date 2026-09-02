import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, X, Star, Info } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';

import { moviesApi } from '@/api/movies';
import { favoritesApi } from '@/api/lists';
import { useAuthStore } from '@/stores/auth.store';
import { colors, fonts, radius, spacing, springPresets } from '@/theme';
import { posterUrl } from '@/lib/images';
import { getEnglishTitle } from '@/lib/format';
import { getGenreNames } from '@/constants/genreMap';
import { IOSPressable } from '@/components/ios/IOSPressable';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 360);
const SWIPE_CARD_HEIGHT = Math.round(SWIPE_CARD_WIDTH * 1.48);
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.32;

export default function MovieSwipeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['movies', 'swipe-recommendations'],
    queryFn: () => moviesApi.popular(1),
    staleTime: 10 * 60 * 1000,
  });

  const movies = data?.results ?? [];
  const currentMovie = movies[currentIndex];

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const handleLike = useCallback(async () => {
    if (!currentMovie) return;
    const title = getEnglishTitle(currentMovie);

    if (user) {
      try {
        await favoritesApi.add(currentMovie);
        showToast.success(`Added "${title}" to Favorites ❤️`);
      } catch {
        // quiet error
      }
    } else {
      showToast.info(`Liked "${title}"! Log in to save to Favorites.`);
    }

    translateX.value = 0;
    translateY.value = 0;
    setCurrentIndex((prev) => prev + 1);
  }, [currentMovie, user, translateX, translateY]);

  const handlePass = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
    setCurrentIndex((prev) => prev + 1);
  }, [translateX, translateY]);

  const handleInfo = useCallback(() => {
    if (!currentMovie) return;
    const mediaType = currentMovie.media_type ?? (currentMovie.title ? 'movie' : 'tv');
    router.push(`/${mediaType}/${currentMovie.id}` as never);
  }, [currentMovie]);

  const onSwipeRightJS = useCallback(() => {
    handleLike();
  }, [handleLike]);

  const onSwipeLeftJS = useCallback(() => {
    handlePass();
  }, [handlePass]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.4;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 250 }, () => {
          runOnJS(onSwipeRightJS)();
        });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 250 }, () => {
          runOnJS(onSwipeLeftJS)();
        });
      } else {
        translateX.value = withSpring(0, springPresets.interactive);
        translateY.value = withSpring(0, springPresets.interactive);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-14, 0, 14]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <IOSPressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
          activeScale={0.9}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.4} />
        </IOSPressable>
        <View style={styles.titleContainer}>
          <Text style={styles.topBarTitle}>Movie Match</Text>
          <Text style={styles.topBarSub}>Swipe right to favorite</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Card Arena */}
      <View style={styles.arena}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : currentMovie ? (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
              <Image
                source={{ uri: posterUrl(currentMovie.poster_path, 'original') || undefined }}
                style={styles.poster}
                contentFit="cover"
              />
              {/* Smooth linear gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(10,10,12,0.65)', 'rgba(10,10,12,0.95)']}
                locations={[0.4, 0.7, 1]}
                style={StyleSheet.absoluteFill}
              />

              {/* Movie Info */}
              <View style={styles.cardContent}>
                <View style={styles.metaRow}>
                  {currentMovie.vote_average ? (
                    <View style={styles.ratingBadge}>
                      <Star size={11} color="#FFC107" fill="#FFC107" />
                      <Text style={styles.ratingText}>{currentMovie.vote_average.toFixed(1)}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.yearText}>
                    {(currentMovie.release_date ?? currentMovie.first_air_date)?.slice(0, 4)}
                  </Text>
                </View>

                <Text style={styles.movieTitle} numberOfLines={2}>
                  {getEnglishTitle(currentMovie)}
                </Text>

                {/* Genre Pills */}
                <View style={styles.genresRow}>
                  {getGenreNames(currentMovie.genre_ids, 3).map((g) => (
                    <View key={g} style={styles.genrePill}>
                      <Text style={styles.genrePillText}>{g}</Text>
                    </View>
                  ))}
                </View>

                {currentMovie.overview ? (
                  <Text style={styles.overview} numberOfLines={3}>
                    {currentMovie.overview}
                  </Text>
                ) : null}
              </View>
            </Animated.View>
          </GestureDetector>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>You&apos;re all caught up!</Text>
            <Text style={styles.emptySub}>Check back soon for more recommendations.</Text>
            <IOSPressable
              style={styles.restartBtn}
              onPress={() => setCurrentIndex(0)}
              activeScale={0.96}
              accessibilityRole="button"
              accessibilityLabel="Start over"
            >
              <Text style={styles.restartBtnText}>Start Over</Text>
            </IOSPressable>
          </View>
        )}
      </View>

      {/* Control Buttons: [Pass (X)]  [Info (i)]  [Like (Heart)] */}
      {currentMovie && (
        <View style={styles.controlsRow}>
          <IOSPressable
            style={[styles.actionBtn, styles.passBtn]}
            onPress={handlePass}
            activeScale={0.9}
            accessibilityRole="button"
            accessibilityLabel="Pass"
          >
            <X size={26} color="#EF4444" strokeWidth={2.5} />
          </IOSPressable>

          <IOSPressable
            style={[styles.actionBtn, styles.infoBtn]}
            onPress={handleInfo}
            activeScale={0.9}
            accessibilityRole="button"
            accessibilityLabel="Details"
          >
            <Info size={22} color="#06B6D4" strokeWidth={2.2} />
          </IOSPressable>

          <IOSPressable
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={handleLike}
            activeScale={0.9}
            accessibilityRole="button"
            accessibilityLabel="Like and add to favorites"
          >
            <Heart size={26} color="#10B981" fill="#10B981" />
          </IOSPressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    minHeight: 36,
    minWidth: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: '#FFFFFF',
  },
  topBarSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondaryLabel,
  },
  arena: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: SWIPE_CARD_WIDTH,
    height: SWIPE_CARD_HEIGHT,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,193,7,0.2)',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.4)',
  },
  ratingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFC107',
  },
  yearText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#D1D5DB',
  },
  movieTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  genrePill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  genrePillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: '#FFFFFF',
  },
  overview: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 17,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    paddingBottom: 36,
  },
  actionBtn: {
    width: 60,
    height: 60,
    minHeight: 60,
    minWidth: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  passBtn: {
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  infoBtn: {
    width: 48,
    height: 48,
    minHeight: 48,
    minWidth: 48,
    borderRadius: 24,
    borderColor: 'rgba(6,182,212,0.35)',
    backgroundColor: 'rgba(6,182,212,0.1)',
  },
  likeBtn: {
    borderColor: 'rgba(16,185,129,0.35)',
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 18,
  },
  restartBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  restartBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
