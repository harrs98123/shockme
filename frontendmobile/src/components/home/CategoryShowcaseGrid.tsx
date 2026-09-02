import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Flame,
  Palette,
  Skull,
  Smile,
  Compass,
  Zap,
  ChevronRight,
  Star,
  Film,
} from 'lucide-react-native';

import { moviesApi } from '@/api/movies';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing, createTextShadow } from '@/theme';
import { posterUrl } from '@/lib/images';
import { getEnglishTitle } from '@/lib/format';
import { IOSPressable } from '@/components/ios/IOSPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

interface CategoryItem {
  id: number;
  name: string;
  tagline: string;
  gradient: [string, string];
  posterPath: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 28,
    name: 'Action',
    tagline: 'High octane thrillers',
    gradient: ['#DC2626', '#7F1D1D'],
    posterPath: '/iADOJ8Zymht2JPMoy3R7xceZprc.jpg', // Furiosa / John Wick
    icon: Flame,
  },
  {
    id: 878,
    name: 'Sci-Fi',
    tagline: 'Interstellar futures',
    gradient: ['#0284C7', '#082F49'],
    posterPath: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', // Deadpool & Wolverine
    icon: Zap,
  },
  {
    id: 27,
    name: 'Horror',
    tagline: 'Dark psychological chills',
    gradient: ['#7C2D12', '#450A0A'],
    posterPath: '/l1175hgL5DoXnqeZQCcU3eZIdhX.jpg', // Terrifier 3
    icon: Skull,
  },
  {
    id: 16,
    name: 'Animation & Anime',
    tagline: 'Anime masterpieces',
    gradient: ['#7C3AED', '#4C1D95'],
    posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', // Spider-Man Across the Spider-Verse
    icon: Palette,
  },
  {
    id: 35,
    name: 'Comedy',
    tagline: 'Laughs & good vibes',
    gradient: ['#D97706', '#78350F'],
    posterPath: '/wWba3TaojhK7NdycRhoQpsG0FaH.jpg', // Despicable Me 4
    icon: Smile,
  },
  {
    id: 12,
    name: 'Adventure',
    tagline: 'Fantasies & quests',
    gradient: ['#059669', '#064E3B'],
    posterPath: '/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg', // Godzilla x Kong
    icon: Compass,
  },
];

