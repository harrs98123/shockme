import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Dimensions,
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Paperclip,
  Mic,
  Send,
  Compass,
  Radio,
  CloudRain,
  Rocket,
  Eye,
  Zap,
  Coffee,
  Moon,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { curatedApi } from '@/api/curated';
import { useAuth } from '@/hooks/useAuth';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { getEnglishTitle } from '@/lib/format';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { PlotmintLogo } from '@/components/ui/PlotmintLogo';
import { Avatar } from '@/components/avatar/Avatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

interface VibeOption {
  id: string;
  label: string;
  concept: string;
  icon: React.ReactNode;
  color: string;
}

const POPULAR_VIBES: VibeOption[] = [
  {
    id: 'cyberpunk',
    label: 'Cyberpunk Neon Thrill',
    concept: 'cyberpunk neon thrill synthwave high-tech sci-fi blade runner',
    icon: <Radio size={14} color="#06B6D4" />,
    color: '#06B6D4',
  },
  {
    id: 'melancholy',
    label: 'Rainy Day Melancholy',
    concept: 'rainy day melancholy cozy emotional deep bittersweet drama',
    icon: <CloudRain size={14} color="#818CF8" />,
    color: '#818CF8',
  },
  {
    id: 'mind-bending',
    label: 'Mind-Bending Sci-Fi',
    concept: 'mind-bending time loop space thriller quantum mystery inception',
    icon: <Rocket size={14} color="#C084FC" />,
    color: '#C084FC',
  },
  {
    id: 'psychological',
    label: 'Twisted Psychological Thriller',
    concept: 'twisted psychological thriller dark secrets mind games suspense',
    icon: <Eye size={14} color="#FB7185" />,
    color: '#FB7185',
  },
  {
    id: 'action',
    label: 'Adrenaline-Pumping Action',
    concept: 'adrenaline-pumping high octane action martial arts stunts blockbuster',
    icon: <Zap size={14} color="#FBBF24" />,
    color: '#FBBF24',
  },
  {
    id: 'comfort',
    label: 'Cozy Feel-Good Comfort',
    concept: 'heartwarming cozy comfort slice of life uplifting friendship',
    icon: <Coffee size={14} color="#34D399" />,
    color: '#34D399',
  },
  {
    id: 'gothic',
    label: 'Gothic Supernatural Mystery',
    concept: 'gothic supernatural mystery eerie fog atmospheric vampire haunted',
    icon: <Moon size={14} color="#A78BFA" />,
    color: '#A78BFA',
  },
];

function MoodResultCard({ movie }: { movie: Media }) {
  const title = getEnglishTitle(movie);
  const mediaType = movie.media_type ?? (movie.title ? 'movie' : 'tv');
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const year = (movie.release_date ?? movie.first_air_date)?.slice(0, 4);

  return (
    <IOSPressable
      style={styles.card}
      onPress={() => router.push(`/${mediaType}/${movie.id}` as never)}
      activeScale={0.96}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <PosterImage
        path={movie.poster_path}
        title={title}
        movieId={movie.id}
        width={CARD_WIDTH}
        height={POSTER_HEIGHT}
        borderRadius={16}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.movieTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          {rating ? <Text style={styles.ratingText}>★ {rating}</Text> : null}
          {year ? <Text style={styles.yearText}>• {year}</Text> : null}
        </View>
      </View>
    </IOSPressable>
  );
}

