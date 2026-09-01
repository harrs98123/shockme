import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Rss,
  Calendar,
  Eye,
  Compass,
  Moon,
  Search,
  ChevronRight,
  Users,
  Library,
  Gem,
  Globe,
  Award,
  Tv,
  Flame,
} from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth.store';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { IOSListRow } from '@/components/ios/IOSListRow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Nav items ──────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  accent?: string;
}

const QUICK_NAV: NavItem[] = [
  { id: 'feed',     label: 'Feed',       icon: <Rss size={18} color="#E50914" />,         route: '/(tabs)/feed',  accent: '#E50914' },
  { id: 'upcoming', label: 'Upcoming',   icon: <Calendar size={18} color="#9CA3AF" />,     route: '/upcoming' },
  { id: 'must',     label: 'Must Watch', icon: <Eye size={18} color="#9CA3AF" />,          route: '/must-watch' },
  { id: 'finder',   label: 'Finder',     icon: <Compass size={18} color="#9CA3AF" />,      route: '/finder' },
  { id: 'mood',     label: 'Mood',       icon: <Moon size={18} color="#9CA3AF" />,         route: '/mood' },
  { id: 'search',   label: 'Search',     icon: <Search size={18} color="#9CA3AF" />,       route: '/(tabs)/search' },
];

const BROWSE_ITEM: NavItem = {
  id: 'browse-all',
  label: 'Browse All',
  icon: <Globe size={20} color="#8B5CF6" />,
  route: '/(tabs)/browse',
  accent: '#8B5CF6',
};

const MORE_NAV: NavItem[] = [
  { id: 'tierlist',    label: 'Tier Lists (Rank)',   icon: <Award size={18} color="#F59E0B" />,    route: '/tierlist', accent: '#F59E0B' },
  { id: 'swipe',       label: 'Movie Match (Swipe)', icon: <Flame size={18} color="#EF4444" />,    route: '/swipe', accent: '#EF4444' },
  { id: 'groups',      label: 'Groups',      icon: <Users size={18} color="#9CA3AF" />,    route: '/groups' },
  { id: 'collections', label: 'Collections', icon: <Library size={18} color="#9CA3AF" />,  route: '/collections' },
  { id: 'gems',        label: 'Gems',        icon: <Gem size={18} color="#9CA3AF" />,      route: '/gems' },
  { id: 'universe',    label: 'Universe',    icon: <Globe size={18} color="#9CA3AF" />,    route: '/universe' },
  { id: 'predict',     label: 'Predict',     icon: <Award size={18} color="#9CA3AF" />,    route: '/predictions' },
];

// ─── Components ──────────────────────────────────────────────────────────────

function QuickNavCard({ item, onPress }: { item: NavItem; onPress: () => void }) {
  return (
    <IOSPressable
      style={[styles.quickCard, item.accent && { borderColor: item.accent + '30' }]}
      onPress={onPress}
      activeScale={0.95}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={styles.quickCardIcon}>{item.icon}</View>
      <Text style={styles.quickCardLabel}>{item.label}</Text>
    </IOSPressable>
  );
}

// ─── Sheet ───────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ExploreSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const navigate = useCallback(
    (route: string) => {
      onClose();
      setTimeout(() => router.push(route as never), 100);
    },
    [onClose]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle + Header */}
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <IOSPressable
            style={styles.closeBtn}
            onPress={onClose}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.textMuted} />
          </IOSPressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          bounces={true}
          decelerationRate="fast"
        >
          {/* ── QUICK NAV ─────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>QUICK NAV</Text>
          <View style={styles.quickGrid}>
            {QUICK_NAV.map((item) => (
              <QuickNavCard
                key={item.id}
                item={item}
                onPress={() => navigate(item.route)}
              />
            ))}
          </View>

          {/* ── Browse All highlight card ──────────────────────────── */}
          <IOSPressable
            style={styles.browseCard}
            onPress={() => navigate(BROWSE_ITEM.route)}
            activeScale={0.96}
            accessibilityRole="button"
            accessibilityLabel="Browse All"
          >
            <View style={styles.browseCardLeft}>
              <View style={styles.browseIconCircle}>{BROWSE_ITEM.icon}</View>
              <View>
                <Text style={styles.browseCardTitle}>{BROWSE_ITEM.label}</Text>
                <Text style={styles.browseCardSub}>Category · Genre · Country +6</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </IOSPressable>

          {/* ── MORE ──────────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>MORE</Text>
          <View style={styles.moreGroup}>
            {MORE_NAV.map((item, idx) => (
              <IOSListRow
                key={item.id}
                title={item.label}
                icon={item.icon}
                onPress={() => navigate(item.route)}
                isFirst={idx === 0}
                isLast={idx === MORE_NAV.length - 1}
              />
            ))}
          </View>

          {/* ── User profile footer ───────────────────────────────── */}
          {user ? (
            <View style={styles.profileFooter}>
              <View style={styles.profileAvatar}>
                <Tv size={20} color={colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user.name}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
            </View>
          ) : (
            <IOSPressable
              style={styles.loginFooter}
              onPress={() => navigate('/(auth)/login')}
              activeScale={0.97}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={styles.loginFooterText}>Sign in to unlock your profile</Text>
            </IOSPressable>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111111',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    minHeight: 32,
    minWidth: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  // 2-column quick-nav grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: 14,
  },
  quickCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  // Browse All highlight
  browseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  browseCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  browseIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseCardTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
  },
  browseCardSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  // More rows
  moreGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  // Profile footer
  profileFooter: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
  },
  profileEmail: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  loginFooter: {
    marginTop: 24,
    padding: 14,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primarySoftBorder,
    alignItems: 'center',
  },
  loginFooterText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.primary,
  },
});

