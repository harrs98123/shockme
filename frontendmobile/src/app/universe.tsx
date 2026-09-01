import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Globe } from 'lucide-react-native';

import { moviesApi } from '@/api/movies';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { getEnglishTitle } from '@/lib/format';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

const UNIVERSES = [
  { id: 'marvel', label: 'Marvel MCU', keyword: 'marvel cinematic universe', color: '#EF4444' },
  { id: 'dc', label: 'DC Universe', keyword: 'dc extended universe', color: '#3B82F6' },
  { id: 'starwars', label: 'Star Wars', keyword: 'star wars', color: '#F59E0B' },
  { id: 'lotr', label: 'Middle Earth', keyword: 'lord of the rings', color: '#10B981' },
  { id: 'batman', label: 'Batman Saga', keyword: 'batman', color: '#8B5CF6' },
];

export default function UniverseScreen() {
  const [activeUniverse, setActiveUniverse] = useState(UNIVERSES[0]);

  const { data } = useQuery({
    queryKey: ['movies', 'universe', activeUniverse.id],
    queryFn: () => moviesApi.search(activeUniverse.keyword, 1),
    staleTime: 10 * 60 * 1000,
  });

  const movies = data?.results ?? [];

  return (
    <View style={styles.root}>
      {/* iOS Header */}
      <IOSHeader
        title="Movie Universes"
        subtitle="Chronological Timelines"
        rightAction={<Globe size={20} color="#3B82F6" />}
      />

      {/* Universe Tabs */}
      <View style={styles.tabsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          bounces={true}
        >
          {UNIVERSES.map((u) => {
            const isSelected = activeUniverse.id === u.id;
            return (
              <IOSPressable
                key={u.id}
                style={[
                  styles.tabChip,
                  isSelected && {
                    backgroundColor: `${u.color}25`,
                    borderColor: u.color,
                  },
                ]}
                onPress={() => setActiveUniverse(u)}
                activeScale={0.94}
                accessibilityRole="button"
                accessibilityLabel={u.label}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    isSelected && { color: '#FFFFFF', fontFamily: fonts.headingSemi },
                  ]}
                >
                  {u.label}
                </Text>
              </IOSPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Timeline List */}
      <FlatList<Media>
        data={movies}
        renderItem={({ item, index }) => {
          const title = getEnglishTitle(item);
          const mediaType = item.media_type ?? (item.title ? 'movie' : 'tv');
          const year = (item.release_date ?? item.first_air_date)?.slice(0, 4);
          const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

          return (
            <IOSPressable
              style={styles.card}
              onPress={() => router.push(`/${mediaType}/${item.id}` as never)}
              activeScale={0.96}
              accessibilityRole="button"
              accessibilityLabel={title}
            >
              <PosterImage
                path={item.poster_path}
                title={title}
                movieId={item.id}
                width={CARD_WIDTH}
                height={POSTER_HEIGHT}
                borderRadius={radius.md}
              />
              <View style={styles.cardInfo}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>Phase #{index + 1}</Text>
                </View>
                <Text style={styles.movieTitle} numberOfLines={1}>
                  {title}
                </Text>
                <View style={styles.cardMeta}>
                  {rating ? <Text style={styles.ratingText}>★ {rating}</Text> : null}
                  {year ? <Text style={styles.yearText}>• {year}</Text> : null}
                </View>
              </View>
            </IOSPressable>
          );
        }}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabsSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tabsScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    minHeight: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#9CA3AF',
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
  cardInfo: {
    padding: 10,
  },
  orderBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  orderText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: '#9CA3AF',
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

