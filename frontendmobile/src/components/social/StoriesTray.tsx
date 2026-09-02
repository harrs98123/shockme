import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts, radius } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import type { User } from '@/types';

interface FollowUser {
  id: number;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  is_following?: boolean;
}

interface StoriesTrayProps {
  currentUser: User | null;
  suggestions: FollowUser[];
  onOpenComposer: () => void;
  onToggleFollow: (user: FollowUser) => void;
}

export function StoriesTray({
  currentUser,
  suggestions,
  onOpenComposer,
  onToggleFollow,
}: StoriesTrayProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current User Story / Add Story */}
        <IOSPressable
          style={styles.storyItem}
          onPress={onOpenComposer}
          activeScale={0.93}
          accessibilityRole="button"
          accessibilityLabel="Add Story or Post"
        >
          <View style={styles.myAvatarWrap}>
            <Avatar
              src={currentUser?.avatar_url}
              seed={currentUser?.username || currentUser?.name}
              name={currentUser?.name || 'You'}
              size={62}
              borderRadius={31}
            />
            <View style={styles.addPlusBadge}>
              <Plus size={12} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
          <Text style={styles.storyName} numberOfLines={1}>
            Your Story
          </Text>
        </IOSPressable>

        {/* Suggested Cinephiles Story Rings */}
        {suggestions.map((item) => {
          const name = item.name.split(' ')[0] || item.username || 'User';
          return (
            <IOSPressable
              key={item.id}
              style={styles.storyItem}
              onPress={() => router.push(`/user/${item.id}` as never)}
              activeScale={0.93}
              accessibilityRole="button"
              accessibilityLabel={`View ${item.name}'s profile`}
            >
              {/* Instagram Story Gradient Rim */}
              <LinearGradient
                colors={['#E50914', '#F59E0B', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storyGradientRing}
              >
                <View style={styles.storyAvatarInner}>
                  <Avatar
                    src={item.avatar_url}
                    seed={item.username || item.name}
                    name={item.name}
                    size={58}
                    borderRadius={29}
                  />
                </View>
              </LinearGradient>

              <Text style={styles.storyName} numberOfLines={1}>
                {name}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  myAvatarWrap: {
    position: 'relative',
    padding: 2,
    borderRadius: 35,
  },
  addPlusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F0F12',
  },
  storyGradientRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    backgroundColor: '#0F0F12',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 6,
    textAlign: 'center',
  },
});
