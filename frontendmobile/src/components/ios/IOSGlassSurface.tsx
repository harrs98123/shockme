import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius, shadows } from '@/theme';

export interface IOSGlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  /** Custom gradient colors for glass tint. Defaults to dark obsidian glass. */
  tintColors?: readonly [string, string, ...string[]];
  borderOpacity?: number;
  /** Whether to apply soft iOS depth shadow. Defaults to true. */
  elevated?: boolean;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

/**
 * Liquid Glass Surface component for floating navigation bars, pills, cards and modals.
 * Recreates the Apple liquid glass aesthetic with dark backdrop tint and specular highlight rim.
 */
export function IOSGlassSurface({
  children,
  style,
  borderRadius = radius.xl,
  tintColors = ['rgba(28, 26, 36, 0.88)', 'rgba(16, 14, 22, 0.94)'] as const,
  borderOpacity = 0.16,
  elevated = true,
  pointerEvents,
}: IOSGlassSurfaceProps) {
  return (
    <View
      pointerEvents={pointerEvents}
      style={[
        styles.root,
        { borderRadius },
        elevated && styles.elevated,
        style,
      ]}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={tintColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      {/* Specular Hairline Rim */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.specularRim,
          {
            borderRadius,
            borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
          },
        ]}
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surface,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
  },
  specularRim: {
    borderWidth: 1.2,
  },
});