export function CategoryShowcaseGrid() {
  const [selectedGenreId, setSelectedGenreId] = useState<number>(28);

  const activeCategory =
    CATEGORIES.find((c) => c.id === selectedGenreId) || CATEGORIES[0];

  // Fetch movies for the currently selected category
  const { data: categoryData } = useQuery({
    queryKey: ['movies', 'discover', 'genre', selectedGenreId],
    queryFn: () =>
      moviesApi.discover({
        with_genres: String(selectedGenreId),
        sort_by: 'popularity.desc',
      }),
    staleTime: 15 * 60 * 1000,
  });

  const categoryMovies = (categoryData?.results || []).slice(0, 10);

  return (
    <View style={styles.container}>
      {/* ── Section Header ── */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.headerBadge}>
            <Film size={12} color="#FBBF24" />
            <Text style={styles.headerBadgeText}>EXPLORE BY GENRE</Text>
          </View>
          <Text style={styles.sectionHeading}>Browse Categories</Text>
        </View>

        <IOSPressable
          style={styles.seeAllBtn}
          onPress={() =>
            router.push(
              `/genre?id=${selectedGenreId}&name=${encodeURIComponent(activeCategory.name)}` as never
            )
          }
          activeScale={0.92}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <ChevronRight size={14} color="#FBBF24" />
        </IOSPressable>
      </View>

      {/* ── 2x3 Clean Aesthetic Category Cards Grid ── */}
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedGenreId === cat.id;
          const IconComp = cat.icon;
          const bgPoster = posterUrl(cat.posterPath, 'w342');

          return (
            <IOSPressable
              key={cat.id}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardSelected,
              ]}
              onPress={() => setSelectedGenreId(cat.id)}
              activeScale={0.95}
            >
              {/* Background Color Gradient */}
              <LinearGradient
                colors={cat.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Ambient Blurred Background Poster */}
              {bgPoster ? (
                <Image
                  source={{ uri: bgPoster }}
                  style={styles.cardBgPoster}
                  contentFit="cover"
                  blurRadius={12}
                />
              ) : null}

              {/* Dark Vignette Overlay for Text Legibility */}
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                locations={[0.1, 0.9]}
                style={StyleSheet.absoluteFill}
              />

              {/* Tilted 3D Real Poster Art in Corner (Aesthetic Netflix/Spotify Style) */}
              {bgPoster ? (
                <View style={styles.tiltedPosterWrap}>
                  <Image
                    source={{ uri: bgPoster }}
                    style={styles.tiltedPosterImg}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)']}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              ) : null}

              {/* Content on Left */}
              <View style={styles.cardContent}>
                {/* Top Row: Icon badge without emoji */}
                <View style={styles.cardIconBox}>
                  <IconComp size={15} color="#FFFFFF" />
                </View>

                {/* Bottom Details */}
                <View style={styles.cardBottom}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <Text style={styles.cardTagline} numberOfLines={1}>
                    {cat.tagline}
                  </Text>
                </View>
              </View>

              {/* Active Selection Glow Ring */}
              {isSelected && <View style={styles.activeIndicatorDot} />}
            </IOSPressable>
          );
        })}
      </View>

      {/* ── Active Category Movies Live Reel ── */}
      <Animated.View
        key={selectedGenreId}
        entering={FadeIn.duration(350)}
        style={styles.reelSection}
      >
        <View style={styles.reelHeaderRow}>
          <Text style={styles.reelTitle}>
            Top in <Text style={{ color: '#FBBF24' }}>{activeCategory.name}</Text>
          </Text>
          <Text style={styles.reelSub}>{activeCategory.tagline}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reelScrollContent}
        >
          {categoryMovies.length > 0
            ? categoryMovies.map((movie: Media, idx) => {
                const title = getEnglishTitle(movie);
                const poster = posterUrl(movie.poster_path, 'w342');
                const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '7.5';

                return (
                  <Animated.View
                    key={movie.id}
                    entering={FadeInDown.delay(idx * 40).duration(300)}
                  >
                    <IOSPressable
                      style={styles.movieCard}
                      onPress={() => router.push(`/movie/${movie.id}` as never)}
                      activeScale={0.94}
                    >
                      <View style={styles.posterWrapper}>
                        {poster ? (
                          <Image
                            source={{ uri: poster }}
                            style={styles.posterImg}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.posterImg, { backgroundColor: '#1E1E26' }]} />
                        )}

                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.85)']}
                          style={styles.posterGradient}
                        />

                        {/* Top Rating Badge */}
                        <View style={styles.ratingBadge}>
                          <Star size={10} color="#F59E0B" fill="#F59E0B" />
                          <Text style={styles.ratingText}>{rating}</Text>
                        </View>
                      </View>

                      <Text style={styles.movieTitle} numberOfLines={1}>
                        {title}
                      </Text>
                    </IOSPressable>
                  </Animated.View>
                );
              })
            : Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={styles.movieSkeleton} />
              ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: 16,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  headerBadgeText: {
    fontFamily: fonts.headingSemi,
    fontSize: 10.5,
    color: '#FBBF24',
    letterSpacing: 1.2,
  },
  sectionHeading: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: '#FFFFFF',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  seeAllText: {
    fontFamily: fonts.headingSemi,
    fontSize: 12.5,
    color: '#FBBF24',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: spacing.lg,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: 106,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: '#FBBF24',
    shadowColor: '#FBBF24',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  cardBgPoster: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  tiltedPosterWrap: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 68,
    height: 98,
    borderRadius: 8,
    overflow: 'hidden',
    transform: [{ rotate: '14deg' }],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#000000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 8,
    elevation: 6,
  },
  tiltedPosterImg: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    zIndex: 3,
    maxWidth: '72%',
  },
  cardIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardBottom: {
    gap: 2,
  },
  cardTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13.5,
    color: '#FFFFFF',
    ...createTextShadow('rgba(0,0,0,0.8)', 0, 1, 3),
  },
  cardTagline: {
    fontFamily: fonts.body,
    fontSize: 9.5,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  activeIndicatorDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FBBF24',
    zIndex: 4,
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
  reelSection: {
    marginTop: 22,
  },
  reelHeaderRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: 12,
  },
  reelTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: '#FFFFFF',
  },
  reelSub: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  reelScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  movieCard: {
    width: 120,
  },
  posterWrapper: {
    width: 120,
    height: 175,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#16161F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  posterImg: {
    width: '100%',
    height: '100%',
  },
  posterGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ratingText: {
    fontFamily: fonts.headingSemi,
    fontSize: 10,
    color: '#FFFFFF',
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
  },
  movieSkeleton: {
    width: 120,
    height: 175,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});
