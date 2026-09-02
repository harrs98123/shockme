import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Heart,
  BookmarkPlus,
  BookmarkCheck,
  Star,
  Play,
  Tv,
  Calendar,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { moviesApi } from '@/api/movies';
import { favoritesApi, watchlistApi } from '@/api/lists';
import { useAuthStore } from '@/stores/auth.store';
import type { CastMember } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { backdropUrl, posterUrl, profileUrl } from '@/lib/images';
import { getEnglishTitle } from '@/lib/format';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { MovieRow } from '@/components/media/MovieRow';
import { openTrailerInYouTube } from '@/lib/trailer';
import type { Video } from '@/types';
import { MoctaleMeterSection } from '@/components/media/MoctaleMeterSection';
import { BattleGroundsSection } from '@/components/media/BattleGroundsSection';
import { WhereToWatchSection } from '@/components/media/WhereToWatchSection';
import { AiInsightsSection } from '@/components/media/AiInsightsSection';
import { MovieQuoteLoader } from '@/components/media/MovieQuoteLoader';
import { TvSeasonsEpisodesSection } from '@/components/media/TvSeasonsEpisodesSection';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKDROP_HEIGHT = Math.round(SCREEN_WIDTH * 0.65);

export default function TvDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [isFav, setIsFav] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const { data: tvShow, isLoading } = useQuery({
    queryKey: ['tv', 'detail', id],
    queryFn: () => moviesApi.detail(id, 'tv'),
    enabled: !!id,
  });

  const title = tvShow ? getEnglishTitle(tvShow) : 'TV Show Details';
  const backdrop = backdropUrl(tvShow?.backdrop_path, 'w1280');
  const poster = posterUrl(tvShow?.poster_path, 'w342');
  const rating = tvShow?.vote_average ? tvShow.vote_average.toFixed(1) : null;
  const year = tvShow?.first_air_date ? tvShow.first_air_date.slice(0, 4) : null;

  const cast = (tvShow?.credits?.cast ?? []).slice(0, 10);
  const similar = tvShow?.similar?.results ?? [];

  const trailer = tvShow?.videos?.results?.find(
    (v: Video) =>
      v.type === 'Trailer' &&
      v.site === 'YouTube' &&
      (v.name.toLowerCase().includes('official') || v.name.toLowerCase().includes('main'))
  ) || tvShow?.videos?.results?.find(
    (v: Video) => v.type === 'Trailer' && v.site === 'YouTube'
  ) || tvShow?.videos?.results?.find(
    (v: Video) => (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip') && v.site === 'YouTube'
  );

  const handleToggleFav = useCallback(async () => {
    if (!user) {
      showToast.error('Please log in to add to favorites.');
      return;
    }
    if (!tvShow) return;
    setIsFav((prev) => !prev);
    try {
      if (isFav) {
        await favoritesApi.remove(tvShow.id);
        showToast.info(`Removed "${title}" from Favorites`);
      } else {
        await favoritesApi.add({ ...tvShow, media_type: 'tv' });
        showToast.success(`Added "${title}" to Favorites ❤️`);
      }
    } catch {
      setIsFav((prev) => !prev);
      showToast.error('Failed to update favorites');
    }
  }, [user, tvShow, isFav, title]);

  const handleToggleWatchlist = useCallback(async () => {
    if (!user) {
      showToast.error('Please log in to add to watchlist.');
      return;
    }
    if (!tvShow) return;
    setIsWatchlisted((prev) => !prev);
    try {
      if (isWatchlisted) {
        await watchlistApi.remove(tvShow.id);
        showToast.info(`Removed "${title}" from Watchlist`);
      } else {
        await watchlistApi.add({ ...tvShow, media_type: 'tv' });
        showToast.success(`Added "${title}" to Watchlist`);
      }
    } catch {
      setIsWatchlisted((prev) => !prev);
      showToast.error('Failed to update watchlist');
    }
  }, [user, tvShow, isWatchlisted, title]);

  if (isLoading || !tvShow) {
    return <MovieQuoteLoader onBack={() => router.back()} />;
  }

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: false,
        }}
      />
      {/* Fixed Top Header Controls */}
      <View style={[styles.headerFloating, { top: insets.top + 8, pointerEvents: 'box-none' }]}>
        <IOSPressable
          style={styles.circleBtn}
          onPress={() => router.back()}
          hitSlop={12}
          activeScale={0.9}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.4} />
        </IOSPressable>
        <View style={styles.headerRightActions}>
          <IOSPressable
            style={[styles.circleBtn, isFav && styles.circleBtnActive]}
            onPress={handleToggleFav}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={18} color="#FFFFFF" fill={isFav ? '#FFFFFF' : 'none'} strokeWidth={isFav ? 0 : 2} />
          </IOSPressable>
          <IOSPressable
            style={[styles.circleBtn, isWatchlisted && styles.circleBtnActive]}
            onPress={handleToggleWatchlist}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {isWatchlisted ? (
              <BookmarkCheck size={18} color="#FFFFFF" />
            ) : (
              <BookmarkPlus size={18} color="#FFFFFF" />
            )}
          </IOSPressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 70 }]}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Backdrop Banner */}
        <View style={styles.backdropWrap}>
          {backdrop ? (
            <Image source={{ uri: backdrop }} style={styles.backdrop} contentFit="cover" />
          ) : (
            <View style={[styles.backdrop, { backgroundColor: '#1A1A2E' }]} />
          )}
          <LinearGradient
            colors={['rgba(15,15,15,0.4)', 'transparent', 'rgba(15,15,15,0.7)', '#0F0F0F']}
            locations={[0, 0.3, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Poster & Header Info Card */}
        <View style={styles.mainInfoRow}>
          {poster ? (
            <Image source={{ uri: poster }} style={styles.poster} contentFit="cover" />
          ) : (
            <View style={[styles.poster, { backgroundColor: colors.surface }]} />
          )}

          <View style={styles.infoRight}>
            <View style={styles.seriesBadge}>
              <Tv size={10} color="#FFFFFF" />
              <Text style={styles.seriesBadgeText}>TV SERIES</Text>
            </View>
            <Text style={styles.detailTitle}>{title}</Text>

            {/* Meta Row */}
            <View style={styles.metaBadgeRow}>
              {rating ? (
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#FFC107" fill="#FFC107" />
                  <Text style={styles.ratingText}>{rating}</Text>
                </View>
              ) : null}
              {year ? (
                <View style={styles.metaChip}>
                  <Calendar size={11} color={colors.textMuted} />
                  <Text style={styles.metaChipText}>{year}</Text>
                </View>
              ) : null}
            </View>

            {/* Genres */}
            <View style={styles.genresWrap}>
              {(tvShow.genres ?? []).map((g) => (
                <View key={g.id} style={styles.genrePill}>
                  <Text style={styles.genrePillText}>{g.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsBar}>
          <IOSPressable
            style={styles.primaryActionBtn}
            onPress={() =>
              openTrailerInYouTube({
                title,
                mediaId: id,
                mediaType: 'tv',
                trailerKey: trailer?.key,
              })
            }
            activeScale={0.96}
            accessibilityRole="button"
            accessibilityLabel="Watch trailer"
          >
            <Play size={16} color="#000000" fill="#000000" />
            <Text style={styles.primaryActionText}>Watch Trailer</Text>
          </IOSPressable>
          <IOSPressable
            style={[styles.secondaryActionBtn, isWatchlisted && styles.secondaryActionActive]}
            onPress={handleToggleWatchlist}
            activeScale={0.96}
            accessibilityRole="button"
            accessibilityLabel={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
          >
            {isWatchlisted ? (
              <BookmarkCheck size={16} color={colors.primary} />
            ) : (
              <BookmarkPlus size={16} color="#FFFFFF" />
            )}
            <Text style={[styles.secondaryActionText, isWatchlisted && { color: colors.primary }]}>
              {isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
            </Text>
          </IOSPressable>
        </View>

        {/* Overview */}
        {tvShow.overview ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Storyline</Text>
            <Text style={styles.overviewBody}>{tvShow.overview}</Text>
          </View>
        ) : null}

        {/* Seasons & Episodes Section with Ratings & Stills */}
        <TvSeasonsEpisodesSection
          tvId={tvShow.id}
          seasons={tvShow.seasons}
        />

        {/* Where to Watch (Streaming Providers) */}
        <WhereToWatchSection
          watchProviders={tvShow['watch/providers']}
          title={title}
        />

        {/* Moctale Community Verdict & Reviews */}
        <MoctaleMeterSection
          movieId={tvShow.id}
          mediaType="tv"
          title={title}
          posterPath={tvShow.poster_path}
        />

        {/* Battle Grounds / Debates */}
        <BattleGroundsSection movieId={tvShow.id} mediaType="tv" />

        {/* AI Cinematic Lab (Deep Dive & Alternate Endings) */}
        <AiInsightsSection
          movieId={tvShow.id}
          mediaType="tv"
          title={title}
        />

        {/* Top Cast */}
        {cast.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Top Cast</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castScroll}
              bounces={true}
            >
              {cast.map((actor: CastMember) => (
                <View key={actor.id} style={styles.actorCard}>
                  {actor.profile_path ? (
                    <Image
                      source={{ uri: profileUrl(actor.profile_path, 'w185') || undefined }}
                      style={styles.actorAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.actorAvatar, { backgroundColor: colors.surface2 }]} />
                  )}
                  <Text style={styles.actorName} numberOfLines={1}>
                    {actor.name}
                  </Text>
                  <Text style={styles.actorChar} numberOfLines={1}>
                    {actor.character}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Seasons (TV only) */}
        {tvShow?.seasons && tvShow.seasons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              Seasons ({tvShow.number_of_seasons || tvShow.seasons.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castScroll}
              bounces={true}
            >
              {tvShow.seasons.map((season: any) => (
                <View
                  key={season.id || season.season_number}
                  style={styles.seasonCard}
                >
                  {season.poster_path ? (
                    <Image
                      source={{ uri: posterUrl(season.poster_path, 'w185') || undefined }}
                      style={styles.seasonPoster}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.seasonPoster, { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }]}>
                      <Tv size={24} color="#9CA3AF" />
                    </View>
                  )}
                  <Text style={styles.seasonName} numberOfLines={1}>
                    {season.name || `Season ${season.season_number}`}
                  </Text>
                  <Text style={styles.seasonEpisodes}>
                    {season.episode_count ? `${season.episode_count} Episodes` : 'Season'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Similar / Recommendations */}
        {similar.length > 0 ? (
          <MovieRow title="More Like This" movies={similar} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFloating: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    minHeight: 38,
    minWidth: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15,15,20,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  backdropWrap: {
    width: SCREEN_WIDTH,
    height: BACKDROP_HEIGHT,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  mainInfoRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: -50,
    gap: 14,
  },
  poster: {
    width: 110,
    height: 165,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  infoRight: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  seriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  seriesBadgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  detailTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 23,
    marginBottom: 6,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,193,7,0.2)',
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.4)',
  },
  ratingText: {
    fontFamily: fonts.headingSemi,
    fontSize: 11,
    color: '#FFC107',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metaChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  genresWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  genrePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  genrePillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },
  actionsBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: 18,
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    height: 44,
  },
  primaryActionText: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#000000',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryActionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoftBorder,
  },
  secondaryActionText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: 24,
  },
  sectionHeading: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  overviewBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
  },
  castScroll: {
    gap: 12,
  },
  actorCard: {
    width: 72,
    alignItems: 'center',
  },
  actorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
  actorName: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actorChar: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  seasonsScroll: {
    gap: 12,
  },
  seasonCard: {
    width: 90,
  },
  seasonPoster: {
    width: 90,
    height: 130,
    borderRadius: radius.md,
    marginBottom: 6,
  },
  seasonName: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  seasonEpisodes: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: '#9CA3AF',
  },
});

