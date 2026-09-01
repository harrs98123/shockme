import React, { useCallback } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { HIT_SLOP, MIN_TOUCH_TARGET, springPresets } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface IOSPressableProps {
  children: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Scale factor when pressed. Defaults to 0.97 for subtle Apple feel. */
  activeScale?: number;
  /** Opacity when pressed. Defaults to 0.88. */
  activeOpacity?: number;
  /** Spring config preset or custom spring config */
  springConfig?: typeof springPresets.snappy;
  hitSlop?: typeof HIT_SLOP | number;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'header' | 'none';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  testID?: string;
}

/**
 * High-fidelity iOS spring press component.
 * Replaces instant linear transitions with fluid, interruptible UI-thread spring physics.
 */
export function IOSPressable({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  activeScale = 0.97,
  activeOpacity = 0.88,
  springConfig = springPresets.snappy,
  hitSlop = HIT_SLOP,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  testID,
}: IOSPressableProps) {
  const isPressed = useSharedValue(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    'worklet';
    if (disabled) return;
    isPressed.value = true;
    scale.value = withSpring(activeScale, springConfig);
    opacity.value = withSpring(activeOpacity, springConfig);
  }, [disabled, activeScale, activeOpacity, springConfig, isPressed, scale, opacity]);

  const handlePressOut = useCallback(() => {
    'worklet';
    isPressed.value = false;
    scale.value = withSpring(1, springConfig);
    opacity.value = withSpring(1, springConfig);
  }, [springConfig, isPressed, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.45 : opacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled,
        ...accessibilityState,
      }}
      testID={testID}
      style={[
        { minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET, justifyContent: 'center' },
        style,
        animatedStyle,
      ]}
    >
      {typeof children === 'function' ? children({ pressed: isPressed.value }) : children}
    </AnimatedPressable>
  );
}
