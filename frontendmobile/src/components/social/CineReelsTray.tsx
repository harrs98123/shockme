import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Star,
  Clapperboard,
} from 'lucide-react-native';

import type { User } from '@/types';
import type { UserStoryGroup } from '@/api/stories';
import { colors, fonts, radius, spacing } from '@/theme';
import { posterUrl, backdropUrl } from '@/lib/images';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';

const CARD_WIDTH = 105;
const CARD_HEIGHT = 155;

interface CineReelsTrayProps {
  currentUser: User | null;
  userGroups: UserStoryGroup[];
  onOpenCreateStory: () => void;
  onSelectUserGroup: (index: number) => void;
}

export function CineReelsTray({
  currentUser,
  userGroups,
  onOpenCreateStory,
  onSelectUserGroup,
}: CineReelsTrayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.trayHeader}>
        <View style={styles.trayTitleRow}>
          <Clapperboard size={15} color={colors.primary} />
          <Text style={styles.trayTitle}>Film Pulse & Stories</Text>
        </View>
        <Text style={styles.traySub}>24h Cinema Moments</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* User's Add Story / Hot Take Capsule */}
        <IOSPressable
          style={styles.addStoryCard}
          onPress={onOpenCreateStory}
          activeScale={0.94}
          accessibilityRole="button"
          accessibilityLabel="Post your daily film story"
        >
          <LinearGradient
            colors={['#1F1F28', '#14141A']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.addAvatarWrap}>
            <Avatar
              src={currentUser?.avatar_url}
              seed={currentUser?.username || currentUser?.name}
              name={currentUser?.name || 'You'}
              size={42}
              borderRadius={21}
            />
            <View style={styles.plusIconBadge}>
              <Plus size={11} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>

          <View style={styles.addTextWrap}>
            <Text style={styles.addTitle}>Your Story</Text>
            <Text style={styles.addSub}>Post Take</Text>
          </View>
        </IOSPressable>

        {/* Real Live CineStories from Backend */}
        {userGroups.map((group, index) => {
          const latestStory = group.stories[0];
          const poster =
            posterUrl(latestStory?.movie_poster, 'w342') ||
            backdropUrl(latestStory?.movie_backdrop, 'w780');
          const title = latestStory?.movie_title || group.name;

          return (
            <IOSPressable
              key={group.user_id || index}
              style={styles.storyCard}
              onPress={() => onSelectUserGroup(index)}
              activeScale={0.94}
              accessibilityRole="button"
              accessibilityLabel={`View story by ${group.name}`}
            >
              {/* Real TMDB Poster / Backdrop Image */}
              {poster ? (
                <Image
                  source={{ uri: poster }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <LinearGradient
                  colors={['#2D1515', '#16161D']}
                  style={StyleSheet.absoluteFillObject}
                />
              )}

              {/* Gradient Dark Overlay */}
              <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.85)']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Top: Cinephile Avatar with Neon Story Ring */}
              <View style={styles.storyTopRow}>
                <LinearGradient
                  colors={['#E50914', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientRing}
                >
                  <Avatar
                    src={group.avatar_url}
                    seed={group.username || group.name}
                    name={group.name}
                    size={28}
                    borderRadius={14}
                  />
                </LinearGradient>

                {latestStory?.rating ? (
                  <View style={styles.ratingPill}>
                    <Star size={9} color="#FFC107" fill="#FFC107" />
                    <Text style={styles.ratingPillText}>{latestStory.rating}</Text>
                  </View>
                ) : null}
              </View>

              {/* Bottom: Movie Title & Story Type */}
              <View style={styles.storyBottomWrap}>
                <Text style={styles.badgeLabel} numberOfLines={1}>
                  {(latestStory?.story_type || 'FILM PULSE').toUpperCase()} • {group.stories.length}
                </Text>
                <Text style={styles.storyMovieTitle} numberOfLines={2}>
                  {title}
                </Text>
              </View>
            </IOSPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  trayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: 10,
  },
  trayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trayTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
  traySub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondaryLabel,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  addStoryCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(229,9,20,0.4)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  addAvatarWrap: {
    position: 'relative',
    marginTop: 6,
  },
  plusIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#14141A',
  },
  addTextWrap: {
    alignItems: 'center',
  },
  addTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  addSub: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.primary,
    marginTop: 1,
  },
  storyCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#121217',
  },
  storyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarGradientRing: {
    padding: 1.5,
    borderRadius: 16,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.3)',
  },
  ratingPillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: '#FFC107',
  },
  storyBottomWrap: {
    gap: 1,
  },
  badgeLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 8,
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  storyMovieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 15,
  },
});
