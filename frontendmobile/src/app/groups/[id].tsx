import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  type ListRenderItemInfo,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  MessageSquare,
  Send,
  UserCheck,
  UserPlus,
  Shield,
  Clock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { api, request } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import type { Group, GroupPost } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import showToast from '@/lib/toast';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = Number(id);
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [postText, setPostText] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<{ [postId: number]: string }>({});
  const [submittingComment, setSubmittingComment] = useState(false);

  // Group Details
  const { data: group, isLoading: groupLoading, refetch: refetchGroup } = useQuery<Group>({
    queryKey: ['group', groupId],
    queryFn: () => request<Group>(() => api.get(`/groups/${groupId}`)),
    enabled: !!groupId,
  });

  // Group Posts
  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery<GroupPost[]>({
    queryKey: ['group', groupId, 'posts'],
    queryFn: () => request<GroupPost[]>(() => api.get(`/groups/${groupId}/posts`)),
    enabled: !!groupId,
  });

  const handleToggleJoin = async () => {
    if (!isAuthenticated) {
      showToast.info('Sign in to join groups');
      return;
    }
    try {
      await api.post(`/groups/${groupId}/join`);
      refetchGroup();
      showToast.success('Joined group! 🎉');
    } catch {
      showToast.error('Action failed');
    }
  };

  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      showToast.info('Sign in to create a post');
      return;
    }
    if (!postText.trim()) return;

    setSubmittingPost(true);
    try {
      await api.post(`/groups/${groupId}/posts`, { content: postText.trim() });
      setPostText('');
      refetchPosts();
      showToast.success('Post shared! 🚀');
    } catch {
      showToast.error('Failed to publish post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleAddComment = useCallback(
    async (postId: number) => {
      const text = commentText[postId]?.trim();
      if (!text) return;

      setSubmittingComment(true);
      try {
        await api.post(`/groups/${groupId}/posts/${postId}/comments`, { content: text });
        setCommentText((prev) => ({ ...prev, [postId]: '' }));
        setActiveCommentPostId(null);
        refetchPosts();
        showToast.success('Comment added');
      } catch {
        showToast.error('Failed to post comment');
      } finally {
        setSubmittingComment(false);
      }
    },
    [commentText, groupId, refetchPosts]
  );

  // These have to stay above the early returns below — Hooks must run in
  // the same order on every render, and `group` being undefined on first
  // load would otherwise skip them conditionally.
  const renderPost = useCallback(
    ({ item: post }: ListRenderItemInfo<GroupPost>) => (
      <View style={styles.postCard}>
        <View style={styles.postAuthorRow}>
          <Avatar
            seed={post.user_name}
            name={post.user_name}
            size={32}
            borderRadius={16}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.user_name}</Text>
            <Text style={styles.postTime}>
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        {/* Comments Toggle */}
        <View style={styles.postActions}>
          <IOSPressable
            style={styles.commentActionBtn}
            onPress={() =>
              setActiveCommentPostId(
                activeCommentPostId === post.id ? null : post.id
              )
            }
            activeScale={0.92}
          >
            <MessageSquare size={13} color={colors.secondaryLabel} />
            <Text style={styles.commentActionText}>
              {post.comments?.length || 0} Comments
            </Text>
          </IOSPressable>
        </View>

        {/* Expanded Comments */}
        {activeCommentPostId === post.id && (
          <View style={styles.commentsWrap}>
            {post.comments?.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{comment.user_name}</Text>
                <Text style={styles.commentBody}>{comment.content}</Text>
              </View>
            ))}

            {/* Add Comment Input */}
            <View style={styles.addCommentRow}>
              <TextInput
                style={styles.commentInput}
                value={commentText[post.id] || ''}
                onChangeText={(val) =>
                  setCommentText((prev) => ({ ...prev, [post.id]: val }))
                }
                placeholder="Write a comment..."
                placeholderTextColor={colors.textDim}
              />
              <IOSPressable
                style={styles.commentSubmitBtn}
                onPress={() => handleAddComment(post.id)}
                activeScale={0.9}
              >
                <Send size={14} color="#FFFFFF" />
              </IOSPressable>
            </View>
          </View>
        )}
      </View>
    ),
    [activeCommentPostId, commentText, handleAddComment]
  );

  const keyExtractor = useCallback((post: GroupPost) => String(post.id), []);

  if (groupLoading) {
    return (
      <View style={styles.centerRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centerRoot}>
        <IOSHeader title="Group" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Group not found</Text>
        </View>
      </View>
    );
  }

  const listHeader = (
    <>
      {/* Group Header Hero */}
        <View style={styles.groupHero}>
          <LinearGradient
            colors={['rgba(236,72,153,0.18)', 'rgba(139,92,246,0.12)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.groupIconWrap}>
            <Users size={32} color="#EC4899" />
          </View>

          <Text style={styles.groupName}>{group.name}</Text>
          {group.description ? (
            <Text style={styles.groupDesc}>{group.description}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.memberChip}>
              <Users size={12} color={colors.secondaryLabel} />
              <Text style={styles.memberText}>
                {group.member_count || 1} members
              </Text>
            </View>

            {group.is_creator && (
              <View style={styles.creatorBadge}>
                <Shield size={11} color="#FFC107" />
                <Text style={styles.creatorText}>Creator</Text>
              </View>
            )}
          </View>

          {!group.is_creator && (
            <IOSPressable
              style={[
                styles.joinBtn,
                group.is_member && styles.joinedBtn,
              ]}
              onPress={handleToggleJoin}
              activeScale={0.92}
              accessibilityRole="button"
              accessibilityLabel={group.is_member ? 'Member' : 'Join Group'}
            >
              {group.is_member ? (
                <>
                  <UserCheck size={13} color="#FFFFFF" />
                  <Text style={styles.joinedBtnText}>Joined</Text>
                </>
              ) : (
                <>
                  <UserPlus size={13} color="#000000" />
                  <Text style={styles.joinBtnText}>Join Group</Text>
                </>
              )}
            </IOSPressable>
          )}
        </View>

        {/* Post Composer */}
        {group.is_member && (
          <View style={styles.composerCard}>
            <View style={styles.composerTop}>
              <Avatar
                src={user?.avatar_url}
                seed={user?.username || user?.name}
                name={user?.name}
                size={34}
                borderRadius={17}
              />
              <TextInput
                style={styles.composerInput}
                value={postText}
                onChangeText={setPostText}
                placeholder="Start a movie debate or share thoughts..."
                placeholderTextColor={colors.textDim}
                multiline
              />
            </View>

            {postText.trim().length > 0 && (
              <View style={styles.composerBottom}>
                <IOSPressable
                  style={styles.sendBtn}
                  onPress={handleCreatePost}
                  activeScale={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Post"
                >
                  {submittingPost ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.sendBtnText}>Post</Text>
                      <Send size={12} color="#FFFFFF" />
                    </>
                  )}
                </IOSPressable>
              </View>
            )}
          </View>
        )}

        {/* Posts List Header */}
        <View style={[styles.postsSection, { paddingBottom: 0 }]}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Discussions ({posts.length})</Text>
          </View>
        </View>
      </>
  );

  return (
    <View style={styles.root}>
      <IOSHeader title={group.name} />

      <FlatList<GroupPost>
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
        bounces={true}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          postsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.emptyPostsWrap}>
              <Text style={styles.emptyPostsTitle}>No discussions yet</Text>
              <Text style={styles.emptyPostsSub}>Be the first cinephile to start a debate!</Text>
            </View>
          )
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
  centerRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  groupHero: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    overflow: 'hidden',
  },
  groupIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(236,72,153,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  groupName: {
    fontFamily: fonts.headingBlack,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  groupDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  memberText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.secondaryLabel,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,193,7,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.3)',
  },
  creatorText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFC107',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  joinBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#000000',
  },
  joinedBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  joinedBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  composerCard: {
    margin: spacing.lg,
    marginBottom: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  composerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  composerInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#FFFFFF',
    maxHeight: 80,
  },
  composerBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  sendBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  postsSection: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 16,
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 20,
  },
  emptyPostsWrap: {
    alignItems: 'center',
    padding: 30,
  },
  emptyPostsTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptyPostsSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    // Now a FlatList item rendered outside postsSection (whose own padding
    // used to provide this inset) — restore it here directly.
    marginHorizontal: spacing.lg,
    marginBottom: 12,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  postTime: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textDim,
  },
  postContent: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginBottom: 10,
  },
  postActions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  commentActionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.secondaryLabel,
  },
  commentsWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  commentItem: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 8,
    borderRadius: radius.sm,
  },
  commentAuthor: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.primary,
    marginBottom: 2,
  },
  commentBody: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#FFFFFF',
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#FFFFFF',
  },
  commentSubmitBtn: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
