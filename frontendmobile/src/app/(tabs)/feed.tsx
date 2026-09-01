import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Compass,
  Users,
  Sparkles,
} from 'lucide-react-native';

import { socialApi, type SocialPost } from '@/api/social';
import { storiesApi, type UserStoryGroup } from '@/api/stories';
import { api, request } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, radius, spacing } from '@/theme';
import { PlotmintLogo } from '@/components/ui/PlotmintLogo';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { IOSSegmentedControl } from '@/components/ios/IOSSegmentedControl';
import { Avatar } from '@/components/avatar/Avatar';
import { CineReelsTray } from '@/components/social/CineReelsTray';
import { CineStoryViewerModal } from '@/components/social/CineStoryViewerModal';
import { CreateStoryModal } from '@/components/social/CreateStoryModal';
import { FeedPostCard } from '@/components/social/FeedPostCard';
import { PostComposerModal } from '@/components/social/PostComposerModal';
import showToast from '@/lib/toast';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'following' | 'discover'>('discover');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [selectedUserGroupIndex, setSelectedUserGroupIndex] = useState<number | null>(null);

  // 1. Live Feed Posts Query
  const {
    data: posts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['social', 'feed', activeTab],
    queryFn: () => socialApi.getFeed(activeTab, 30, 0),
    staleTime: 45 * 1000,
  });

  // 2. Real Backend 24h Active CineStories Query
  const { data: userStoryGroups = [], refetch: refetchStories } = useQuery<UserStoryGroup[]>({
    queryKey: ['stories', 'feed'],
    queryFn: () => storiesApi.getFeed(),
    staleTime: 30 * 1000,
  });

  const handleReact = useCallback(
    async (postId: number, reactionType: string) => {
      if (!isAuthenticated) {
        showToast.info('Sign in to react to posts');
        return;
      }

      // Optimistic cache update without full list refetch
      qc.setQueryData<SocialPost[]>(['social', 'feed', activeTab], (oldPosts) => {
        if (!oldPosts) return oldPosts;
        return oldPosts.map((p) => {
          if (p.id !== postId) return p;
          const isTogglingOff = p.user_reaction === reactionType;
          let newLikes = p.likes_count || 0;

          if (isTogglingOff) {
            if (p.user_reaction === 'loved') {
              newLikes = Math.max(0, newLikes - 1);
            }
          } else {
            // Toggling on or switching
            if (reactionType === 'loved') {
               newLikes += 1;
            } else if (p.user_reaction === 'loved') {
               // Switching from 'loved' to another emoji
               newLikes = Math.max(0, newLikes - 1);
            }
          }

          return {
            ...p,
            user_reaction: isTogglingOff ? undefined : reactionType,
            likes_count: newLikes,
          };
        });
      });

      // Fire network in background without invalidating / refetching whole list
      try {
        await socialApi.react(postId, reactionType);
      } catch {
        // silent fail
      }
    },
    [isAuthenticated, activeTab, qc]
  );

  const handleToggleFollow = useCallback(
    async (author: { id: number; is_following?: boolean }) => {
      if (!isAuthenticated) {
        showToast.info('Sign in to follow creators');
        return;
      }
      try {
        await api.post(`/user/${author.id}/follow`);
        qc.invalidateQueries({ queryKey: ['social', 'feed'] });
        qc.invalidateQueries({ queryKey: ['stories', 'feed'] });
        showToast.success(author.is_following ? 'Unfollowed' : 'Following! ✨');
      } catch {
        showToast.error('Action failed');
      }
    },
    [isAuthenticated, qc]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SocialPost>) => (
      <FeedPostCard
        post={item}
        currentUserId={user?.id}
        onReact={handleReact}
        onToggleFollow={handleToggleFollow}
      />
    ),
    [user?.id, handleReact, handleToggleFollow]
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <PlotmintLogo size={22} />
          <Text style={styles.brandTitle}>
            Plot<Text style={{ color: colors.primary }}>mint</Text>
          </Text>
        </View>

        <View style={styles.topRightActions}>
          <IOSPressable
            style={styles.plusComposeBtn}
            onPress={() => {
              if (!isAuthenticated) {
                showToast.info('Sign in to create a post');
                return;
              }
              setIsComposerOpen(true);
            }}
            activeScale={0.9}
            accessibilityRole="button"
            accessibilityLabel="Create Post"
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
          </IOSPressable>

          <IOSPressable
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile' as never)}
            activeScale={0.92}
            accessibilityRole="button"
            accessibilityLabel="Your Profile"
          >
            <Avatar
              src={user?.avatar_url}
              seed={user?.username || user?.name}
              name={user?.name || 'You'}
              size={32}
              borderRadius={16}
            />
          </IOSPressable>
        </View>
      </View>

      {/* ── Main Feed List (Optimized & Memoized) ── */}
      <FlatList<SocialPost>
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={5}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={true}
        onRefresh={() => {
          refetch();
          refetchStories();
        }}
        refreshing={isRefetching}
        bounces={true}
        ListHeaderComponent={
          <View>
            {/* Real 24h Cinephile Story Carousel (Backend GET /stories/feed) */}
            <CineReelsTray
              currentUser={user}
              userGroups={userStoryGroups}
              onOpenCreateStory={() => {
                if (!isAuthenticated) {
                  showToast.info('Sign in to share a story');
                  return;
                }
                setIsCreateStoryOpen(true);
              }}
              onSelectUserGroup={(index) => setSelectedUserGroupIndex(index)}
            />

            {/* Segmented Feed Switcher */}
            <View style={styles.feedSwitcherSection}>
              <IOSSegmentedControl<'following' | 'discover'>
                segments={[
                  {
                    id: 'discover',
                    label: 'For You',
                    icon: <Compass size={14} color="#FFF" />,
                  },
                  {
                    id: 'following',
                    label: 'Following',
                    icon: <Users size={14} color="#FFF" />,
                  },
                ]}
                selectedId={activeTab}
                onSelect={setActiveTab}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Sparkles size={36} color={colors.secondaryLabel} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'following'
                  ? 'No posts from people you follow'
                  : 'No posts yet'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'following'
                  ? 'Follow more cinephiles or switch to "For You" to discover hot takes.'
                  : 'Be the first cinephile to share a movie hot take!'}
              </Text>
              <IOSPressable
                style={styles.createFirstPostBtn}
                onPress={() => setIsComposerOpen(true)}
                activeScale={0.94}
              >
                <Text style={styles.createFirstPostBtnText}>Share a Hot Take</Text>
              </IOSPressable>
            </View>
          ) : (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 40 }}
            />
          )
        }
      />

      {/* ── Immersive Full-Screen CineStory Modal (Real Backend Data) ── */}
      <CineStoryViewerModal
        visible={selectedUserGroupIndex !== null}
        userGroups={userStoryGroups}
        initialUserIndex={selectedUserGroupIndex ?? 0}
        onClose={() => setSelectedUserGroupIndex(null)}
      />

      {/* ── Post Story Modal ── */}
      <CreateStoryModal
        visible={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={() => refetchStories()}
      />

      {/* ── Post Composer Modal ── */}
      <PostComposerModal
        visible={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onPostCreated={() => qc.invalidateQueries({ queryKey: ['social', 'feed'] })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  plusComposeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    padding: 1,
  },
  listContent: {
    paddingBottom: 110,
  },
  feedSwitcherSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  emptyContainer: {
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
    maxWidth: 280,
  },
  createFirstPostBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.md,
    marginTop: 10,
  },
  createFirstPostBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
