import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image, type ImageStyle } from 'expo-image';
import { posterUrl, type PosterSize } from '@/lib/images';
import { PosterFallback } from './PosterFallback';
import { radius } from '@/theme';

interface Props {
  path: string | null | undefined;
  title: string;
  movieId: number;
  width: number;
  height: number;
  size?: PosterSize;
  style?: ImageStyle;
  borderRadius?: number;
}

/**
 * Drop-in poster image backed by expo-image's disk cache.
 * Falls back to <PosterFallback> on error or missing path.
 * Memoized for high performance in large VirtualizedLists.
 */
function PosterImageComponent({
  path,
  title,
  movieId,
  width,
  height,
  size = 'w342',
  style,
  borderRadius = radius.md,
}: Props) {
  const uri = posterUrl(path, size);

  if (!uri) {
    return (
      <View style={{ width, height, borderRadius, overflow: 'hidden' }}>
        <PosterFallback title={title} seed={movieId} width={width} height={height} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, { width, height, borderRadius }, style]}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      // Lets expo-image reuse the native view for the next poster as this row
      // scrolls, instead of tearing it down and rebuilding — smoother fast
      // flings through long rails.
      recyclingKey={uri}
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
    />
  );
}

export const PosterImage = memo(PosterImageComponent);

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#09090B',
  },
});
