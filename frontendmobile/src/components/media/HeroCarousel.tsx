import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ScrollView,
  type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Play,
  Plus,
  Check,
  Star,
  User as UserIcon,
  Info,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import type { Media } from '@/types';
import { colors, radius, fonts } from '@/theme';
import { backdropUrl, posterUrl } from '@/lib/images';
import { getEnglishTitle } from '@/lib/format';
import { getGenreNames } from '@/constants/genreMap';
import { moviesApi } from '@/api/movies';
import { PlotmintLogo } from '@/components/ui/PlotmintLogo';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { openTrailerInYouTube } from '@/lib/trailer';
import { useAuthStore } from '@/stores/auth.store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.max(Math.round(SCREEN_HEIGHT * 0.94), 780);
const AUTO_ADVANCE_MS = 8000;

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

// ─── Dot indicator ───────────────────────────────────────────────────────────

function Dot({ active }: { active: boolean }) {
  const anim = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    anim.value = withTiming(active ? 1 : 0, { duration: 350 });
  }, [active, anim]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(anim.value, [0, 1], [6, 20], Extrapolation.CLAMP),
    opacity: interpolate(anim.value, [0, 1], [0.35, 1], Extrapolation.CLAMP),
    backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

// ─── Single Hero Slide ────────────────────────────────────────────────────────

interface SlideProps {
  movie: Media;
  watchlistIds: number[];
  onWatchlistToggle: (movie: Media) => void;
}

