import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';

import { backdropUrl } from '@/lib/images';
import { radius, spacing } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = Math.round(SCREEN_WIDTH * 0.72);
const SLIDE_HEIGHT = Math.round(SLIDE_WIDTH * 0.56);

interface Props {
  images?: {
    backdrops?: { file_path: string }[];
  };
  backdropPath?: string | null;
}

export function ScreenshotsGallery({ images, backdropPath }: Props) {
  const [scrollProgress, setScrollProgress] = useState(0);

  const stills = (images?.backdrops && images.backdrops.length > 0
    ? images.backdrops.map((b) => backdropUrl(b.file_path, 'w780'))
    : [backdropUrl(backdropPath, 'w780')]
  ).filter(Boolean) as string[];

  if (stills.length === 0) return null;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxOffset = contentSize.width - layoutMeasurement.width;
    if (maxOffset > 0) {
      setScrollProgress(Math.min(Math.max(contentOffset.x / maxOffset, 0), 1));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Screenshots</Text>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SLIDE_WIDTH + 12}
      >
        {stills.map((uri, idx) => (
          <View key={idx} style={styles.slideCard}>
            <Image source={{ uri }} style={styles.slideImage} contentFit="cover" />
          </View>
        ))}
      </ScrollView>

      {/* Progress Line Indicator */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressThumb,
            {
              left: `${scrollProgress * 70}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  heading: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    marginBottom: 14,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  slideCard: {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#1E1E26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginHorizontal: spacing.lg,
    marginTop: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  progressThumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '30%',
    backgroundColor: '#6B7280',
    borderRadius: 2,
  },
});
