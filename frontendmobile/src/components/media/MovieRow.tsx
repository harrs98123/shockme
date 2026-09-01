import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  type ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import type { Media } from '@/types';
import { colors, fonts } from '@/theme';
import { HIT_SLOP } from '@/theme/layout';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { MovieCard } from './MovieCard';
import { MovieRowSkeleton } from './MovieRowSkeleton';

interface Props {
  title: string;
  subtitle?: string;
  movies: Media[];
  isLoading?: boolean;
  seeMoreLink?: string;
  favIds?: number[];
  onFavToggle?: (movie: Media) => void;
}

const SEPARATOR_WIDTH = 10;

function Separator() {
  return <View style={{ width: SEPARATOR_WIDTH }} />;
}

/**
 * Horizontal scrolling movie row.
 * - Section header with optional subtitle + "See All" chevron button
 * - FlatList for efficient rendering with iOS momentum physics
 * - Shows MovieRowSkeleton while loading
 */
export function MovieRow({
  title,
  subtitle,
  movies,
  isLoading = false,
  seeMoreLink,
  favIds = [],
  onFavToggle,
}: Props) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Media>) => (
      <MovieCard
        movie={item}
        isFav={favIds.includes(item.id)}
        onFavToggle={onFavToggle}
      />
    ),
    [favIds, onFavToggle]
  );

  const keyExtractor = useCallback((item: Media) => String(item.id), []);

  if (isLoading) return <MovieRowSkeleton />;
  if (!movies.length) return null;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {seeMoreLink ? (
          <IOSPressable
            style={styles.seeAll}
            onPress={() => router.push(seeMoreLink as never)}
            hitSlop={HIT_SLOP}
            activeScale={0.94}
            accessibilityRole="button"
            accessibilityLabel={`See all ${title}`}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <ChevronRight size={14} color={colors.primary} strokeWidth={2.4} />
          </IOSPressable>
        ) : null}
      </View>

      {/* Cards */}
      <FlatList<Media>
        data={movies}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        initialNumToRender={5}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        decelerationRate="fast"
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleGroup: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.text,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 28,
    minWidth: 28,
  },
  seeAllText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.primary,
  },
  list: {
    paddingHorizontal: 16,
  },
});

