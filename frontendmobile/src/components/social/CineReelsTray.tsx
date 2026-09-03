import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';

import type { User } from '@/types';
import type { UserStoryGroup } from '@/api/stories';
import { colors, fonts, radius } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';

interface CineReelsTrayProps {
  currentUser: User | null;
  userGroups: UserStoryGroup[];
  onOpenCreateStory: () => void;
  onSelectUserGroup: (index: number) => void;
}

const INSTA_STORY_GRADIENT = ['#CA1D7E', '#E052A0', '#F15C45', '#FBAA47'];

export function CineReelsTray({
  currentUser,
  userGroups,
  onOpenCreateStory,
  onSelectUserGroup,
}: CineReelsTrayProps) {
  // Check if current user has an active story in userGroups
  const myGroupIndex = currentUser
    ? userGroups.findIndex((g) => g.user_id === currentUser.id)
    : -1;
  const myGroup = myGroupIndex >= 0 ? userGroups[myGroupIndex] : null;
  const hasMyStory = !!(myGroup && myGroup.stories.length > 0);

  // Filter out currentUser from subsequent circles if already shown as "Your story"
  const otherGroups = userGroups.filter((g) => !currentUser || g.user_id !== currentUser.id);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. "Your Story" Circle (Instagram Style) ── */}
        <IOSPressable
          style={styles.storyItem}
          onPress={() => {
            if (hasMyStory && myGroupIndex >= 0) {
              onSelectUserGroup(myGroupIndex);
            } else {
              onOpenCreateStory();
            }
          }}
          activeScale={0.92}
          accessibilityRole="button"
          accessibilityLabel="Your Story"
        >
          <View style={styles.avatarRingWrapper}>
            {hasMyStory ? (
              <LinearGradient
                colors={INSTA_STORY_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientRing}
              >
                <View style={styles.innerRing}>
                  <Avatar
                    src={currentUser?.avatar_url}
                    seed={currentUser?.username || currentUser?.name}
                    name={currentUser?.name || 'You'}
                    size={60}
                    borderRadius={30}
                  />
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.unseenRing}>
                <Avatar
                  src={currentUser?.avatar_url}
                  seed={currentUser?.username || currentUser?.name}
                  name={currentUser?.name || 'You'}
                  size={60}
                  borderRadius={30}
                />
              </View>
            )}

            {/* Blue Plus Badge to create a story */}
            <IOSPressable
              style={styles.plusBadge}
              onPress={onOpenCreateStory}
              hitSlop={6}
              activeScale={0.88}
            >
              <Plus size={11} color="#FFFFFF" strokeWidth={3} />
            </IOSPressable>
          </View>

          <Text style={styles.storyLabel} numberOfLines={1}>
            Your story
          </Text>
        </IOSPressable>

        {/* ── 2. Other Cinephiles' Story Circles with Gradient Ring ── */}
        {otherGroups.map((group) => {
          // Find original index in userGroups so viewer opens correct user
          const originalIndex = userGroups.findIndex((g) => g.user_id === group.user_id);
          const displayName = group.username
            ? `@${group.username}`
            : group.name.split(' ')[0] || 'Cinephile';

          return (
            <IOSPressable
              key={group.user_id}
              style={styles.storyItem}
              onPress={() => onSelectUserGroup(originalIndex >= 0 ? originalIndex : 0)}
              activeScale={0.92}
              accessibilityRole="button"
              accessibilityLabel={`View story by ${group.name}`}
            >
              <View style={styles.avatarRingWrapper}>
                <LinearGradient
                  colors={INSTA_STORY_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientRing}
                >
                  <View style={styles.innerRing}>
                    <Avatar
                      src={group.avatar_url}
                      seed={group.username || group.name}
                      name={group.name}
                      size={60}
                      borderRadius={30}
                    />
                  </View>
                </LinearGradient>
              </View>

              <Text style={styles.storyLabel} numberOfLines={1}>
                {displayName}
              </Text>
            </IOSPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 14,
    alignItems: 'center',
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  avatarRingWrapper: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gradientRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unseenRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 63,
    height: 63,
    borderRadius: 31.5,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0095F6',
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#E0E0E0',
    marginTop: 5,
    textAlign: 'center',
    maxWidth: 70,
  },
});
