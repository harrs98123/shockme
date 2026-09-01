import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  type ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Flame, Star, Trophy } from 'lucide-react-native';

import { curatedApi } from '@/api/curated';
import type { MustWatch } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

function MustWatchCard({ item, rank }: { item: MustWatch; rank: number }) {
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const year = item.release_date?.slice(0, 4);

  return (
    <IOSPressable
      style={styles.card}
      onPress={() => router.push(`/movie/${item.movie_id}` as never)}
      activeScale={0.96}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={styles.posterWrapper}>
        <PosterImage
          path={item.poster_path}
          title={item.title}
          movieId={item.movie_id}
          width={CARD_WIDTH}
          height={POSTER_HEIGHT}
          borderRadius={radius.md}
        />

        {/* Rank Crown */}
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>

        {/* Rating */}
        {rating && (
          <View style={styles.ratingBadge}>
            <Star size={10} color="#FFC107" fill="#FFC107" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.metaYear}>{year || 'Masterpiece'}</Text>
      </View>
    </IOSPressable>
  );
}

export default function MustWatchScreen() {
  const { data: mustWatchList, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['curated', 'must-watch'],
    queryFn: () => curatedApi.mustWatch(),
    staleTime: 10 * 60 * 1000,
  });

  const movies = mustWatchList ?? [];

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<MustWatch>) => (
      <MustWatchCard item={item} rank={index + 1} />
    ),
    []
  );

  return (
    <View style={styles.root}>
      {/* iOS Header */}
      <IOSHeader
        title="Must Watch"
        subtitle="Curated Hall of Fame"
        rightAction={<Trophy size={20} color="#FFC107" />}
      />

      {/* Hero Banner Description */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Flame size={16} color="#E50914" />
          <Text style={styles.bannerText}>
            Cinematic perfection hand-picked by cinephiles worldwide.
          </Text>
        </View>
      </View>

      {/* Grid of Must Watch Titles */}
      <FlatList<MustWatch>
        data={movies}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id || item.movie_id)}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        onRefresh={refetch}
        refreshing={isRefetching || (isLoading && !mustWatchList)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  banner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: 'rgba(229,9,20,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,9,20,0.15)',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
  },
  gridContainer: {
    padding: spacing.lg,
    paddingBottom: 110,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
  posterWrapper: {
    width: CARD_WIDTH,
    height: POSTER_HEIGHT,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(229,9,20,0.9)',
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rankText: {
    fontFamily: fonts.heading,
    fontSize: 10,
    color: '#FFFFFF',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15,15,20,0.85)',
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.4)',
  },
  ratingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFC107',
  },
  cardInfo: {
    padding: 10,
  },
  title: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  metaYear: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
});

