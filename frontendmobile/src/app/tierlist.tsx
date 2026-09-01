import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react-native';
import { Image } from 'expo-image';

import { moviesApi } from '@/api/movies';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { posterUrl } from '@/lib/images';
import { getEnglishTitle } from '@/lib/format';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';
import showToast from '@/lib/toast';

interface TierMovie {
  movie_id: number;
  title: string;
  poster_path: string | null;
}

interface Tier {
  id: string;
  name: string;
  color: string;
  movies: TierMovie[];
}

const DEFAULT_TIERS: Tier[] = [
  { id: 'tier-s', name: 'S - God Tier', color: '#FF4B2B', movies: [] },
  { id: 'tier-a', name: 'A - Top Tier', color: '#FF8E2B', movies: [] },
  { id: 'tier-b', name: 'B - Solid', color: '#FFCC2B', movies: [] },
  { id: 'tier-c', name: 'C - Mid', color: '#88FF2B', movies: [] },
  { id: 'tier-d', name: 'D - Worst', color: '#2BAFFF', movies: [] },
];

export default function TierListScreen() {
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS);
  const [unranked, setUnranked] = useState<TierMovie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<TierMovie | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Initial pool of movies
  useQuery({
    queryKey: ['movies', 'tierlist-pool'],
    queryFn: async () => {
      const res = await moviesApi.popular(1);
      const items: TierMovie[] = (res?.results ?? []).slice(0, 15).map((m: Media) => ({
        movie_id: m.id,
        title: getEnglishTitle(m),
        poster_path: m.poster_path,
      }));
      setUnranked(items);
      return items;
    },
  });

  // Search movies for adding to pool
  const { data: searchResults } = useQuery({
    queryKey: ['movies', 'tier-search', searchQuery],
    queryFn: () => (searchQuery.trim() ? moviesApi.search(searchQuery.trim(), 1) : null),
    enabled: searchQuery.trim().length > 1,
  });

  const handleAddSearchResult = (m: Media) => {
    const movie: TierMovie = {
      movie_id: m.id,
      title: getEnglishTitle(m),
      poster_path: m.poster_path,
    };
    if (unranked.some((x) => x.movie_id === movie.movie_id)) {
      showToast.info('Movie already in pool');
      return;
    }
    setUnranked((prev) => [movie, ...prev]);
    setSearchQuery('');
    showToast.success(`Added "${movie.title}" to Unranked Pool!`);
  };

  const handleOpenAssign = (movie: TierMovie) => {
    setSelectedMovie(movie);
    setIsAssignModalOpen(true);
  };

  const handleAssignToTier = (tierId: string) => {
    if (!selectedMovie) return;

    setUnranked((prev) => prev.filter((m) => m.movie_id !== selectedMovie.movie_id));

    setTiers((prev) =>
      prev.map((t) => ({
        ...t,
        movies: t.id === tierId
          ? [...t.movies.filter((m) => m.movie_id !== selectedMovie.movie_id), selectedMovie]
          : t.movies.filter((m) => m.movie_id !== selectedMovie.movie_id),
      }))
    );

    setIsAssignModalOpen(false);
    setSelectedMovie(null);
    showToast.success(`Assigned to ${tiers.find((t) => t.id === tierId)?.name.split(' - ')[0]} Tier!`);
  };

  const handleRemoveFromTier = (tierId: string, movieId: number) => {
    const tier = tiers.find((t) => t.id === tierId);
    const movie = tier?.movies.find((m) => m.movie_id === movieId);
    if (!movie) return;

    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId ? { ...t, movies: t.movies.filter((m) => m.movie_id !== movieId) } : t
      )
    );

    setUnranked((prev) => [movie, ...prev]);
  };

  const handleReset = () => {
    const allMovies = tiers.flatMap((t) => t.movies);
    setUnranked((prev) => [...prev, ...allMovies]);
    setTiers(DEFAULT_TIERS);
    showToast.info('Reset all tiers');
  };

  return (
    <View style={styles.root}>
      {/* iOS Header */}
      <IOSHeader
        title="Movie Tier List"
        subtitle="Rank cinema greatness"
        rightAction={
          <IOSPressable
            style={styles.resetBtn}
            onPress={handleReset}
            activeScale={0.88}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Reset tiers"
          >
            <RotateCcw size={18} color="#9CA3AF" />
          </IOSPressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tier Rows */}
        <View style={styles.tiersContainer}>
          {tiers.map((tier) => (
            <View key={tier.id} style={styles.tierRow}>
              {/* Tier Label Box */}
              <View style={[styles.tierHeader, { backgroundColor: tier.color }]}>
                <Text style={styles.tierLetter}>{tier.name.split(' - ')[0]}</Text>
                <Text style={styles.tierSubLabel} numberOfLines={1}>
                  {tier.name.split(' - ')[1]}
                </Text>
              </View>

              {/* Tier Movies Dropzone / List */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tierMoviesScroll}
                bounces={true}
              >
                {tier.movies.length === 0 ? (
                  <Text style={styles.emptyTierText}>Tap movie below to place here</Text>
                ) : (
                  tier.movies.map((m) => (
                    <IOSPressable
                      key={m.movie_id}
                      style={styles.tierMovieCard}
                      onPress={() => handleRemoveFromTier(tier.id, m.movie_id)}
                      activeScale={0.92}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${m.title}`}
                    >
                      <Image
                        source={{ uri: posterUrl(m.poster_path, 'w185') || undefined }}
                        style={styles.tierMoviePoster}
                        contentFit="cover"
                      />
                      <View style={styles.removeBadge}>
                        <X size={10} color="#FFFFFF" />
                      </View>
                    </IOSPressable>
                  ))
                )}
              </ScrollView>
            </View>
          ))}
        </View>

        {/* Search & Add Movies Bar */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionHeading}>Add Movie to Pool</Text>
          <View style={styles.searchBar}>
            <Search size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search movie to rank..."
              placeholderTextColor={colors.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardAppearance="dark"
            />
            {searchQuery.length > 0 && (
              <IOSPressable
                onPress={() => setSearchQuery('')}
                activeScale={0.9}
                accessibilityRole="button"
                accessibilityLabel="Clear"
              >
                <X size={16} color="#9CA3AF" />
              </IOSPressable>
            )}
          </View>

          {/* Search Dropdown Results */}
          {searchResults && searchResults.results && searchResults.results.length > 0 && (
            <View style={styles.searchResultsBox}>
              {searchResults.results.slice(0, 5).map((item: Media) => (
                <IOSPressable
                  key={item.id}
                  style={styles.searchResultRow}
                  onPress={() => handleAddSearchResult(item)}
                  activeScale={0.97}
                  accessibilityRole="button"
                >
                  <Image
                    source={{ uri: posterUrl(item.poster_path, 'w185') || undefined }}
                    style={styles.searchThumb}
                  />
                  <Text style={styles.searchResultTitle} numberOfLines={1}>
                    {getEnglishTitle(item)}
                  </Text>
                  <Plus size={16} color="#10B981" />
                </IOSPressable>
              ))}
            </View>
          )}
        </View>

        {/* Unranked Pool */}
        <View style={styles.unrankedSection}>
          <View style={styles.unrankedHeader}>
            <Text style={styles.sectionHeading}>Unranked Movies ({unranked.length})</Text>
            <Text style={styles.unrankedTip}>Tap any movie to rank it</Text>
          </View>

          <View style={styles.unrankedGrid}>
            {unranked.map((m) => (
              <IOSPressable
                key={m.movie_id}
                style={styles.unrankedCard}
                onPress={() => handleOpenAssign(m)}
                activeScale={0.94}
                accessibilityRole="button"
                accessibilityLabel={m.title}
              >
                <Image
                  source={{ uri: posterUrl(m.poster_path, 'w185') || undefined }}
                  style={styles.unrankedPoster}
                  contentFit="cover"
                />
                <Text style={styles.unrankedTitle} numberOfLines={1}>
                  {m.title}
                </Text>
              </IOSPressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Tier Assignment Modal */}
      <Modal
        visible={isAssignModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAssignModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rank Movie</Text>
              <IOSPressable
                onPress={() => setIsAssignModalOpen(false)}
                activeScale={0.9}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color="#FFFFFF" />
              </IOSPressable>
            </View>

            {selectedMovie && (
              <Text style={styles.modalMovieName} numberOfLines={2}>
                {selectedMovie.title}
              </Text>
            )}

            <Text style={styles.modalInstruction}>Select tier:</Text>

            <View style={styles.tierChoices}>
              {tiers.map((t) => (
                <IOSPressable
                  key={t.id}
                  style={[styles.tierChoiceBtn, { borderColor: t.color, backgroundColor: `${t.color}15` }]}
                  onPress={() => handleAssignToTier(t.id)}
                  activeScale={0.96}
                  accessibilityRole="button"
                  accessibilityLabel={t.name}
                >
                  <View style={[styles.choicePill, { backgroundColor: t.color }]}>
                    <Text style={styles.choiceLetter}>{t.name.split(' - ')[0]}</Text>
                  </View>
                  <Text style={styles.choiceName}>{t.name.split(' - ')[1]}</Text>
                </IOSPressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  resetBtn: {
    width: 36,
    height: 36,
    minHeight: 36,
    minWidth: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: 20,
  },
  tiersContainer: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tierRow: {
    flexDirection: 'row',
    minHeight: 80,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tierHeader: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  tierLetter: {
    fontFamily: fonts.headingBlack,
    fontSize: 22,
    color: '#000000',
  },
  tierSubLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 8,
    color: '#000000',
    textTransform: 'uppercase',
  },
  tierMoviesScroll: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  emptyTierText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    paddingLeft: 10,
  },
  tierMovieCard: {
    width: 50,
    height: 70,
    minHeight: 70,
    minWidth: 50,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  tierMoviePoster: {
    ...StyleSheet.absoluteFillObject,
  },
  removeBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    gap: 8,
  },
  sectionHeading: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#FFFFFF',
  },
  searchResultsBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: 4,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 10,
  },
  searchThumb: {
    width: 28,
    height: 40,
    borderRadius: 4,
  },
  searchResultTitle: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  unrankedSection: {
    gap: 10,
  },
  unrankedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unrankedTip: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#9CA3AF',
  },
  unrankedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unrankedCard: {
    width: 72,
    alignItems: 'center',
  },
  unrankedPoster: {
    width: 72,
    height: 104,
    borderRadius: 8,
    marginBottom: 4,
  },
  unrankedTitle: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1C1A22',
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: '#FFFFFF',
  },
  modalMovieName: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: colors.primary,
    marginBottom: 12,
  },
  modalInstruction: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  tierChoices: {
    gap: 8,
  },
  tierChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: 10,
    borderWidth: 1,
    gap: 12,
  },
  choicePill: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceLetter: {
    fontFamily: fonts.headingBlack,
    fontSize: 16,
    color: '#000000',
  },
  choiceName: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
});

