import React, { useState, useCallback } from 'react';
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
import { Gem, Star, Sparkles } from 'lucide-react-native';

import { curatedApi } from '@/api/curated';
import type { HiddenGem } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  legendary: { bg: 'rgba(234,179,8,0.2)', text: '#FACC15', border: 'rgba(234,179,8,0.5)' },
  rare: { bg: 'rgba(168,85,247,0.2)', text: '#C084FC', border: 'rgba(168,85,247,0.5)' },
  common: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA', border: 'rgba(59,130,246,0.5)' },
};

function GemCard({ gem }: { gem: HiddenGem }) {
  const rating = gem.vote_average ? gem.vote_average.toFixed(1) : null;
  const year = gem.release_date?.slice(0, 4);
  const rarity = (gem.rarity || 'rare').toLowerCase();
  const rarityStyle = RARITY_COLORS[rarity] || RARITY_COLORS.rare;

  return (
    <IOSPressable
      style={styles.card}
      onPress={() => router.push(`/movie/${gem.id}` as never)}
      activeScale={0.96}
      accessibilityRole="button"
      accessibilityLabel={gem.title}
    >
      <View style={styles.posterWrapper}>
        <PosterImage
          path={gem.poster_path}
          title={gem.title}
          movieId={gem.id}
          width={CARD_WIDTH}
          height={POSTER_HEIGHT}
          borderRadius={radius.md}
        />

        {/* Gem Score Badge */}
        <View style={styles.gemScoreBadge}>
          <Gem size={10} color="#06B6D4" />
          <Text style={styles.gemScoreText}>{gem.gem_score || '88'}</Text>
        </View>

        {/* Rarity Pill */}
        <View style={[styles.rarityPill, { backgroundColor: rarityStyle.bg, borderColor: rarityStyle.border }]}>
          <Text style={[styles.rarityText, { color: rarityStyle.text }]}>
            {rarity.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.title} numberOfLines={1}>
          {gem.title}
        </Text>
        <View style={styles.metaRow}>
          {rating ? (
            <View style={styles.ratingRow}>
              <Star size={10} color="#FFC107" fill="#FFC107" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : null}
          {year ? <Text style={styles.yearText}>• {year}</Text> : null}
        </View>
      </View>
    </IOSPressable>
  );
}

export default function GemsScreen() {
  const [filterRarity, setFilterRarity] = useState<'all' | 'legendary' | 'rare'>('all');

  const { data: gemsList, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['curated', 'gems'],
    queryFn: () => curatedApi.gems(),
    staleTime: 10 * 60 * 1000,
  });

  const gems = (gemsList ?? []).filter((g) =>
    filterRarity === 'all' ? true : (g.rarity || '').toLowerCase() === filterRarity
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<HiddenGem>) => <GemCard gem={item} />,
    []
  );

  return (
    <View style={styles.root}>
      {/* iOS Header */}
      <IOSHeader
        title="Hidden Gems"
        subtitle="Underrated Masterpieces"
        rightAction={<Sparkles size={20} color="#06B6D4" />}
      />

      {/* Rarity Tabs */}
      <View style={styles.tabsRow}>
        {(['all', 'legendary', 'rare'] as const).map((r) => {
          const active = filterRarity === r;
          return (
            <IOSPressable
              key={r}
              style={[styles.tabChip, active && styles.tabChipActive]}
              onPress={() => setFilterRarity(r)}
              activeScale={0.94}
              accessibilityRole="button"
              accessibilityLabel={r === 'all' ? 'All Gems' : r.toUpperCase()}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {r === 'all' ? 'All Gems' : r.toUpperCase()}
              </Text>
            </IOSPressable>
          );
        })}
      </View>

      {/* Grid */}
      <FlatList<HiddenGem>
        data={gems}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        onRefresh={refetch}
        refreshing={isRefetching || (isLoading && !gemsList)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipActive: {
    backgroundColor: 'rgba(6,182,212,0.18)',
    borderColor: 'rgba(6,182,212,0.5)',
  },
  tabLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#06B6D4',
    fontFamily: fonts.bodySemi,
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
  gemScoreBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,15,20,0.85)',
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.4)',
  },
  gemScoreText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#06B6D4',
  },
  rarityPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  rarityText: {
    fontFamily: fonts.headingSemi,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  cardInfo: {
    padding: 10,
  },
  title: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFC107',
  },
  yearText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
});