export default function MoodScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [promptText, setPromptText] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<VibeOption | null>(null);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  const { data: movies = [], isLoading, isFetching } = useQuery<Media[]>({
    queryKey: ['movies', 'mood', activeQuery],
    queryFn: async () => {
      if (!activeQuery) return [];
      const res = await curatedApi.mood(activeQuery, 16);
      if (Array.isArray(res)) return res;
      return res.results || res.recommendations || [];
    },
    enabled: Boolean(activeQuery && activeQuery.length > 2),
    staleTime: 5 * 60 * 1000,
  });

  const handleSelectVibe = (vibe: VibeOption) => {
    setSelectedVibe(vibe);
    setPromptText(vibe.label);
    setActiveQuery(vibe.concept);
  };

  const handleSearch = () => {
    if (promptText.trim().length > 1) {
      setSelectedVibe(null);
      setActiveQuery(promptText.trim());
    }
  };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Media>) => <MoodResultCard movie={item} />,
    []
  );
  const keyExtractor = useCallback((item: Media) => String(item.id), []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      {/* Ambient Top Glow */}
      <LinearGradient
        colors={['rgba(139,92,246,0.18)', 'rgba(99,102,241,0.08)', 'transparent']}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      {/* ── Top Bar Header (Logo + Avatar) ── */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <PlotmintLogo size={24} />
          <Text style={styles.brandTitle}>
            plot<Text style={{ color: '#10B981' }}>mint•</Text>
          </Text>
        </View>

        <IOSPressable
          style={styles.avatarBtn}
          onPress={() => router.push('/(tabs)/profile' as never)}
          activeScale={0.92}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <View style={styles.avatarWrap}>
            <Avatar
              src={user?.avatar_url}
              seed={user?.username || user?.name}
              name={user?.name || 'You'}
              size={34}
              borderRadius={17}
            />
          </View>
        </IOSPressable>
      </View>

      <FlatList<Media>
        data={movies}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            {/* Neural Vibe Engine Tag */}
            <View style={styles.tagWrap}>
              <View style={styles.engineBadge}>
                <Sparkles size={13} color="#C084FC" />
                <Text style={styles.engineBadgeText}>NEURAL VIBE ENGINE</Text>
              </View>
            </View>

            {/* Hero Heading */}
            <Text style={styles.heroTitle}>
              Describe your <Text style={{ color: '#C084FC' }}>Vibe.</Text>
              {'\n'}We curate the Cinema.
            </Text>

            {/* Hero Subtitle */}
            <Text style={styles.heroSubtitle}>
              Type any feeling, atmosphere, scene description, or mood in any language.
              Our AI neural engine maps your exact emotion directly to cinema recommendations.
            </Text>

            {/* ── Mood Input Capsule ── */}
            <View style={styles.inputCapsule}>
              <IOSPressable
                style={styles.clipBtn}
                onPress={() => {}}
                activeScale={0.88}
                accessibilityRole="button"
                accessibilityLabel="Attach scene reference"
              >
                <Paperclip size={18} color="rgba(255,255,255,0.45)" />
              </IOSPressable>

              <TextInput
                style={styles.input}
                placeholder="I want a mind-bending thriller like Inception..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={promptText}
                onChangeText={setPromptText}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                keyboardAppearance="dark"
              />

              <IOSPressable
                style={styles.micBtn}
                onPress={() => {}}
                activeScale={0.88}
                accessibilityRole="button"
                accessibilityLabel="Voice mood input"
              >
                <Mic size={18} color="rgba(255,255,255,0.45)" />
              </IOSPressable>

              <IOSPressable
                style={styles.sendBtn}
                onPress={handleSearch}
                activeScale={0.9}
                accessibilityRole="button"
                accessibilityLabel="Send Prompt"
              >
                <Send size={15} color="#FFFFFF" />
              </IOSPressable>
            </View>

            {/* ── Popular Atmospheric Vibes ── */}
            <View style={styles.vibesSection}>
              <View style={styles.vibesHeaderRow}>
                <Compass size={13} color="rgba(255,255,255,0.5)" />
                <Text style={styles.vibesHeaderTitle}>POPULAR ATMOSPHERIC VIBES</Text>
              </View>

              <View style={styles.vibeChipsWrap}>
                {POPULAR_VIBES.map((vibe) => {
                  const isSelected = selectedVibe?.id === vibe.id;
                  return (
                    <IOSPressable
                      key={vibe.id}
                      style={[
                        styles.vibeChip,
                        {
                          borderColor: isSelected
                            ? vibe.color
                            : `${vibe.color}35`,
                          backgroundColor: isSelected
                            ? `${vibe.color}25`
                            : 'rgba(255,255,255,0.04)',
                        },
                      ]}
                      onPress={() => handleSelectVibe(vibe)}
                      activeScale={0.94}
                      accessibilityRole="button"
                      accessibilityLabel={vibe.label}
                    >
                      {vibe.icon}
                      <Text
                        style={[
                          styles.vibeChipText,
                          { color: isSelected ? '#FFFFFF' : vibe.color },
                        ]}
                      >
                        {vibe.label}
                      </Text>
                    </IOSPressable>
                  );
                })}
              </View>
            </View>

            {/* Idle State / Neural Pathway Ready banner */}
            {!activeQuery && (
              <View style={styles.idleState}>
                <View style={styles.idleIconBox}>
                  <TrendingUp size={24} color="#C084FC" />
                </View>
                <Text style={styles.idleTitle}>Neural Pathway Ready</Text>
                <Text style={styles.idleSub}>
                  Choose an atmospheric vibe above or type your exact mood in the prompt box.
                </Text>
              </View>
            )}

            {/* Loading Indicator */}
            {(isLoading || isFetching) && activeQuery && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C084FC" />
                <Text style={styles.loadingText}>Synthesizing cinematic atmosphere...</Text>
              </View>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  avatarBtn: {
    padding: 2,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#16151E',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  headerContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    alignItems: 'center',
  },
  tagWrap: {
    marginBottom: 14,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(192, 132, 252, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  engineBadgeText: {
    fontFamily: fonts.headingBlack,
    fontSize: 10.5,
    color: '#C084FC',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  inputCapsule: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 22,
  },
  clipBtn: {
    paddingRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  micBtn: {
    paddingHorizontal: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  vibesSection: {
    width: '100%',
    marginBottom: 28,
  },
  vibesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 12,
  },
  vibesHeaderTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.8,
  },
  vibeChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  vibeChipText: {
    fontFamily: fonts.headingSemi,
    fontSize: 11.5,
  },
  idleState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  idleIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(192, 132, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  idleTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  idleSub: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#C084FC',
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardInfo: {
    padding: 8,
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 12.5,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontFamily: fonts.headingSemi,
    fontSize: 11,
    color: '#FFC107',
  },
  yearText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
});
