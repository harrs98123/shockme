import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  Film,
  Star,
  User as UserIcon,
  Globe,
  Calendar,
  MapPin,
  ExternalLink,
} from 'lucide-react-native';

import { moviesApi } from '@/api/movies';
import type { PersonCredit, PersonDetails } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { posterUrl } from '@/lib/images';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

export default function PersonProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: person, isLoading, error } = useQuery<PersonDetails>({
    queryKey: ['person', id],
    queryFn: () => moviesApi.person(id!),
    enabled: !!id,
  });

  const sortedFilmography = useMemo(() => {
    if (!person?.filmography) return [];
    return [...person.filmography].sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateB - dateA;
    });
  }, [person]);

  if (isLoading) {
    return (
      <View style={styles.centerRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !person) {
    return (
      <View style={styles.centerRoot}>
        <IOSHeader title="Person" />
        <View style={styles.emptyWrap}>
          <UserIcon size={48} color={colors.secondaryLabel} />
          <Text style={styles.emptyTitle}>Person not found</Text>
          <Text style={styles.emptySub}>
            We couldn't retrieve the filmography details for this person.
          </Text>
        </View>
      </View>
    );
  }

  const profileImageUrl = person.profile_path
    ? posterUrl(person.profile_path, 'w500')
    : null;

  return (
    <View style={styles.root}>
      <IOSHeader title={person.name} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Person Hero Info Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatarImg}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon size={48} color={colors.secondaryLabel} />
              </View>
            )}
          </View>

          <Text style={styles.personName}>{person.name}</Text>
          <Text style={styles.departmentTag}>
            {person.known_for_department || 'Acting & Directing'}
          </Text>

          {/* Quick Details Matrix */}
          <View style={styles.detailsRow}>
            {person.birthday ? (
              <View style={styles.detailItem}>
                <Calendar size={13} color={colors.textMuted} />
                <Text style={styles.detailText}>
                  {new Date(person.birthday).getFullYear()}
                </Text>
              </View>
            ) : null}

            {person.place_of_birth ? (
              <View style={styles.detailItem}>
                <MapPin size={13} color={colors.textMuted} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {person.place_of_birth.split(',').pop()?.trim() || person.place_of_birth}
                </Text>
              </View>
            ) : null}

            {person.external_ids?.imdb_id ? (
              <IOSPressable
                style={styles.imdbBadge}
                onPress={() =>
                  Linking.openURL(
                    `https://www.imdb.com/name/${person.external_ids?.imdb_id}`
                  )
                }
                activeScale={0.9}
                accessibilityRole="button"
                accessibilityLabel="Open IMDb"
              >
                <Text style={styles.imdbText}>IMDb</Text>
                <ExternalLink size={10} color="#000000" />
              </IOSPressable>
            ) : null}
          </View>

          {/* Biography */}
          {person.biography ? (
            <View style={styles.bioContainer}>
              <Text style={styles.bioHeading}>BIOGRAPHY</Text>
              <Text style={styles.bioText} numberOfLines={6}>
                {person.biography}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Filmography Section */}
        <View style={styles.filmographySection}>
          <View style={styles.sectionHeader}>
            <Film size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>
              Filmography ({sortedFilmography.length})
            </Text>
          </View>

          <View style={styles.gridWrap}>
            {sortedFilmography.map((credit, idx) => {
              const mediaType = credit.media_type || 'movie';
              const rating = credit.vote_average
                ? credit.vote_average.toFixed(1)
                : null;
              const year = (credit.release_date || credit.first_air_date)?.slice(0, 4);

              return (
                <IOSPressable
                  key={`${credit.id}-${idx}`}
                  style={styles.movieCard}
                  onPress={() =>
                    router.push(`/${mediaType}/${credit.id}` as never)
                  }
                  activeScale={0.96}
                  accessibilityRole="button"
                  accessibilityLabel={credit.title || credit.name || 'Title'}
                >
                  <PosterImage
                    path={credit.poster_path}
                    title={credit.title || credit.name || 'Title'}
                    movieId={credit.id}
                    width={CARD_WIDTH}
                    height={POSTER_HEIGHT}
                    borderRadius={radius.md}
                  />
                  <View style={styles.movieInfo}>
                    <Text style={styles.movieTitle} numberOfLines={1}>
                      {credit.title || credit.name}
                    </Text>
                    {credit.character ? (
                      <Text style={styles.characterName} numberOfLines={1}>
                        as {credit.character}
                      </Text>
                    ) : null}
                    <View style={styles.movieMeta}>
                      {rating ? (
                        <Text style={styles.ratingText}>★ {rating}</Text>
                      ) : null}
                      {year ? (
                        <Text style={styles.yearText}>• {year}</Text>
                      ) : null}
                    </View>
                  </View>
                </IOSPressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroCard: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    fontFamily: fonts.headingBlack,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  departmentTag: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.primary,
    backgroundColor: 'rgba(229,9,20,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  detailText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  imdbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5C518',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  imdbText: {
    fontFamily: fonts.headingBlack,
    fontSize: 11,
    color: '#000000',
  },
  bioContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  bioHeading: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.secondaryLabel,
    letterSpacing: 1,
    marginBottom: 4,
  },
  bioText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  filmographySection: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 17,
    color: '#FFFFFF',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  movieCard: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  movieInfo: {
    padding: 8,
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  characterName: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondaryLabel,
    marginBottom: 4,
  },
  movieMeta: {
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
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
