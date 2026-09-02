import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Flame,
  Star,
  Trophy,
  Rocket,
  Disc,
  Award,
  Clapperboard,
  Compass,
  Palette,
  Smile,
  ShieldAlert,
  Video,
  Sparkles,
  Users,
  Wand2,
  Landmark,
  Skull,
  Music,
  Search,
  Heart,
  Zap,
  Tv,
  Activity,
  Crosshair,
  Mountain,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { PlotmintLogo } from '@/components/ui/PlotmintLogo';
import { Avatar } from '@/components/avatar/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { posterUrl } from '@/lib/images';

interface BrowseItem {
  id: string;
  title: string;
  subtitle: string;
  posterPath: string;
  gradient: [string, string];
  accentColor: string;
  icon: React.ElementType;
  route: string;
}

const CATEGORIES: BrowseItem[] = [
  {
    id: 'trending',
    title: 'Trending Now',
    subtitle: 'What the entire world is watching right now',
    gradient: ['#5a1616', '#120505'],
    posterPath: '/iADOJ8Zymht2JPMoy3R7xceZprc.jpg', // Furiosa
    accentColor: '#F43F5E',
    icon: Flame,
    route: '/catalog/trending',
  },
  {
    id: 'popular',
    title: 'Most Popular',
    subtitle: 'Global crowd-pleasers & box-office blockbusters',
    gradient: ['#5d3810', '#140b03'],
    posterPath: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg', // Inside Out 2
    accentColor: '#F59E0B',
    icon: Star,
    route: '/catalog/popular',
  },
  {
    id: 'top-rated',
    title: 'Top Rated',
    subtitle: 'All-time cinematic classics and masterpieces',
    gradient: ['#0e486b', '#04121d'],
    posterPath: '/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg', // The Godfather
    accentColor: '#3B82F6',
    icon: Trophy,
    route: '/catalog/top-rated',
  },
  {
    id: 'upcoming',
    title: 'Upcoming Releases',
    subtitle: 'Anticipated theatrical premieres & trailers',
    gradient: ['#144933', '#04120c'],
    posterPath: '/czembW0Rk1Ke7lCJGahbOhdCuhV.jpg', // Dune: Part Two
    accentColor: '#10B981',
    icon: Rocket,
    route: '/upcoming',
  },
  {
    id: 'anime',
    title: 'Anime Vault',
    subtitle: 'Legendary animation marvels & studio features',
    gradient: ['#431d68', '#0f0518'],
    posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', // Spider-Verse
    accentColor: '#EC4899',
    icon: Disc,
    route: '/browse/anime',
  },
  {
    id: 'awards',
    title: 'Award Winners',
    subtitle: 'Oscar, Cannes, BAFTA & festival triumphs',
    gradient: ['#4a1c12', '#110503'],
    posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', // Oppenheimer
    accentColor: '#EF4444',
    icon: Award,
    route: '/browse/awards',
  },
  {
    id: 'franchise',
    title: 'Cinematic Universes',
    subtitle: 'Marvel, Star Wars, DC & complete timelines',
    gradient: ['#312e81', '#0c0a24'],
    posterPath: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', // Deadpool & Wolverine
    accentColor: '#818CF8',
    icon: Clapperboard,
    route: '/browse/franchise',
  },
];

