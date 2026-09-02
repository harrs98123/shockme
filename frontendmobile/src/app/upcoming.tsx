import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Dimensions,
  type ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Bell, BellCheck, Calendar } from 'lucide-react-native';

import { moviesApi } from '@/api/movies';
import { interestsApi } from '@/api/lists';
import { useAuthStore } from '@/stores/auth.store';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { getEnglishTitle } from '@/lib/format';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

const REGIONS = [
  { id: 'all', label: 'All Releases', icon: '🌍' },
  { id: 'hollywood', label: 'Hollywood', icon: '🇺🇸' },
  { id: 'bollywood', label: 'Bollywood', icon: '🇮🇳' },
  { id: 'korean', label: 'Korean', icon: '🇰🇷' },
  { id: 'anime', label: 'Anime', icon: '⛩️' },
];

function formatReleaseDate(dateStr?: string | null) {
  if (!dateStr) return 'Coming Soon';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDaysRemaining(dateStr?: string | null) {
  if (!dateStr) return null;
  try {
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Out Now';
    if (diff === 1) return 'Tomorrow';
    if (diff <= 30) return `In ${diff} days`;
    const months = Math.ceil(diff / 30);
    return `In ~${months} mo`;
  } catch {
    return null;
  }
}

function UpcomingCard({
  movie,
  isInterested,
  onToggleInterest,
}: {
  movie: Media;
  isInterested: boolean;
  onToggleInterest: (movie: Media) => void;
}) {
  const title = getEnglishTitle(movie);
  const mediaType = movie.media_type ?? (movie.title ? 'movie' : 'tv');
  const dateStr = movie.release_date ?? movie.first_air_date;
  const formattedDate = formatReleaseDate(dateStr);
  const countdown = getDaysRemaining(dateStr);

  return (
    <IOSPressable
      style={styles.card}
      onPress={() => router.push(`/${mediaType}/${movie.id}` as never)}
      activeScale={0.96}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.posterContainer}>
        <PosterImage
          path={movie.poster_path}
          title={title}
          movieId={movie.id}
          width={CARD_WIDTH}
          height={POSTER_HEIGHT}
          borderRadius={radius.md}
        />

        {/* Countdown Pill */}
        {countdown && (
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </View>

      {/* Info & Interest Button */}
      <View style={styles.cardContent}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.dateRow}>
          <Calendar size={12} color={colors.textMuted} />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        <IOSPressable
          style={[styles.interestBtn, isInterested && styles.interestBtnActive]}
          onPress={() => onToggleInterest(movie)}
          activeScale={0.92}
          accessibilityRole="button"
          accessibilityLabel={isInterested ? 'Remove from interested' : 'Remind me'}
        >
          {isInterested ? (
            <>
              <BellCheck size={13} color="#FFFFFF" />
              <Text style={styles.interestBtnTextActive}>Interested</Text>
            </>
          ) : (
            <>
              <Bell size={13} color={colors.textMuted} />
              <Text style={styles.interestBtnText}>Remind Me</Text>
            </>
          )}
        </IOSPressable>
      </View>
    </IOSPressable>
  );
}

export default function UpcomingScreen() {
  const user = useAuthStore((s) => s.user);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [interestedIds, setInterestedIds] = useState<number[]>([]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['movies', 'upcoming', selectedRegion],
    queryFn: () => moviesApi.upcoming({ region: selectedRegion }),
    staleTime: 5 * 60 * 1000,
  });

  const handleToggleInterest = useCallback(
    async (movie: Media) => {
      if (!user) {
        showToast.error('Please log in to track upcoming movies.');
        return;
      }
      const title = getEnglishTitle(movie);
      const isAlready = interestedIds.includes(movie.id);

      setInterestedIds((prev) =>
        isAlready ? prev.filter((id) => id !== movie.id) : [...prev, movie.id]
      );

      try {
        await interestsApi.toggle({
          movie_id: movie.id,
          media_type: movie.media_type ?? (movie.title ? 'movie' : 'tv'),
          title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          release_date: movie.release_date ?? movie.first_air_date ?? null,
        });
        if (!isAlready) {
          showToast.success(`Marked interest in "${title}" 🔔`);
        } else {
          showToast.info(`Removed interest in "${title}"`);
        }
      } catch {
        setInterestedIds((prev) =>
          isAlready ? [...prev, movie.id] : prev.filter((id) => id !== movie.id)
        );
        showToast.error('Failed to update interest status');
      }
    },
    [user, interestedIds]
  );

  const movies = data?.results ?? [];

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Media>) => (
      <UpcomingCard
        movie={item}
        isInterested={interestedIds.includes(item.id)}
        onToggleInterest={handleToggleInterest}
      />
    ),
    [interestedIds, handleToggleInterest]
  );

  return (
    <View style={styles.root}>
      {/* iOS Header */}
      <IOSHeader
        title="Upcoming Movies"
        subtitle="Future releases & alerts"
        rightAction={<Calendar size={18} color="#FFC107" />}
      />

      {/* Region Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          bounces={true}
        >
          {REGIONS.map((r) => {
            const active = selectedRegion === r.id;
            return (
              <IOSPressable
                key={r.id}
                style={[styles.regionChip, active && styles.regionChipActive]}
                onPress={() => setSelectedRegion(r.id)}
                activeScale={0.94}
                accessibilityRole="button"
                accessibilityLabel={r.label}
                accessibilityState={{ selected: active }}
              >
                <Text style={styles.regionIcon}>{r.icon}</Text>
                <Text style={[styles.regionLabel, active && styles.regionLabelActive]}>
                  {r.label}
                </Text>
              </IOSPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Movie Grid */}
      <FlatList<Media>
        data={movies}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        onRefresh={refetch}
        refreshing={isRefetching || (isLoading && !data)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  regionChipActive: {
    backgroundColor: 'rgba(229,9,20,0.18)',
    borderColor: 'rgba(229,9,20,0.4)',
  },
  regionIcon: {
    fontSize: 13,
  },
  regionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#9CA3AF',
  },
  regionLabelActive: {
    color: '#FFFFFF',
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
  posterContainer: {
    width: CARD_WIDTH,
    height: POSTER_HEIGHT,
    position: 'relative',
  },
  countdownBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15,15,20,0.85)',
    borderRadius: radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  countdownText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFC107',
  },
  cardContent: {
    padding: 10,
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 17,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  interestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.sm,
    paddingVertical: 7,
    minHeight: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  interestBtnActive: {
    backgroundColor: colors.primary,
    borderColor: 'transparent',
  },
  interestBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: '#9CA3AF',
  },
  interestBtnTextActive: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFFFFF',
  },
});

