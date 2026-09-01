import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radius, spacing, typography } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  /** `primary` and `ghost` mirror `.btn-primary` / `.btn-ghost` in globals.css. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Shows a spinner and blocks presses. Implies `disabled`. */
  loading?: boolean;
  /** Rendered before the label — pass a lucide icon element. */
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const SIZES: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number; height: number }> = {
  sm: { paddingVertical: 7, paddingHorizontal: 14, fontSize: 13, height: 36 },
  md: { paddingVertical: 11, paddingHorizontal: 20, fontSize: 15, height: 46 },
  lg: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16, height: 52 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const dims = SIZES[size];

  return (
    <IOSPressable
      onPress={onPress}
      disabled={isDisabled}
      activeScale={0.97}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        variantStyles[variant],
        {
          minHeight: dims.height,
          paddingVertical: dims.paddingVertical,
          paddingHorizontal: dims.paddingHorizontal,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColors[variant]} />
      ) : (
        <>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text
            style={[typography.button, { fontSize: dims.fontSize, color: labelColors[variant] }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </IOSPressable>
  );
}

const labelColors: Record<ButtonVariant, string> = {
  primary: colors.white,
  ghost: colors.text,
  subtle: colors.text,
  danger: colors.white,
  glass: colors.white,
};

const variantStyles: Record<ButtonVariant, ViewStyle> = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  ghost: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  subtle: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  danger: {
    backgroundColor: colors.destructive,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
  icon: {
    justifyContent: 'center',
  },
});

