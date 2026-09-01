import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { fonts } from '@/theme';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  seed?: string | number | null;
  size?: number;
  styleName?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

const BG_PALETTES = ['1e1b4b', '0f172a', '1e293b', '281654', '142c2e', '1f132b', '111827'];

/**
 * Returns a high-res DiceBear avatar URL for consistent, stylized character avatars.
 * Explicitly filters out stock human photo URLs (e.g. Unsplash) to ensure only illustrated avatars are shown.
 */
export function getAvatarUrl(
  src?: string | null,
  seed?: string | number | null,
  name?: string | null,
  styleName = 'lorelei',
  backgroundColor?: string
): string {
  // If it's a valid custom DiceBear or uploaded avatar URL (not an Unsplash stock photo)
  if (
    src &&
    typeof src === 'string' &&
    src.trim().length > 0 &&
    !src.includes('images.unsplash.com') &&
    !src.includes('unsplash.com') &&
    !src.includes('randomuser.me')
  ) {
    return src;
  }

  const rawSeed = String(seed ?? name ?? 'cinephile').trim();
  const effectiveSeed = encodeURIComponent(rawSeed.length > 0 ? rawSeed : 'cinephile');
  
  // Pick deterministic palette from seed
  const charCodeSum = rawSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pickedBg = backgroundColor || BG_PALETTES[charCodeSum % BG_PALETTES.length];

  return `https://api.dicebear.com/9.x/${styleName}/png?seed=${effectiveSeed}&backgroundColor=${pickedBg}`;
}

export function Avatar({
  src,
  name = 'User',
  seed,
  size = 44,
  styleName = 'lorelei',
  backgroundColor,
  borderRadius,
}: AvatarProps) {
  const radius = borderRadius !== undefined ? borderRadius : size / 2;
  const avatarUrl = getAvatarUrl(src, seed, name, styleName, backgroundColor);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121118',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
});
