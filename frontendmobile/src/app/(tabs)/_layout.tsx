import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Compass, MoreHorizontal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { ExploreSheet } from '@/components/layout/ExploreSheet';
import { BrowseSheet } from '@/components/layout/BrowseSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Liquid Glass Tab Bar ────────────────────────────────────────────────────

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (e: { type: string; target?: string; canPreventDefault?: boolean }) => {
      defaultPrevented?: boolean;
    };
  };
}

function LiquidGlassTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [exploreVisible, setExploreVisible] = useState(false);
  const [browseVisible, setBrowseVisible] = useState(false);

  // Active route name: 'index', 'search', 'browse', etc.
  const currentRouteName = state.routes[state.index]?.name ?? 'index';

  const tabs = [
    {
      id: 'home',
      name: 'index',
      label: 'Home',
      icon: (active: boolean) => (
        <Home size={19} color={active ? '#FFFFFF' : '#9CA3AF'} strokeWidth={active ? 2.4 : 1.9} />
      ),
      onPress: () => {
        setExploreVisible(false);
        setBrowseVisible(false);
        const route = state.routes.find((r) => r.name === 'index');
        if (route) {
          navigation.navigate('index');
        } else {
          router.push('/(tabs)' as never);
        }
      },
      isActive: currentRouteName === 'index' && !exploreVisible && !browseVisible,
    },
    {
      id: 'search',
      name: 'search',
      label: 'Search',
      icon: (active: boolean) => (
        <Search size={19} color={active ? '#FFFFFF' : '#9CA3AF'} strokeWidth={active ? 2.4 : 1.9} />
      ),
      onPress: () => {
        setExploreVisible(false);
        setBrowseVisible(false);
        const route = state.routes.find((r) => r.name === 'search');
        if (route) {
          navigation.navigate('search');
        } else {
          router.push('/(tabs)/search' as never);
        }
      },
      isActive: currentRouteName === 'search' && !exploreVisible && !browseVisible,
    },
    {
      id: 'browse',
      name: 'browse',
      label: 'Browse',
      icon: (active: boolean) => (
        <Compass size={19} color={active ? '#FFFFFF' : '#9CA3AF'} strokeWidth={active ? 2.4 : 1.9} />
      ),
      onPress: () => {
        setExploreVisible(false);
        setBrowseVisible(true);
      },
      isActive: (currentRouteName === 'browse' || browseVisible) && !exploreVisible,
    },
    {
      id: 'menu',
      name: 'menu',
      label: 'Explore',
      icon: (active: boolean) => (
        <MoreHorizontal
          size={19}
          color={active ? '#FFFFFF' : '#9CA3AF'}
          strokeWidth={active ? 2.4 : 1.9}
        />
      ),
      onPress: () => {
        setBrowseVisible(false);
        setExploreVisible(true);
      },
      isActive: exploreVisible,
    },
  ];

  const barBottom = Math.max(insets.bottom, 12);

  return (
    <>
      <BrowseSheet
        visible={browseVisible}
        onClose={() => setBrowseVisible(false)}
      />

      <ExploreSheet
        visible={exploreVisible}
        onClose={() => setExploreVisible(false)}
      />

      {/* Floating Dock Container */}
      <View style={[styles.barContainer, { bottom: barBottom }]} pointerEvents="box-none">
        <View style={styles.dockPill}>
          {/* Dark Glass Background with Gradient */}
          <LinearGradient
            colors={['rgba(28,26,34,0.92)', 'rgba(16,14,20,0.96)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.glassBorder]} />

          {/* 4 Equal Tab Buttons */}
          {tabs.map((tab) => {
            return (
              <IOSPressable
                key={tab.id}
                style={styles.tabItem}
                onPress={tab.onPress}
                activeScale={0.92}
                activeOpacity={0.85}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: tab.isActive }}
              >
                {/* Active Crimson Glowing Capsule */}
                {tab.isActive && (
                  <LinearGradient
                    colors={['#D31027', '#8B0000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, styles.activeCapsule]}
                  />
                )}

                <View style={styles.iconWrap}>{tab.icon(tab.isActive)}</View>
                <Text style={[styles.tabLabel, tab.isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
              </IOSPressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
      tabBar={(props) => <LiquidGlassTabBar {...(props as TabBarProps)} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="browse" options={{ title: 'Browse' }} />
      <Tabs.Screen name="feed" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const DOCK_WIDTH = Math.min(SCREEN_WIDTH - 24, 370);

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  dockPill: {
    width: DOCK_WIDTH,
    height: 62,
    borderRadius: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingVertical: 4,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 20,
  },
  glassBorder: {
    borderRadius: 31,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  tabItem: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activeCapsule: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,100,120,0.5)',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: 0.1,
  },
  activeTabLabel: {
    color: '#FFFFFF',
    fontFamily: fonts.heading,
  },
});

