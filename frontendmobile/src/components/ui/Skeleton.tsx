import { useEffect } from 'react';
import { StyleSheet, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Loading placeholder replacing `.skeleton` from globals.css.
 *
 * The web version animates a 200%-wide gradient's `background-position`.
 * React Native cannot animate a gradient offset cheaply, so this pulses opacity
 * instead — the same 1.5s cadence, driven on the UI thread by Reanimated so it
 * keeps running while the JS thread parses the response it is waiting for.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const progress = useSharedValue(0.4);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[styles.base, { width, height, borderRadius }, animatedStyle, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface2,
  },
});
