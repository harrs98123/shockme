import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  LayoutGrid,
  Globe,
  Languages,
  Users,
  Award,
  Crown,
  Disc,
  Video,
  Clapperboard,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { fonts, radius } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';

const PADDING = 16;
const GAP = 8;

interface BrowseCategoryItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  route: string;
}

const BROWSE_ITEMS: BrowseCategoryItem[] = [
  {
    id: 'category',
    label: 'Category',
    icon: <LayoutGrid size={22} color="#C084FC" />,
    color: '#C084FC',
    route: '/(tabs)/browse',
  },
  {
    id: 'genre',
    label: 'Genre',
    icon: <Clapperboard size={22} color="#F472B6" />,
    color: '#F472B6',
    route: '/browse/genre',
  },
  {
    id: 'country',
    label: 'Country',
    icon: <Globe size={22} color="#60A5FA" />,
    color: '#60A5FA',
    route: '/browse/country',
  },
  {
    id: 'language',
    label: 'Language',
    icon: <Languages size={22} color="#34D399" />,
    color: '#34D399',
    route: '/browse/language',
  },
  {
    id: 'family',
    label: 'Family Friendly',
    icon: <Users size={22} color="#FBBF24" />,
    color: '#FBBF24',
    route: '/browse/family',
  },
  {
    id: 'awards',
    label: 'Award Winners',
    icon: <Award size={22} color="#F87171" />,
    color: '#F87171',
    route: '/browse/awards',
  },
  {
    id: 'select',
    label: 'Plotmint Select',
    icon: <Crown size={22} color="#A78BFA" />,
    color: '#A78BFA',
    route: '/must-watch',
  },
  {
    id: 'anime',
    label: 'Anime',
    icon: <Disc size={22} color="#F472B6" />,
    color: '#F472B6',
    route: '/browse/anime',
  },
  {
    id: 'franchise',
    label: 'Franchise',
    icon: <Video size={22} color="#38BDF8" />,
    color: '#38BDF8',
    route: '/browse/franchise',
  },
];

interface BrowseSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function BrowseSheet({ visible, onClose }: BrowseSheetProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.floor((windowWidth - PADDING * 2 - GAP * 2) / 3);

  const translateY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, {
        damping: 24,
        stiffness: 220,
        mass: 0.8,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(500, { duration: 200 });
    }
  }, [visible]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as never);
    }, 120);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlayRoot}>
        {/* Dark blurred backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
        </TouchableWithoutFeedback>

        {/* Animated Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 20) + 14 },
            sheetAnimatedStyle,
          ]}
        >
          {/* Top Pill Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handlePill} />
          </View>

          {/* Sheet Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.titleEmoji}>🎭</Text>
              <Text style={styles.titleText}>Browse By</Text>
            </View>

            <IOSPressable
              style={styles.closeCircleBtn}
              onPress={onClose}
              activeScale={0.88}
              accessibilityRole="button"
              accessibilityLabel="Close Browse Sheet"
            >
              <ChevronLeft size={18} color="#FFFFFF" strokeWidth={2.4} />
            </IOSPressable>
          </View>

          {/* 3x3 Grid (Guaranteed 3 cards per row) */}
          <View style={styles.grid}>
            {BROWSE_ITEMS.map((item) => (
              <IOSPressable
                key={item.id}
                style={[
                  styles.card,
                  { width: cardWidth },
                ]}
                onPress={() => handleNavigate(item.route)}
                activeScale={0.93}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                {/* Top Accent Glowing Line */}
                <View
                  style={[
                    styles.cardTopAccent,
                    { backgroundColor: item.color },
                  ]}
                />

                {/* Circular Icon Bubble */}
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: `${item.color}18`,
                      borderColor: `${item.color}35`,
                    },
                  ]}
                >
                  {item.icon}
                </View>

                {/* Category Label */}
                <Text style={styles.cardLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </IOSPressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheetContainer: {
    backgroundColor: '#0F0E13',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: PADDING,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handlePill: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleEmoji: {
    fontSize: 20,
  },
  titleText: {
    fontFamily: fonts.headingBlack,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  closeCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    paddingTop: 4,
  },
  card: {
    height: 104,
    backgroundColor: '#16151B',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 2.5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  cardLabel: {
    fontFamily: fonts.headingSemi,
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 14,
  },
});
