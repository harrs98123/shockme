import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Video,
  Award,
  Star,
  Rocket,
  Disc,
  Trophy,
  ArrowRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { PlotmintLogo } from '@/components/ui/PlotmintLogo';
import { Avatar } from '@/components/avatar/Avatar';
import { useAuth } from '@/hooks/useAuth';

interface CategoryCardItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  route: string;
}

const CATEGORY_CARDS: CategoryCardItem[] = [
  {
    id: 'trending',
    title: 'Trending Now',
    subtitle: 'Most popular movies this week',
    icon: <Video size={24} color="#F43F5E" strokeWidth={2.2} />,
    accentColor: '#F43F5E',
    route: '/catalog/trending',
  },
  {
    id: 'popular',
    title: 'Most Popular',
    subtitle: 'All-time fan favorites & chart-toppers',
    icon: <Award size={24} color="#F59E0B" strokeWidth={2.2} />,
    accentColor: '#F59E0B',
    route: '/catalog/popular',
  },
  {
    id: 'top-rated',
    title: 'Top Rated',
    subtitle: 'Critically acclaimed masterpieces',
    icon: <Star size={24} color="#A855F7" strokeWidth={2.2} />,
    accentColor: '#A855F7',
    route: '/catalog/top-rated',
  },
  {
    id: 'upcoming',
    title: 'Upcoming Releases',
    subtitle: 'Anticipated films coming to theaters & streaming',
    icon: <Rocket size={24} color="#38BDF8" strokeWidth={2.2} />,
    accentColor: '#38BDF8',
    route: '/upcoming',
  },
  {
    id: 'anime',
    title: 'Anime Vault',
    subtitle: 'Top animated series & feature films',
    icon: <Disc size={24} color="#EC4899" strokeWidth={2.2} />,
    accentColor: '#EC4899',
    route: '/browse/anime',
  },
  {
    id: 'awards',
    title: 'Award Winners',
    subtitle: 'Oscar, Cannes, BAFTA & festival triumphs',
    icon: <Trophy size={24} color="#EF4444" strokeWidth={2.2} />,
    accentColor: '#EF4444',
    route: '/browse/awards',
  },
];

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero Titles ── */}
        <Text style={styles.heroTitle}>
          Browse by{'\n'}Category
        </Text>
        <Text style={styles.heroSubtitle}>
          Quickly jump into our curated collections of trending, popular, and upcoming cinema.
        </Text>

        {/* ── Category Large Cards ── */}
        <View style={styles.cardsList}>
          {CATEGORY_CARDS.map((cat) => (
            <IOSPressable
              key={cat.id}
              style={styles.card}
              onPress={() => router.push(cat.route as never)}
              activeScale={0.97}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={cat.title}
            >
              {/* Icon Bubble */}
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: `${cat.accentColor}18`,
                    borderColor: `${cat.accentColor}35`,
                  },
                ]}
              >
                {cat.icon}
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.cardTitle}>{cat.title}</Text>
              <Text style={styles.cardSubtitle}>{cat.subtitle}</Text>

              {/* Action Link */}
              <View style={styles.linkRow}>
                <Text style={[styles.linkText, { color: cat.accentColor }]}>
                  View All Titles
                </Text>
                <ArrowRight size={14} color={cat.accentColor} strokeWidth={2.4} />
              </View>
            </IOSPressable>
          ))}
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
  },
  heroTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 34,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 20,
    marginBottom: 26,
    maxWidth: 320,
  },
  cardsList: {
    gap: 16,
  },
  card: {
    backgroundColor: '#131219',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 19,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 18,
    marginBottom: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
  },
});
