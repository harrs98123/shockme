import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Ambient purple cosmic glow — matches the web app's design tokens:
 * `radial-gradient(circle at -10% -10%, #3b2355, #150E1B 45%, #0F0F0F 80%)`.
 *
 * Uses multi-stop LinearGradient for smooth, seamless color transitions without any lines.
 */
export function AmbientGlow() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Primary diagonal purple/violet wash */}
      <LinearGradient
        colors={[
          '#42125E',
          '#280C3D',
          '#180926',
          '#0F0F0F',
          '#0A0A0C',
        ]}
        locations={[0, 0.2, 0.45, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top right subtle cyan accent flare */}
      <LinearGradient
        colors={['rgba(6, 182, 212, 0.12)', 'transparent']}
        locations={[0, 0.4]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.4, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
