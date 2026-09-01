import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { X, Users, UserCheck } from 'lucide-react-native';

import { api, request } from '@/api/client';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { IOSSegmentedControl } from '@/components/ios/IOSSegmentedControl';
import { Avatar } from '@/components/avatar/Avatar';

interface FollowUser {
  id: number;
  name: string;
  username?: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_following?: boolean;
  followers_count?: number;
}

interface FollowModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  initialTab?: 'followers' | 'following';
}

export function FollowModal({
  visible,
  onClose,
  userId,
  initialTab = 'followers',
}: FollowModalProps) {
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab);

  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: ['user', userId, 'followers'],
    queryFn: () =>
      request<FollowUser[]>(() => api.get(`/user/${userId}/followers`)),
    enabled: visible && !!userId,
  });

  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: ['user', userId, 'following'],
    queryFn: () =>
      request<FollowUser[]>(() => api.get(`/user/${userId}/following`)),
    enabled: visible && !!userId,
  });

  const activeList = tab === 'followers' ? followers : following;
  const isLoading = tab === 'followers' ? followersLoading : followingLoading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Top Handle & Header */}
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Community Network</Text>
            <Text style={styles.headerSub}>Followers & connections</Text>
          </View>
          <IOSPressable
            style={styles.closeBtn}
            onPress={onClose}
            activeScale={0.9}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.textMuted} />
          </IOSPressable>
        </View>

        {/* Tab Switcher */}
        <View style={styles.segmentedWrap}>
          <IOSSegmentedControl<'followers' | 'following'>
            segments={[
              { id: 'followers', label: `Followers (${followers.length})` },
              { id: 'following', label: `Following (${following.length})` },
            ]}
            selectedId={tab}
            onSelect={setTab}
          />
        </View>

        {/* User List */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activeList.length === 0 ? (
          <View style={styles.emptyWrap}>
            {tab === 'followers' ? (
              <Users size={36} color={colors.secondaryLabel} />
            ) : (
              <UserCheck size={36} color={colors.secondaryLabel} />
            )}
            <Text style={styles.emptyTitle}>
              {tab === 'followers' ? 'No followers yet' : 'Not following anyone'}
            </Text>
            <Text style={styles.emptySub}>
              {tab === 'followers'
                ? 'Share your profile and write reviews to connect with cinephiles.'
                : 'Discover profiles and connect with fellow movie enthusiasts.'}
            </Text>
          </View>
        ) : (
          <FlatList<FollowUser>
            data={activeList}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <Avatar
                  src={item.avatar_url}
                  seed={item.username || item.name}
                  name={item.name}
                  size={44}
                  borderRadius={22}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.username}>
                    @{item.username || item.name.toLowerCase().replace(/\s/g, '')}
                  </Text>
                  {item.bio ? (
                    <Text style={styles.bio} numberOfLines={1}>
                      {item.bio}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondaryLabel,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: spacing.lg,
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  username: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.primary,
  },
  bio: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
