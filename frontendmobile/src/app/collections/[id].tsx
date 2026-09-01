import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Film } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { collectionsApi } from './index';
import type { CollectionItem } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { backdropUrl } from '@/lib/images';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSPressable } from '@/components/ios/IOSPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);
const HEADER_HEIGHT = Math.round(SCREEN_WIDTH * 0.58);

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: collection, isLoading } = useQuery({
    queryKey: ['collections', 'detail', id],
    queryFn: () => collectionsApi.detail(id),
    enabled: !!id,
  });

  const banner = backdropUrl(collection?.backdrop_path || null, 'w1280');
  const movies = collection?.items ?? [];

  if (isLoading || !collection) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header Back Button */}
      <IOSPressable
        style={[styles.floatingBack, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        hitSlop={12}
        activeScale={0.9}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.4} />
      </IOSPressable>

      <FlatList<CollectionItem>
        data={movies}
        renderItem={({ item }) => {
          const title = item.title;
          const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
          const year = item.release_year;

          return (
            <IOSPressable
              style={styles.movieCard}
              onPress={() => router.push(`/movie/${item.movie_id}` as never)}
              activeScale={0.96}
              accessibilityRole="button"
              accessibilityLabel={title}
            >
              <PosterImage
                path={item.poster_path}
                title={title}
                movieId={item.movie_id}
                width={CARD_WIDTH}
                height={POSTER_HEIGHT}
                borderRadius={radius.md}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.movieTitle} numberOfLines={1}>
                  {title}
                </Text>
                <View style={styles.cardMeta}>
                  {rating ? <Text style={styles.ratingText}>★ {rating}</Text> : null}
                  {year ? <Text style={styles.yearText}>• {year}</Text> : null}
                </View>
              </View>
            </IOSPressable>
          );
        }}
        keyExtractor={(item) => String(item.id || item.movie_id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Backdrop Banner */}
            <View style={styles.bannerWrap}>
              {banner ? (
                <Image source={{ uri: banner }} style={styles.banner} contentFit="cover" />
              ) : (
                <View style={[styles.banner, { backgroundColor: '#201636' }]} />
              )}
              <LinearGradient
                colors={['rgba(15,15,15,0.3)', 'rgba(15,15,15,0.7)', '#0F0F0F']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>

            {/* Collection Metadata */}
            <View style={styles.metaBox}>
              <View style={styles.badge}>
                <Film size={12} color="#8B5CF6" />
                <Text style={styles.badgeText}>{movies.length} FILMS IN COLLECTION</Text>
              </View>
              <Text style={styles.title}>{collection.name || collection.title || 'Collection'}</Text>
              {collection.description ? (
                <Text style={styles.desc}>{collection.description}</Text>
              ) : null}
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBack: {
    position: 'absolute',
    left: 16,
    zIndex: 50,
    width: 38,
    height: 38,
    minHeight: 38,
    minWidth: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15,15,20,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 16,
  },
  bannerWrap: {
    width: SCREEN_WIDTH,
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  banner: {
    ...StyleSheet.absoluteFillObject,
  },
  metaBox: {
    paddingHorizontal: spacing.lg,
    marginTop: -28,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    marginBottom: 6,
  },
  badgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#C084FC',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.headingBlack,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  gridContainer: {
    paddingBottom: 60,
  },
  gridRow: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  movieCard: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInfo: {
    padding: 10,
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFC107',
  },
  yearText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
});

