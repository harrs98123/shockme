import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  type ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { getEnglishTitle } from '@/lib/format';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { PosterImage } from './PosterImage';
import { MovieRowSkeleton } from './MovieRowSkeleton';
import { favoritesApi } from '@/api/lists';
import { useAuth } from '@/hooks/useAuth';
import showToast from '@/lib/toast';

const CARD_WIDTH = 150;
const CARD_HEIGHT = 220;
const NUMBER_FONT_SIZE = 120;

interface Props {
  title: string;
  movies: Media[];
  isLoading?: boolean;
  favIds?: number[];
  onFavToggle?: (movie: Media) => void;
}

interface RankedItem {
  movie: Media;
  rank: number;
}

function RankedCard({
  movie,
  rank,
  isFav = false,
  onFavToggle,
}: {
  movie: Media;
  rank: number;
  isFav?: boolean;
  onFavToggle?: (movie: Media) => void;
}) {
  const { isAuthenticated } = useAuth();
  const [localFav, setLocalFav] = useState(isFav);
  const title = getEnglishTitle(movie);
  const mediaType = movie.media_type ?? (movie.title ? 'movie' : 'tv');
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

  const handlePress = () => {
    router.push(`/${mediaType}/${movie.id}` as never);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast.info('Sign in to add favorites');
      return;
    }
    const nextState = !localFav;
    setLocalFav(nextState);
    try {
      if (nextState) {
        await favoritesApi.add(movie);
        showToast.success(`Added "${title}" to Favorites`);
      } else {
        await favoritesApi.remove(movie.id);
        showToast.info(`Removed "${title}" from Favorites`);
      }
      onFavToggle?.(movie);
    } catch {
      setLocalFav(!nextState);
      showToast.error('Action failed');
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Big Ranking Number Behind Card */}
      <Text style={styles.rankNumberText}>{rank}</Text>

      {/* Main Movie Poster Card */}
      <IOSPressable
        style={styles.card}
        onPress={handlePress}
        activeScale={0.96}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`#${rank} ${title}`}
      >
        <PosterImage
          path={movie.poster_path}
          title={title}
          movieId={movie.id}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          borderRadius={20}
        />

        {/* Ambient Dark Bottom Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.92)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Floating Glass Favorite Heart Button */}
        <IOSPressable
          style={styles.favButton}
          onPress={handleToggleFavorite}
          activeScale={0.85}
          accessibilityRole="button"
          accessibilityLabel="Favorite"
        >
          <Heart
            size={16}
            color={localFav ? '#EF4444' : '#FFFFFF'}
            fill={localFav ? '#EF4444' : 'none'}
            strokeWidth={2.2}
          />
        </IOSPressable>

        {/* Bottom Details Row */}
        <View style={styles.cardBottomRow}>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {title}
          </Text>

          {/* Yellow Rating Badge */}
          {rating ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : null}
        </View>
      </IOSPressable>
    </View>
  );
}

export function TrendingRankedRow({
  title,
  movies,
  isLoading = false,
  favIds = [],
  onFavToggle,
}: Props) {
  const data: RankedItem[] = movies
    .slice(0, 10)
    .map((movie, i) => ({ movie, rank: i + 1 }));

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<RankedItem>) => (
      <RankedCard
        movie={item.movie}
        rank={item.rank}
        isFav={favIds.includes(item.movie.id)}
        onFavToggle={onFavToggle}
      />
    ),
    [favIds, onFavToggle]
  );

  const keyExtractor = useCallback((item: RankedItem) => String(item.movie.id), []);

  if (isLoading) return <MovieRowSkeleton />;
  if (!data.length) return null;

  return (
    <View style={styles.root}>
      {/* Header with Red Indicator Bar */}
      <View style={styles.header}>
        <View style={styles.redBar} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <FlatList<RankedItem>
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
        bounces={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  redBar: {
    width: 3.5,
    height: 18,
    backgroundColor: '#E50914',
    borderRadius: 2,
  },
  sectionTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  list: {
    paddingLeft: 16,
    paddingRight: 20,
    paddingBottom: 6,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 18,
    position: 'relative',
  },
  rankNumberText: {
    fontFamily: fonts.headingBlack,
    fontSize: NUMBER_FONT_SIZE,
    color: '#08080B',
    lineHeight: NUMBER_FONT_SIZE * 0.95,
    marginRight: -12,
    zIndex: 0,
    letterSpacing: -4,
    textShadowColor: 'rgba(255,255,255,0.32)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 1,
    includeFontPadding: false,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#121217',
    position: 'relative',
    justifyContent: 'space-between',
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  favButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardBottomRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 10,
    zIndex: 10,
    gap: 6,
  },
  movieTitle: {
    flex: 1,
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 15,
  },
  ratingBadge: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ratingText: {
    fontFamily: fonts.headingBlack,
    fontSize: 10.5,
    color: '#000000',
  },
});