const GENRES: BrowseItem[] = [
  {
    id: '28',
    title: 'Action',
    subtitle: 'High octane thrillers & explosive battles',
    gradient: ['#5a1616', '#120505'],
    posterPath: '/iADOJ8Zymht2JPMoy3R7xceZprc.jpg', // Furiosa
    accentColor: '#F43F5E',
    icon: Flame,
    route: '/browse/genre?initialId=28',
  },
  {
    id: '12',
    title: 'Adventure',
    subtitle: 'Epic journeys & uncharted desert worlds',
    gradient: ['#144933', '#04120c'],
    posterPath: '/czembW0Rk1Ke7lCJGahbOhdCuhV.jpg', // Dune 2
    accentColor: '#10B981',
    icon: Compass,
    route: '/browse/genre?initialId=12',
  },
  {
    id: '16',
    title: 'Animation',
    subtitle: 'Anime marvels & multiverse masterpieces',
    gradient: ['#431d68', '#0f0518'],
    posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', // Spider-Verse
    accentColor: '#A855F7',
    icon: Palette,
    route: '/browse/genre?initialId=16',
  },
  {
    id: '35',
    title: 'Comedy',
    subtitle: 'Laughs, mayhem & good vibes',
    gradient: ['#5d3810', '#140b03'],
    posterPath: '/wWba3TaojhK7NdycRhoQpsG0FaH.jpg', // Despicable Me 4
    accentColor: '#F59E0B',
    icon: Smile,
    route: '/browse/genre?initialId=35',
  },
  {
    id: '80',
    title: 'Crime',
    subtitle: 'Underworld heists & Gotham noir',
    gradient: ['#1e293b', '#020617'],
    posterPath: '/74xTEgt7R36Fpooo50r9T25onhq.jpg', // The Batman
    accentColor: '#94A3B8',
    icon: ShieldAlert,
    route: '/browse/genre?initialId=80',
  },
  {
    id: '99',
    title: 'Documentary',
    subtitle: 'Real world revelations & breathtaking climbs',
    gradient: ['#164e63', '#02131b'],
    posterPath: '/1E5baAaEse26fej7uHcjOgEE2t2.jpg', // Free Solo
    accentColor: '#38BDF8',
    icon: Video,
    route: '/browse/genre?initialId=99',
  },
  {
    id: '18',
    title: 'Drama',
    subtitle: 'Deep emotions & timeless hope',
    gradient: ['#4c1d95', '#0f0426'],
    posterPath: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', // Shawshank
    accentColor: '#8B5CF6',
    icon: Sparkles,
    route: '/browse/genre?initialId=18',
  },
  {
    id: '10751',
    title: 'Family',
    subtitle: 'Heartfelt magic for every generation',
    gradient: ['#7c2d12', '#1c0802'],
    posterPath: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg', // Inside Out 2
    accentColor: '#FB923C',
    icon: Users,
    route: '/browse/genre?initialId=10751',
  },
  {
    id: '14',
    title: 'Fantasy',
    subtitle: 'Mythical realms, wizards & epic sagas',
    gradient: ['#581c87', '#120224'],
    posterPath: '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // LOTR Fellowship
    accentColor: '#C084FC',
    icon: Wand2,
    route: '/browse/genre?initialId=14',
  },
  {
    id: '36',
    title: 'History',
    subtitle: 'Pivotal moments that shaped humanity',
    gradient: ['#78350f', '#1c0a01'],
    posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', // Oppenheimer
    accentColor: '#D97706',
    icon: Landmark,
    route: '/browse/genre?initialId=36',
  },
  {
    id: '27',
    title: 'Horror',
    subtitle: 'Dark psychological chills & night terrors',
    gradient: ['#4a1c12', '#110503'],
    posterPath: '/l1175hgL5DoXnqeZQCcU3eZIdhX.jpg', // Terrifier 3
    accentColor: '#EF4444',
    icon: Skull,
    route: '/browse/genre?initialId=27',
  },
  {
    id: '10402',
    title: 'Music',
    subtitle: 'Sonic passion, intense rhythm & stage drive',
    gradient: ['#831843', '#1f020d'],
    posterPath: '/uDO8zWDhfWwoFdKS4fzkVJt0Rf0.jpg', // La La Land
    accentColor: '#EC4899',
    icon: Music,
    route: '/browse/genre?initialId=10402',
  },
  {
    id: '9648',
    title: 'Mystery',
    subtitle: 'Whodunit puzzles & brilliant detective twists',
    gradient: ['#1e1b4b', '#050410'],
    posterPath: '/vDGr1YdrlfbU9wxTOdpf3zChmv9.jpg', // Glass Onion / Knives Out
    accentColor: '#6366F1',
    icon: Search,
    route: '/browse/genre?initialId=9648',
  },
  {
    id: '10749',
    title: 'Romance',
    subtitle: 'Passionate connections & grand love stories',
    gradient: ['#9d174d', '#20020e'],
    posterPath: '/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', // Titanic
    accentColor: '#F472B6',
    icon: Heart,
    route: '/browse/genre?initialId=10749',
  },
  {
    id: '878',
    title: 'Science Fiction',
    subtitle: 'Black holes, spacetime & interstellar futures',
    gradient: ['#0e486b', '#04121d'],
    posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
    accentColor: '#0284C7',
    icon: Zap,
    route: '/browse/genre?initialId=878',
  },
  {
    id: '10770',
    title: 'TV Movie',
    subtitle: 'Special features & superhero team-ups',
    gradient: ['#312e81', '#0c0a24'],
    posterPath: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', // Deadpool & Wolverine
    accentColor: '#818CF8',
    icon: Tv,
    route: '/browse/genre?initialId=10770',
  },
  {
    id: '53',
    title: 'Thriller',
    subtitle: 'Edge-of-your-seat suspense & dark secrets',
    gradient: ['#7f1d1d', '#1a0303'],
    posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
    accentColor: '#DC2626',
    icon: Activity,
    route: '/browse/genre?initialId=53',
  },
  {
    id: '10752',
    title: 'War',
    subtitle: 'Trench warfare, brotherhood & frontline bravery',
    gradient: ['#701a75', '#1c021e'],
    posterPath: '/iZhaTkCpmdZtCniStkWgKyGUiur.jpg', // 1917
    accentColor: '#A21CAF',
    icon: Crosshair,
    route: '/browse/genre?initialId=10752',
  },
  {
    id: '37',
    title: 'Western',
    subtitle: 'Bounty hunters, dusty trails & outlaws',
    gradient: ['#713f12', '#180c02'],
    posterPath: '/2oZPub2rwMUbRLb4ytbt8ZZFbzs.jpg', // Django Unchained
    accentColor: '#D97706',
    icon: Mountain,
    route: '/browse/genre?initialId=37',
  },
];

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'genres' | 'categories'>('genres');

  const items = activeTab === 'genres' ? GENRES : CATEGORIES;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      {/* Ambient Top Glow */}
      <LinearGradient
        colors={['rgba(139,92,246,0.18)', 'rgba(99,102,241,0.08)', 'transparent']}
        style={[styles.ambientGlow, { pointerEvents: 'none' }]}
      />

      {/* ── Top Bar Header (Logo + Avatar) ── */}
      <View style={styles.topBar}>
        <PlotmintLogo size={24} />

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero Titles ── */}
        <Text style={styles.heroTitle}>
          Browse & Explore
        </Text>
        <Text style={styles.heroSubtitle}>
          Discover movies and shows through curated themes and genres.
        </Text>

        {/* ── Segment Filter Tabs ── */}
        <View style={styles.segmentedControl}>
          <IOSPressable
            style={[styles.segmentBtn, activeTab === 'genres' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('genres')}
            activeScale={0.96}
          >
            <Text style={[styles.segmentText, activeTab === 'genres' && styles.segmentTextActive]}>
              All Genres (19)
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.segmentBtn, activeTab === 'categories' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('categories')}
            activeScale={0.96}
          >
            <Text style={[styles.segmentText, activeTab === 'categories' && styles.segmentTextActive]}>
              Collections & Lists
            </Text>
          </IOSPressable>
        </View>

        {/* ── Showcase Cards List ── */}
        <View style={styles.cardsList}>
          {items.map((item) => {
            const IconComp = item.icon;
            const posterUri = posterUrl(item.posterPath, 'w342');

            return (
              <IOSPressable
                key={item.id}
                style={styles.showcaseCard}
                onPress={() => router.push(item.route as never)}
                activeScale={0.97}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                {/* Gradient Background */}
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Left Gradient Overlay for text contrast */}
                <LinearGradient
                  colors={['rgba(0,0,0,0.92)', 'rgba(0,0,0,0.6)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Tilted Movie Poster on Right */}
                <View style={styles.posterWrap} pointerEvents="none">
                  {posterUri ? (
                    <Image
                      source={{ uri: posterUri }}
                      style={styles.posterImg}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : null}
                  <LinearGradient
                    colors={['rgba(0,0,0,0.35)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.8, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </View>

                {/* Left Content */}
                <View style={styles.cardContent}>
                  {/* Top-left Icon Badge */}
                  <View style={[styles.iconBadge, { borderColor: `${item.accentColor}40` }]}>
                    <IconComp size={15} color="#FFFFFF" strokeWidth={2.2} />
                  </View>

                  {/* Bottom: Title & Subtitle */}
                  <View style={styles.titleWrap}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>

                {/* Subtle border accent */}
                <View
                  style={[
                    styles.borderGlow,
                    { borderColor: `${item.accentColor}30` },
                  ]}
                  pointerEvents="none"
                />
              </IOSPressable>
            );
          })}
        </View>
      </ScrollView>
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
    marginBottom: 4,
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
  },
  heroTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 30,
    color: '#FFFFFF',
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
    marginBottom: 18,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  segmentText: {
    fontFamily: fonts.headingSemi,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.heading,
  },
  cardsList: {
    gap: 14,
  },
  showcaseCard: {
    height: 126,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  posterWrap: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 106,
    height: 146,
    transform: [{ rotate: '8deg' }],
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
  },
  posterImg: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    position: 'relative',
    zIndex: 10,
    height: '100%',
    padding: 16,
    justifyContent: 'space-between',
    maxWidth: '64%',
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  titleWrap: {
    gap: 3,
  },
  cardTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 15,
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
  },
});
