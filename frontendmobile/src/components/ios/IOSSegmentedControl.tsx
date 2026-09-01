import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  type StyleProp,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, fonts, radius, springPresets } from '@/theme';

export interface SegmentOption<T extends string = string> {
  id?: T;
  value?: T;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

export interface IOSSegmentedControlProps<T extends string = string> {
  segments?: SegmentOption<T>[];
  options?: SegmentOption<T>[];
  selectedId?: T;
  value?: T;
  onSelect?: (id: T) => void;
  onChange?: (id: T) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * iOS-style Segmented Pill Control with smooth Reanimated sliding indicator.
 */
export function IOSSegmentedControl<T extends string = string>({
  segments: propSegments,
  options,
  selectedId: propSelectedId,
  value,
  onSelect,
  onChange,
  style,
}: IOSSegmentedControlProps<T>) {
  const rawSegments = propSegments || options || [];
  const normalizedSegments = rawSegments.map((s) => ({
    id: (s.id ?? s.value ?? '') as T,
    label: s.label,
    icon: s.icon,
    badge: s.badge,
  }));

  const activeId = (propSelectedId ?? value ?? normalizedSegments[0]?.id) as T;
  const handleSelect = onSelect || onChange || (() => {});

  const [containerWidth, setContainerWidth] = React.useState(0);
  const selectedIndex = Math.max(
    0,
    normalizedSegments.findIndex((s) => s.id === activeId)
  );

  const segmentCount = Math.max(1, normalizedSegments.length);
  const segmentWidth = containerWidth > 0 ? (containerWidth - 8) / segmentCount : 0;
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    if (segmentWidth > 0) {
      translateX.value = withSpring(selectedIndex * segmentWidth, springPresets.snappy);
    }
  }, [selectedIndex, segmentWidth, translateX]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth,
  }));

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {/* Sliding Active Indicator */}
      {segmentWidth > 0 && (
        <Animated.View style={[styles.activeIndicator, indicatorStyle]} />
      )}

      {/* Segments */}
      {normalizedSegments.map((segment) => {
        const isSelected = segment.id === activeId;
        return (
          <Pressable
            key={segment.id}
            style={styles.segmentBtn}
            onPress={() => handleSelect(segment.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={segment.label}
          >
            {segment.icon ? (
              <View style={styles.iconWrap}>{segment.icon}</View>
            ) : null}
            <Text
              style={[
                styles.segmentLabel,
                isSelected && styles.segmentLabelActive,
              ]}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
            {segment.badge !== undefined && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{segment.badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.pill,
    padding: 4,
    position: 'relative',
    height: 40,
  },
  activeIndicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    borderRadius: radius.pill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
    paddingHorizontal: 8,
    gap: 6,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: '#FFFFFF',
    fontFamily: fonts.headingSemi,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFFFFF',
  },
});
