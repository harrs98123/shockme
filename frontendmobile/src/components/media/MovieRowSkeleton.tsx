import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors, radius } from '@/theme';
import { posterSize, POSTER_ASPECT } from '@/theme/layout';

interface Props {
  count?: number;
}

function PosterSkeleton() {
  const w = posterSize.md;
  const h = Math.round(w / POSTER_ASPECT);
  return (
    <View style={[styles.poster, { width: w, height: h }]} />
  );
}

/**
 * Shimmer skeleton for a MovieRow — shown while TanStack Query is loading.
 * Uses the same spacing as MovieRow so there's no layout shift.
 */
export function MovieRowSkeleton({ count = 6 }: Props) {
  return (
    <View style={styles.root}>
      {/* Title bar skeleton */}
      <View style={styles.header}>
        <View style={styles.titleBar} />
        <View style={styles.seeAllBar} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.row}
      >
        {Array.from({ length: count }).map((_, i) => (
          <PosterSkeleton key={i} />
        ))}
      </ScrollView>
    </View>
  );
}

const SHIMMER = colors.surface2;

const styles = StyleSheet.create({
  root: {
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleBar: {
    width: 140,
    height: 18,
    borderRadius: radius.sm,
    backgroundColor: SHIMMER,
  },
  seeAllBar: {
    width: 52,
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: SHIMMER,
  },
  row: {
    paddingHorizontal: 16,
    gap: 10,
  },
  poster: {
    borderRadius: radius.md,
    backgroundColor: SHIMMER,
  },
});
