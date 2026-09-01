import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  type ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Library, Film, ChevronRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { api, request } from '@/api/client';
import type { Collection } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { backdropUrl } from '@/lib/images';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';

const CARD_HEIGHT = 160;

export const collectionsApi = {
  all: () => request<Collection[]>(() => api.get('/collections')),
  detail: (id: number | string) => request<Collection>(() => api.get(`/collections/${id}`)),
};

function CollectionCard({ collection }: { collection: Collection; index: number }) {
  const bg = backdropUrl(collection.backdrop_path || null, 'w1280');
  const movieCount = collection.items?.length || collection.movies_count || 12;

  return (
    <IOSPressable
      style={styles.card}
      onPress={() => router.push(`/collections/${collection.id}` as never)}
      activeScale={0.97}
      accessibilityRole="button"
      accessibilityLabel={collection.name || collection.title || 'Collection'}
    >
      {bg ? (
        <Image source={{ uri: bg }} style={styles.backdrop} contentFit="cover" />
      ) : (
        <View style={[styles.backdrop, { backgroundColor: '#201636' }]} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(12,10,18,0.7)', 'rgba(12,10,18,0.96)']}
        locations={[0.2, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.cardContent}>
        <View style={styles.countBadge}>
          <Film size={11} color="#FFC107" />
          <Text style={styles.countText}>{movieCount} Films</Text>
        </View>

        <Text style={styles.collectionTitle} numberOfLines={2}>
          {collection.name || collection.title || 'Curated Collection'}
        </Text>

        {collection.description ? (
          <Text style={styles.collectionDesc} numberOfLines={2}>
            {collection.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.cardArrow}>
        <ChevronRight size={18} color="#FFFFFF" />
      </View>
    </IOSPressable>
  );
}

export default function CollectionsListScreen() {
  const { data: collections, refetch, isRefetching } = useQuery({
    queryKey: ['collections', 'all'],
    queryFn: () => collectionsApi.all(),
    staleTime: 10 * 60 * 1000,
  });

  const list = collections ?? [];

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Collection>) => (
      <CollectionCard collection={item} index={index} />
    ),
    []
  );

  return (
    <View style={styles.root}>
      {/* iOS Header */}
      <IOSHeader
        title="Curated Collections"
        subtitle="Hand-picked movie marathons"
        rightAction={<Library size={20} color="#8B5CF6" />}
      />

      {/* Collections List */}
      <FlatList<Collection>
        data={list}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContainer}
        onRefresh={refetch}
        refreshing={isRefetching}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: 14,
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    zIndex: 2,
    paddingRight: 32,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  countText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFFFFF',
  },
  collectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 22,
  },
  collectionDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
  },
  cardArrow: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