function HeroSlide({ movie, watchlistIds, onWatchlistToggle }: SlideProps) {
  const [activeTab, setActiveTab] = useState<'suggested' | 'extras' | 'details'>('suggested');
  const title = getEnglishTitle(movie).toUpperCase();

  const imageUri =
    posterUrl(movie.poster_path, 'original') ||
    backdropUrl(movie.backdrop_path, 'w1280');

  const mediaType =
    movie.media_type === 'tv' || (!movie.title && Boolean(movie.name))
      ? 'tv'
      : 'movie';
  const genres = getGenreNames(movie.genre_ids, 3);
  const year =
    (movie.release_date ?? movie.first_air_date)?.slice(0, 4) || '2026';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '7.5';
  const isWatchlisted = watchlistIds.includes(movie.id);

  // Fetch full details (similar + recommendations) for the active hero movie
  const { data: detailData } = useQuery({
    queryKey: ['movies', 'hero-detail', movie.id],
    queryFn: () => moviesApi.detail(movie.id, mediaType),
    staleTime: 15 * 60 * 1000,
  });

  const similarMovies = useMemo(() => {
    const recs = (detailData as any)?.recommendations?.results || [];
    const sims = (detailData as any)?.similar?.results || [];
    const combined = [...recs, ...sims].filter(
      (m: any) => m.id && m.id !== movie.id && (m.backdrop_path || m.poster_path)
    );
    const unique = Array.from(new Map(combined.map((m: any) => [m.id, m])).values());
    return unique.slice(0, 10);
  }, [detailData, movie.id]);

  const handlePlayTrailer = () => {
    openTrailerInYouTube({
      title: getEnglishTitle(movie),
      mediaId: movie.id,
      mediaType,
    });
  };

  return (
    <View style={styles.slide}>
      {/* Background Cinematic Poster/Backdrop Artwork */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.backdrop}
          contentFit="cover"
          contentPosition="top center"
          cachePolicy="memory-disk"
          transition={400}
        />
      ) : (
        <View style={[styles.backdrop, { backgroundColor: '#181028' }]} />
      )}

      {/* Top subtle vignette for header legibility */}
      <LinearGradient
        colors={['rgba(10,10,12,0.85)', 'rgba(10,10,12,0.4)', 'transparent']}
        locations={[0, 0.45, 1]}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Multi-stage cinematic fade */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(10,10,12,0.08)',
          'rgba(10,10,12,0.6)',
          'rgba(10,10,12,0.95)',
          '#0A0A0C',
        ]}
        locations={[0, 0.35, 0.58, 0.78, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Hero Content Area */}
      <View style={styles.content}>
        {/* Spotlight Badge */}
        <View style={styles.spotlightBadge}>
          <Text style={styles.spotlightText}>FEATURED PREMIERE</Text>
        </View>

        {/* Title */}
        <Text style={styles.heroTitle} numberOfLines={2}>
          {title}
        </Text>

        {/* Badges line */}
        <View style={styles.badgesLine}>
          <View style={styles.certBadge}>
            <Text style={styles.certText}>12+</Text>
          </View>
          <View style={styles.certBadge}>
            <Text style={styles.certText}>CC</Text>
          </View>
          <Text style={styles.metaYear}>{year}</Text>
          <Text style={styles.metaBullet}>•</Text>
          <Text style={styles.metaRuntime}>
            {mediaType === 'movie'
              ? movie.runtime
                ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
                : '1h 54m'
              : 'Series'}
          </Text>
          <Text style={styles.metaBullet}>•</Text>
          <View style={styles.ratingBadge}>
            <Star size={11} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>

        {/* Genre Pills */}
        <View style={styles.genreRow}>
          {genres.map((g) => (
            <View key={g} style={styles.genrePill}>
              <Text style={styles.genrePillText}>{g}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons: [▶ TRAILER] [DETAILS] [+] */}
        <View style={styles.ctaRow}>
          <IOSPressable
            style={styles.trailerBtn}
            onPress={handlePlayTrailer}
            activeScale={0.95}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={`Watch trailer of ${title}`}
          >
            <Play size={14} color="#000000" fill="#000000" />
            <Text style={styles.trailerBtnText}>TRAILER</Text>
          </IOSPressable>

          <IOSPressable
            style={styles.detailsBtn}
            onPress={() => router.push(`/${mediaType}/${movie.id}` as never)}
            activeScale={0.95}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={`Details of ${title}`}
          >
            <Info size={14} color="#FFFFFF" />
            <Text style={styles.detailsBtnText}>DETAILS</Text>
          </IOSPressable>

          <IOSPressable
            style={[
              styles.plusBtn,
              isWatchlisted && styles.plusBtnActive,
            ]}
            onPress={() => onWatchlistToggle(movie)}
            activeScale={0.88}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={
              isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'
            }
          >
            {isWatchlisted ? (
              <Check size={18} color="#FFFFFF" strokeWidth={2.8} />
            ) : (
              <Plus size={19} color="#FFFFFF" strokeWidth={2.2} />
            )}
          </IOSPressable>
        </View>

        {/* Overview text */}
        {movie.overview ? (
          <Text style={styles.heroOverview} numberOfLines={2}>
            {movie.overview}
          </Text>
        ) : null}

        {/* ── Suggested / Extras / Details Section (Matches Web HeroSection) ── */}
        <View style={styles.tabsSection}>
          {/* Tabs Bar with Active Underline */}
          <View style={styles.tabsBar}>
            {(['suggested', 'extras', 'details'] as const).map((tab) => (
              <IOSPressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={styles.tabBtn}
                activeScale={0.94}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === tab && styles.tabBtnTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                {activeTab === tab && <View style={styles.tabActiveUnderline} />}
              </IOSPressable>
            ))}
          </View>

          {/* Tab Content: Suggested Movies Horizontal Reel */}
          {activeTab === 'suggested' && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedScrollContent}
              nestedScrollEnabled
            >
              {similarMovies.length > 0
                ? similarMovies.map((sm: any) => {
                    const smPoster =
                      backdropUrl(sm.backdrop_path, 'w780') ||
                      posterUrl(sm.poster_path, 'w500');
                    const smTitle = getEnglishTitle(sm);
                    const smVote = sm.vote_average ? sm.vote_average.toFixed(1) : '7.0';
                    const smType = sm.media_type || (sm.title ? 'movie' : 'tv');

                    return (
                      <IOSPressable
                        key={sm.id}
                        style={styles.suggestedCard}
                        onPress={() => router.push(`/${smType}/${sm.id}` as never)}
                        activeScale={0.94}
                      >
                        {smPoster ? (
                          <Image
                            source={{ uri: smPoster }}
                            style={StyleSheet.absoluteFillObject}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={[
                              StyleSheet.absoluteFillObject,
                              { backgroundColor: '#1A1A22' },
                            ]}
                          />
                        )}

                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.88)']}
                          locations={[0.2, 1]}
                          style={StyleSheet.absoluteFillObject}
                        />

                        {/* Top Rating Badge */}
                        <View style={styles.suggestedRatingBadge}>
                          <Star size={9} color="#F59E0B" fill="#F59E0B" />
                          <Text style={styles.suggestedRatingText}>{smVote}</Text>
                        </View>

                        {/* Bottom Title */}
                        <View style={styles.suggestedTitleWrap}>
                          <Text style={styles.suggestedTitle} numberOfLines={1}>
                            {smTitle}
                          </Text>
                        </View>
                      </IOSPressable>
                    );
                  })
                : Array.from({ length: 4 }).map((_, i) => (
                    <View key={i} style={styles.suggestedCardSkeleton} />
                  ))}
            </ScrollView>
          )}

          {/* Tab Content: Extras */}
          {activeTab === 'extras' && (
            <View style={styles.extrasWrap}>
              <Text style={styles.extrasText}>
                Bonus content, behind-the-scenes footage, and deleted scenes coming soon.
              </Text>
            </View>
          )}

          {/* Tab Content: Details */}
          {activeTab === 'details' && (
            <View style={styles.detailsGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>RELEASE YEAR</Text>
                <Text style={styles.detailValue}>{year}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>RUNTIME</Text>
                <Text style={styles.detailValue}>
                  {movie.runtime
                    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
                    : '1h 54m'}
                </Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>RATING</Text>
                <Text style={styles.detailValue}>{rating} / 10</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>GENRES</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {genres.join(', ') || 'N/A'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Main Hero Carousel ──────────────────────────────────────────────────────

interface Props {
  movies: Media[];
  watchlistIds?: number[];
  onWatchlistToggle?: (movie: Media) => void;
  onAvatarPress?: () => void;
}

export function HeroCarousel({
  movies,
  watchlistIds = [],
  onWatchlistToggle,
  onAvatarPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Media>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleToggle = useCallback(
    (movie: Media) => onWatchlistToggle?.(movie),
    [onWatchlistToggle]
  );

  const advance = useCallback(() => {
    setActiveIndex((prev) => {
      const next = (prev + 1) % movies.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      return next;
    });
  }, [movies.length]);

  useEffect(() => {
    if (movies.length <= 1) return;
    timerRef.current = setInterval(advance, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advance, movies.length]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, AUTO_ADVANCE_MS);
  }, [advance]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Media }) => (
      <HeroSlide
        movie={item}
        watchlistIds={watchlistIds}
        onWatchlistToggle={handleToggle}
      />
    ),
    [watchlistIds, handleToggle]
  );

  const keyExtractor = useCallback((item: Media) => String(item.id), []);

  if (!movies.length) return null;

  return (
    <View style={styles.root}>
      {/* Top Header Bar Overlay: Logo on Left, User Avatar on Right */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
        <PlotmintLogo size={22} />
        <IOSPressable
          style={styles.avatarBtn}
          onPress={() => {
            if (onAvatarPress) {
              onAvatarPress();
            } else {
              router.push('/(tabs)/profile' as never);
            }
          }}
          activeScale={0.92}
          accessibilityRole="button"
          accessibilityLabel="User Profile"
        >
          {user ? (
            <View style={styles.avatarCircle}>
              <UserIcon size={16} color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.guestAvatarCircle}>
              <UserIcon size={15} color="rgba(255,255,255,0.75)" />
            </View>
          )}
        </IOSPressable>
      </View>

      {/* Carousel FlatList */}
      <FlatList<Media>
        ref={listRef}
        data={movies}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onScrollBeginDrag={resetTimer}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        decelerationRate="fast"
        bounces={false}
        getItemLayout={(_data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Dot Indicators */}
      {movies.length > 1 && (
        <View style={styles.dots}>
          {movies.map((_, i) => (
            <Dot key={i} active={i === activeIndex} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: '#0A0A0C',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  avatarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    zIndex: 10,
    gap: 7,
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginBottom: 1,
  },
  spotlightText: {
    fontFamily: fonts.headingSemi,
    fontSize: 9.5,
    color: '#FBBF24',
    letterSpacing: 1.1,
  },
  heroTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 31,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  badgesLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  certBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  certText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFFFFF',
  },
  metaYear: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  metaBullet: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  metaRuntime: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  ratingText: {
    fontFamily: fonts.headingSemi,
    fontSize: 11,
    color: '#FBBF24',
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  genrePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  genrePillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.85)',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  trailerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  trailerBtnText: {
    fontFamily: fonts.heading,
    fontSize: 11.5,
    color: '#000000',
    letterSpacing: 0.4,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  detailsBtnText: {
    fontFamily: fonts.heading,
    fontSize: 11.5,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  heroOverview: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.76)',
    lineHeight: 16,
    marginTop: 1,
  },
  // ── Tabs and Suggestions Styles ──
  tabsSection: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  tabBtn: {
    position: 'relative',
    paddingVertical: 4,
  },
  tabBtnText: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.heading,
  },
  tabActiveUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  suggestedScrollContent: {
    gap: 10,
    paddingRight: 16,
    paddingVertical: 2,
  },
  suggestedCard: {
    width: 145,
    height: 82,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#15151A',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  suggestedCardSkeleton: {
    width: 145,
    height: 82,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  suggestedRatingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderRadius: 4,
    paddingHorizontal: 4.5,
    paddingVertical: 1.5,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  suggestedRatingText: {
    fontFamily: fonts.headingSemi,
    fontSize: 9.5,
    color: '#FBBF24',
  },
  suggestedTitleWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  suggestedTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 10.5,
    color: '#FFFFFF',
  },
  extrasWrap: {
    paddingVertical: 8,
  },
  extrasText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 17,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 6,
  },
  detailCol: {
    width: '46%',
  },
  detailLabel: {
    fontFamily: fonts.headingSemi,
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.85)',
  },
  dots: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    zIndex: 20,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
});


