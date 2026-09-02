import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Heart, Tv } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { Media } from '@/types';
import { colors, radius, shadows, createTextShadow } from '@/theme';
import { getEnglishTitle } from '@/lib/format';
import { posterSize, POSTER_ASPECT, HIT_SLOP } from '@/theme/layout';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { PosterImage } from './PosterImage';

interface Props {
  movie: Media;
  isFav?: boolean;
  onFavToggle?: (movie: Media) => void;
  /** Width override — defaults to posterSize.md (135) */
  width?: number;
}

/**
 * Vertical poster card with Apple spring touch physics and subtle liquid depth.
 * Memoized — rendered as a FlatList row in every movie rail on the app, so an
 * unrelated prop change on the row (e.g. another card's favorite toggling)
 * shouldn't re-render every card in view.
 */
function MovieCardComponent({ movie, isFav = false, onFavToggle, width }: Props) {
  const cardWidth = width ?? posterSize.md;
  const cardHeight = Math.round(cardWidth / POSTER_ASPECT);

  const mediaType = movie.media_type ?? (movie.title ? 'movie' : 'tv');
  const title = getEnglishTitle(movie);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

  const handlePress = useCallback(() => {
    router.push(`/${mediaType}/${movie.id}` as never);
  }, [mediaType, movie.id]);

  const handleFavPress = useCallback(
    (e: { stopPropagation?: () => void }) => {
      e.stopPropagation?.();
      onFavToggle?.(movie);
    },
    [movie, onFavToggle]
  );

  return (
    <IOSPressable
      style={[styles.root, { width: cardWidth }]}
      onPress={handlePress}
      activeScale={0.96}
      activeOpacity={0.9}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={`${title}${rating ? `, rated ${rating}` : ''}`}
    >
      {/* Poster */}
      <View style={[styles.posterWrap, { width: cardWidth, height: cardHeight }]}>
        <PosterImage
          path={movie.poster_path}
          title={title}
          movieId={movie.id}
          width={cardWidth}
          height={cardHeight}
        />

        {/* TV Series badge */}
        {mediaType === 'tv' && (
          <View style={styles.tvBadge}>
            <Tv size={9} color={colors.text} />
            <Text style={styles.tvBadgeText}>SERIES</Text>
          </View>
        )}

        {/* Favourite button */}
        <IOSPressable
          style={[styles.favBtn, isFav && styles.favBtnActive]}
          onPress={handleFavPress}
          activeScale={0.88}
          activeOpacity={0.8}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={isFav ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Heart
            size={14}
            color={colors.text}
            fill={isFav ? colors.text : 'none'}
            strokeWidth={isFav ? 0 : 2}
          />
        </IOSPressable>

        {/* Bottom gradient overlay: title + rating */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.92)']}
          locations={[0, 0.4, 1]}
          style={styles.overlay}
        >
          <Text style={styles.overlayTitle} numberOfLines={2}>
            {title}
          </Text>
          {rating && (
            <View style={styles.ratingChip}>
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          )}
        </LinearGradient>
      </View>
    </IOSPressable>
  );
}

export const MovieCard = React.memo(MovieCardComponent);

const styles = StyleSheet.create({
  root: {
    marginRight: 10,
  },
  posterWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.posterBg,
    ...shadows.poster,
  },
  tvBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  tvBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    color: colors.text,
    letterSpacing: 0.5,
  },
  favBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    minHeight: 28,
    minWidth: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtnActive: {
    backgroundColor: '#ef4444',
    borderColor: 'transparent',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingBottom: 6,
    paddingTop: 32,
  },
  overlayTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: colors.text,
    lineHeight: 13,
    ...createTextShadow('rgba(0,0,0,0.8)', 0, 1, 3),
  },
  ratingChip: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.amber,
    borderRadius: radius.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  ratingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: '#000',
  },
});

