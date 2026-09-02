import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Star, Clock, Calendar, ChevronDown, ChevronUp, Play, Layers } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { tvApi } from '@/api/movies';
import { backdropUrl, posterUrl } from '@/lib/images';
import type { Season, Episode } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TvSeasonsEpisodesSectionProps {
  tvId: number;
  seasons?: Season[];
  initialSeasonNumber?: number;
}

export function TvSeasonsEpisodesSection({
  tvId,
  seasons = [],
  initialSeasonNumber,
}: TvSeasonsEpisodesSectionProps) {
  // Filter out specials (season 0) if other seasons exist, or sort ascending
  const validSeasons = useMemo(() => {
    if (!seasons || seasons.length === 0) return [];
    // Prioritize standard seasons (1, 2, ...) then specials (0)
    return [...seasons].sort((a, b) => {
      if (a.season_number === 0) return 1;
      if (b.season_number === 0) return -1;
      return a.season_number - b.season_number;
    });
  }, [seasons]);

  const defaultSeason = initialSeasonNumber ?? validSeasons[0]?.season_number ?? 1;
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(defaultSeason);
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<number | null>(null);

  const activeSeason = useMemo(
    () => validSeasons.find((s) => s.season_number === selectedSeasonNumber) || validSeasons[0],
    [validSeasons, selectedSeasonNumber]
  );

  // Fetch Season Details & Episodes
  const { data: seasonData, isLoading, isError } = useQuery({
    queryKey: ['tv', tvId, 'season', selectedSeasonNumber],
    queryFn: () => tvApi.season(tvId, selectedSeasonNumber),
    enabled: !!tvId && selectedSeasonNumber != null,
    staleTime: 10 * 60 * 1000,
  });

  const episodes = seasonData?.episodes ?? [];

  if (!validSeasons || validSeasons.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* ── Section Title ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Layers size={18} color="#A78BFA" />
          <Text style={styles.sectionTitle}>Seasons & Episodes</Text>
        </View>
        <Text style={styles.seasonCountBadge}>
          {validSeasons.length} {validSeasons.length === 1 ? 'Season' : 'Seasons'}
        </Text>
      </View>

      {/* ── Horizontal Seasons Carousel ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.seasonsScroll}
        bounces={true}
      >
        {validSeasons.map((season) => {
          const isSelected = season.season_number === selectedSeasonNumber;
          const displayName = season.name || `Season ${season.season_number}`;
          const epText = season.episode_count ? `${season.episode_count} Ep` : '';

          return (
            <IOSPressable
              key={season.id || season.season_number}
              style={[
                styles.seasonChip,
                isSelected && styles.seasonChipActive,
              ]}
              onPress={() => {
                setSelectedSeasonNumber(season.season_number);
                setExpandedEpisodeId(null);
              }}
              activeScale={0.94}
            >
              <Text style={[styles.seasonChipText, isSelected && styles.seasonChipTextActive]}>
                {displayName}
              </Text>
              {epText ? (
                <View style={[styles.epCountPill, isSelected && styles.epCountPillActive]}>
                  <Text style={[styles.epCountPillText, isSelected && styles.epCountPillTextActive]}>
                    {epText}
                  </Text>
                </View>
              ) : null}
            </IOSPressable>
          );
        })}
      </ScrollView>

      {/* ── Active Season Summary / Overview ── */}
      {activeSeason?.overview ? (
        <View style={styles.seasonOverviewBox}>
          <Text style={styles.seasonOverviewText} numberOfLines={3}>
            {activeSeason.overview}
          </Text>
        </View>
      ) : null}

      {/* ── Episodes List ── */}
      <View style={styles.episodesContainer}>
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#A78BFA" />
            <Text style={styles.loadingText}>Loading Season {selectedSeasonNumber} Episodes...</Text>
          </View>
        ) : isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Unable to load episodes for this season.</Text>
          </View>
        ) : episodes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No episodes listed yet for this season.</Text>
          </View>
        ) : (
          episodes.map((ep: Episode, idx: number) => {
            const isExpanded = expandedEpisodeId === ep.id;
            const still = ep.still_path ? backdropUrl(ep.still_path, 'w780') : null;
            const ratingScore = ep.vote_average ? ep.vote_average.toFixed(1) : null;
            const runtimeStr = ep.runtime ? `${ep.runtime}m` : null;
            const airDateStr = ep.air_date ? ep.air_date : null;

            return (
              <Animated.View
                key={ep.id || idx}
                entering={FadeInDown.delay(Math.min(idx * 40, 300)).springify().damping(18)}
                style={styles.episodeCard}
              >
                <Pressable
                  onPress={() => setExpandedEpisodeId(isExpanded ? null : ep.id)}
                  style={styles.episodeMainPressable}
                >
                  {/* Episode Thumbnail */}
                  <View style={styles.thumbWrapper}>
                    {still ? (
                      <Image source={{ uri: still }} style={styles.thumbImg} contentFit="cover" />
                    ) : (
                      <View style={[styles.thumbImg, { backgroundColor: '#1A1A24' }]} />
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    {/* Ep Number Badge */}
                    <View style={styles.epNumBadge}>
                      <Text style={styles.epNumText}>EP {ep.episode_number}</Text>
                    </View>
                  </View>

                  {/* Episode Info Column */}
                  <View style={styles.epInfoCol}>
                    <Text style={styles.epTitle} numberOfLines={2}>
                      {ep.name || `Episode ${ep.episode_number}`}
                    </Text>

                    {/* Metadata Line (Rating + Runtime + Air Date) */}
                    <View style={styles.epMetaRow}>
                      {ratingScore ? (
                        <View style={styles.ratingBadge}>
                          <Star size={11} color="#FBBF24" fill="#FBBF24" />
                          <Text style={styles.ratingText}>{ratingScore}</Text>
                        </View>
                      ) : null}

                      {runtimeStr ? (
                        <View style={styles.metaSubItem}>
                          <Clock size={11} color="#9CA3AF" />
                          <Text style={styles.metaSubText}>{runtimeStr}</Text>
                        </View>
                      ) : null}

                      {airDateStr ? (
                        <View style={styles.metaSubItem}>
                          <Calendar size={11} color="#9CA3AF" />
                          <Text style={styles.metaSubText}>{airDateStr}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Short preview of overview */}
                    {ep.overview ? (
                      <Text
                        style={styles.epOverviewText}
                        numberOfLines={isExpanded ? undefined : 2}
                      >
                        {ep.overview}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 26,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 19,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  seasonCountBadge: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  seasonsScroll: {
    gap: 8,
    paddingBottom: 6,
  },
  seasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: '#16161F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  seasonChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#A78BFA',
  },
  seasonChipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#9CA3AF',
  },
  seasonChipTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.headingSemi,
  },
  epCountPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  epCountPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  epCountPillText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: '#9CA3AF',
  },
  epCountPillTextActive: {
    color: '#FFFFFF',
  },
  seasonOverviewBox: {
    backgroundColor: '#111116',
    borderRadius: radius.lg,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  seasonOverviewText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  episodesContainer: {
    marginTop: 14,
    gap: 12,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 28,
    backgroundColor: '#111116',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#9CA3AF',
  },
  errorBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  episodeCard: {
    backgroundColor: '#111118',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  episodeMainPressable: {
    flexDirection: 'row',
    padding: 10,
    gap: 12,
  },
  thumbWrapper: {
    width: 110,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1E26',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  epNumBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  epNumText: {
    fontFamily: fonts.headingBlack,
    fontSize: 9.5,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  epInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  epTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13.5,
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 4,
  },
  epMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  ratingText: {
    fontFamily: fonts.headingSemi,
    fontSize: 10.5,
    color: '#FBBF24',
  },
  metaSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaSubText: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  epOverviewText: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 16,
    marginTop: 2,
  },
});
