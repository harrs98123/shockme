import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  AlertTriangle,
  Star,
  Film,
  Send,
  UserPlus,
  UserCheck,
  Smile,
  BarChart2,
  MoreVertical,
  Archive,
  Trash2,
  Copy,
  Flag,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { SocialPost } from '@/api/social';
import { socialApi } from '@/api/social';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import { CommentThread } from '@/components/social/CommentThread';
import showToast from '@/lib/toast';

const REACTIONS = [
  { emoji: '❤️', id: 'loved', label: 'Loved' },
  { emoji: '🔥', id: 'amazing', label: 'Amazing' },
  { emoji: '😂', id: 'funny', label: 'Funny' },
  { emoji: '😱', id: 'mindblown', label: 'Mindblown' },
  { emoji: '👎', id: 'disliked', label: 'Disliked' },
];

function timeAgo(dateStr: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  } catch {
    return '';
  }
}

export interface FeedPostCardProps {
  post: SocialPost;
  currentUserId?: number;
  onReact: (postId: number, reactionType: string) => void;
  onToggleFollow?: (author: { id: number; is_following?: boolean }) => void;
  onCommentAdded?: (postId: number) => void;
  onPostDeleted?: (postId: number) => void;
  onPostArchived?: (postId: number, isArchived: boolean) => void;
  onNavigate?: () => void;
}

function FeedPostCardComponent({
  post,
  currentUserId,
  onReact,
  onToggleFollow,
  onCommentAdded,
  onNavigate,
}: FeedPostCardProps) {
  const author = post.author;
  const authorName = author?.name || 'Cinephile';
  const authorHandle =
    author?.username || authorName.toLowerCase().replace(/\s+/g, '');
  const time = timeAgo(post.created_at);

  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [pollPayload, setPollPayload] = useState(post.payload);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isArchived, setIsArchived] = useState(!!post.is_archived);

  const isAuthorSelf = currentUserId === author?.id;

  const handleDeletePost = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to permanently delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsOptionsOpen(false);
              await socialApi.deletePost(post.id);
              onPostDeleted?.(post.id);
              showToast.success('Post deleted');
            } catch {
              showToast.error('Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleToggleArchive = async () => {
    try {
      setIsOptionsOpen(false);
      const updated = await socialApi.archivePost(post.id);
      const nextState = !!updated.is_archived;
      setIsArchived(nextState);
      onPostArchived?.(post.id, nextState);
      showToast.success(nextState ? 'Post moved to Archive' : 'Post unarchived');
    } catch {
      showToast.error('Failed to update post archive state');
    }
  };

  const handleSharePost = async () => {
    try {
      setIsOptionsOpen(false);
      await Share.share({
        message: `Check out ${authorName}'s post on Plotmint: "${post.content ? post.content.slice(0, 100) : post.movie_title || 'Film post'}"`,
      });
    } catch {
      // quiet
    }
  };

  // Optimistic instant state
  const [localUserReaction, setLocalUserReaction] = useState<string | null>(
    post.user_reaction ?? null
  );
  const [localReactions, setLocalReactions] = useState(post.reactions ?? []);
  // Total engagement shown next to the heart — there's no separate "likes"
  // counter on the backend, so (like web) it's always derived from reactions.
  const localLikesCount = localReactions.length;

  // Use a ref to track synchronous immediate state and prevent rapid double-click bugs
  const localReactionRef = useRef<string | null>(post.user_reaction ?? null);

  useEffect(() => {
    setLocalUserReaction(post.user_reaction ?? null);
    localReactionRef.current = post.user_reaction ?? null;
    setLocalReactions(post.reactions ?? []);
  }, [post.user_reaction, post.reactions]);

  // Animated heart pop on like
  const heartScale = useSharedValue(1);
  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const triggerHeartAnimation = () => {
    heartScale.value = withSequence(
      withSpring(1.35, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  };

  const handleLikePress = () => {
    triggerHeartAnimation();
    const isCurrentlyLiked = localReactionRef.current === 'loved';
    const nextReaction = isCurrentlyLiked ? '' : 'loved';

    localReactionRef.current = nextReaction || null;

    // Instant zero-lag UI feedback
    setLocalUserReaction(nextReaction || null);
    setLocalReactions((prev) => {
      const filtered = prev.filter((r) => r.user_id !== (currentUserId || 0));
      if (!isCurrentlyLiked) {
        return [
          ...filtered,
          {
            id: Date.now(),
            reaction_type: 'loved',
            user_id: currentUserId || 0,
            author_name: 'You',
          },
        ];
      }
      return filtered;
    });

    onReact(post.id, nextReaction || 'loved');
  };

  const handleEmojiReact = (reactionId: string) => {
    setShowReactionPicker(false);
    const isSameReaction = localReactionRef.current === reactionId;
    const nextReaction = isSameReaction ? '' : reactionId;

    localReactionRef.current = nextReaction || null;

    setLocalUserReaction(nextReaction || null);
    setLocalReactions((prev) => {
      const filtered = prev.filter((r) => r.user_id !== (currentUserId || 0));
      if (!isSameReaction) {
        return [
          ...filtered,
          {
            id: Date.now(),
            reaction_type: reactionId,
            user_id: currentUserId || 0,
            author_name: 'You',
          },
        ];
      }
      return filtered;
    });

    onReact(post.id, nextReaction || reactionId);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this film hot take by @${authorHandle} on Plotmint: "${post.content || post.movie_title || 'Movie Post'}"`,
      });
    } catch {
      // ignore
    }
  };

  const handleToggleComments = () => {
    setCommentsOpen((v) => !v);
  };

  const handleVotePoll = async (optionIdx: number) => {
    try {
      const res = await socialApi.votePoll(post.id, optionIdx);
      setPollPayload(res);
      showToast.success('Vote recorded! 📊');
    } catch (err: any) {
      showToast.info(err?.message || 'Vote submitted');
    }
  };

  const isSpoiler = post.is_spoiler && !isSpoilerRevealed;

  return (
    <View style={styles.card}>
      {/* ── Post Header (Instagram Style) ── */}
      <View style={styles.authorHeader}>
        <IOSPressable
          style={styles.authorTouchArea}
          onPress={() => {
            onNavigate?.();
            router.push(`/user/${author.id}` as never);
          }}
          activeScale={0.96}
          accessibilityRole="button"
          accessibilityLabel={`View ${authorName}'s profile`}
        >
          <Avatar
            src={author.avatar_url || author.avatar}
            seed={author.username || author.name}
            name={author.name}
            size={42}
            borderRadius={21}
          />

          <View style={styles.authorMeta}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {authorName}
              </Text>
              {author.is_following && (
                <View style={styles.followingDot} />
              )}
            </View>
            <Text style={styles.authorSub}>
              @{authorHandle} {time ? `• ${time}` : ''}
            </Text>
          </View>
        </IOSPressable>

        <View style={styles.authorHeaderRight}>
          {!isAuthorSelf && !author.is_following && onToggleFollow && (
            <IOSPressable
              style={styles.followBtn}
              onPress={() => onToggleFollow(author)}
              activeScale={0.92}
              accessibilityRole="button"
              accessibilityLabel="Follow user"
            >
              <UserPlus size={11} color="#000000" strokeWidth={2.5} />
              <Text style={styles.followBtnText}>Follow</Text>
            </IOSPressable>
          )}

          <IOSPressable
            style={styles.morePostBtn}
            onPress={() => setIsOptionsOpen(true)}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel="Post options"
          >
            <MoreVertical size={18} color={colors.secondaryLabel} />
          </IOSPressable>
        </View>
      </View>

      {/* ── Tagged Movie Banner (if attached) ── */}
      {(post.movie_id || post.movie_title) && (
        <IOSPressable
          style={styles.taggedMovieBanner}
          onPress={() => {
            onNavigate?.();
            router.push(
              `/${post.payload?.media_type || 'movie'}/${post.movie_id}` as never
            );
          }}
          activeScale={0.97}
          accessibilityRole="button"
          accessibilityLabel={`View movie ${post.movie_title || 'details'}`}
        >
          <Film size={14} color={colors.primary} />
          <Text style={styles.taggedMovieTitle} numberOfLines={1}>
            {post.movie_title || post.movie?.title || 'Tagged Movie'}
          </Text>
          {post.payload?.rating ? (
            <View style={styles.movieRatingPill}>
              <Star size={10} color="#FFC107" fill="#FFC107" />
              <Text style={styles.movieRatingText}>{post.payload.rating}/5</Text>
            </View>
          ) : null}
        </IOSPressable>
      )}

      {/* ── Post Content with Spoiler Blur ── */}
      <View style={styles.bodyContainer}>
        {isSpoiler ? (
          <IOSPressable
            style={styles.spoilerOverlay}
            onPress={() => setIsSpoilerRevealed(true)}
            activeScale={0.98}
            accessibilityRole="button"
            accessibilityLabel="Reveal spoiler content"
          >
            <AlertTriangle size={18} color="#EF4444" />
            <Text style={styles.spoilerTitle}>Spoiler Warning</Text>
            <Text style={styles.spoilerSub}>Tap to reveal content</Text>
          </IOSPressable>
        ) : (
          <>
            {post.is_spoiler && (
              <View style={styles.spoilerHeaderRow}>
                <AlertTriangle size={12} color="#EF4444" />
                <Text style={styles.spoilerTagText}>Spoiler Revealed</Text>
                <IOSPressable
                  onPress={() => setIsSpoilerRevealed(false)}
                  hitSlop={8}
                >
                  <Text style={styles.hideSpoilerText}>Hide</Text>
                </IOSPressable>
              </View>
            )}

            {/* Post Text */}
            {post.content ? (
              <Text style={styles.postText}>{post.content}</Text>
            ) : null}

            {/* Star Rating for Reviews */}
            {post.post_type === 'review' && post.payload?.rating && (
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    color="#FFC107"
                    fill={s <= post.payload.rating ? '#FFC107' : 'none'}
                  />
                ))}
              </View>
            )}

            {/* Poll Interactive Component */}
            {post.post_type === 'poll' && pollPayload?.options && (
              <View style={styles.pollContainer}>
                <View style={styles.pollHeader}>
                  <BarChart2 size={13} color="#F59E0B" />
                  <Text style={styles.pollTitle}>Community Poll</Text>
                </View>
                {pollPayload.options.map((opt: any, idx: number) => {
                  const optText = typeof opt === 'string' ? opt : opt.text;
                  const votes = typeof opt === 'object' ? opt.votes || 0 : 0;
                  const totalVotes = pollPayload.total_votes || 1;
                  const pct = Math.round((votes / totalVotes) * 100);

                  return (
                    <IOSPressable
                      key={idx}
                      style={styles.pollOptionBtn}
                      onPress={() => handleVotePoll(idx)}
                      activeScale={0.97}
                    >
                      <View
                        style={[styles.pollProgressBar, { width: `${pct}%` }]}
                      />
                      <Text style={styles.pollOptionText}>{optText}</Text>
                      {pollPayload.user_voted !== undefined && (
                        <Text style={styles.pollPctText}>{pct}%</Text>
                      )}
                    </IOSPressable>
                  );
                })}
              </View>
            )}

            {/* Meme / Photo / Scene Attachment */}
            {post.payload?.media_url ? (
              <View style={styles.mediaContainer}>
                <Image
                  source={{ uri: post.payload.media_url }}
                  style={styles.mediaImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* ── Reaction Picker Popover (Floating) ── */}
      {showReactionPicker && (
        <View style={styles.reactionPickerBubble}>
          {REACTIONS.map((r) => (
            <IOSPressable
              key={r.id}
              style={styles.emojiBtn}
              onPress={() => handleEmojiReact(r.id)}
              activeScale={1.25}
            >
              <Text style={styles.emojiText}>{r.emoji}</Text>
            </IOSPressable>
          ))}
        </View>
      )}

      {/* ── Action Bar & Quick Interactions ── */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeftGroup}>
          {/* Like Heart Button */}
          <IOSPressable
            style={styles.actionPillBtn}
            onPress={handleLikePress}
            onLongPress={() => setShowReactionPicker(true)}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel="Like"
          >
            <Animated.View style={heartAnimStyle}>
              <Heart
                size={20}
                color={localUserReaction === 'loved' ? '#EF4444' : '#FFFFFF'}
                fill={localUserReaction === 'loved' ? '#EF4444' : 'none'}
                strokeWidth={2}
              />
            </Animated.View>
            {localLikesCount > 0 ? (
              <Text
                style={[
                  styles.actionCountText,
                  localUserReaction === 'loved' && { color: '#EF4444' },
                ]}
              >
                {localLikesCount}
              </Text>
            ) : null}
          </IOSPressable>

          {/* Comment Bubble Button */}
          <IOSPressable
            style={styles.actionPillBtn}
            onPress={handleToggleComments}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel="Comments"
          >
            <MessageCircle size={20} color="#FFFFFF" strokeWidth={2} />
            {post.comments_count > 0 ? (
              <Text style={styles.actionCountText}>{post.comments_count}</Text>
            ) : null}
          </IOSPressable>

          {/* Share Button */}
          <IOSPressable
            style={styles.iconBtn}
            onPress={handleShare}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <Share2 size={19} color="rgba(255,255,255,0.85)" strokeWidth={2} />
          </IOSPressable>

          {/* Emoji Reaction Trigger */}
          <IOSPressable
            style={styles.iconBtn}
            onPress={() => setShowReactionPicker(!showReactionPicker)}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel="React"
          >
            <Smile
              size={19}
              color={showReactionPicker ? '#F59E0B' : 'rgba(255,255,255,0.65)'}
              strokeWidth={2}
            />
          </IOSPressable>
        </View>

        {/* Bookmark / Watchlist */}
        <IOSPressable
          style={styles.iconBtn}
          onPress={() => {
            setIsWatchlisted(!isWatchlisted);
            showToast.success(
              !isWatchlisted ? 'Saved to Watchlist' : 'Removed from Watchlist'
            );
          }}
          activeScale={0.88}
          accessibilityRole="button"
          accessibilityLabel="Save to Watchlist"
        >
          <Bookmark
            size={20}
            color={isWatchlisted ? '#3B82F6' : 'rgba(255,255,255,0.85)'}
            fill={isWatchlisted ? '#3B82F6' : 'none'}
            strokeWidth={2}
          />
        </IOSPressable>
      </View>

      {/* ── Active Reactions Capsules ── */}
      {localReactions && localReactions.length > 0 && (
        <View style={styles.activeReactionsRow}>
          {REACTIONS.map((r) => {
            const count = localReactions.filter(
              (rx) => rx.reaction_type === r.id
            ).length;
            if (!count) return null;
            const isMyReaction = localUserReaction === r.id;

            return (
              <IOSPressable
                key={r.id}
                style={[
                  styles.reactionChip,
                  isMyReaction && styles.reactionChipActive,
                ]}
                onPress={() => handleEmojiReact(r.id)}
                activeScale={0.92}
              >
                <Text style={styles.reactionChipEmoji}>{r.emoji}</Text>
                <Text style={styles.reactionChipCount}>{count}</Text>
              </IOSPressable>
            );
          })}
        </View>
      )}

      {/* ── Comments Expander ── */}
      {post.comments_count > 0 && !commentsOpen && (
        <IOSPressable
          style={styles.viewCommentsRow}
          onPress={handleToggleComments}
          activeScale={0.96}
        >
          <Text style={styles.viewCommentsText}>
            View all {post.comments_count} comments
          </Text>
        </IOSPressable>
      )}

      {/* ── Inline Comments Section ── */}
      {commentsOpen && (
        <View style={styles.commentsContainer}>
          <CommentThread
            postId={post.id}
            currentUserId={currentUserId}
            onCommentAdded={() => onCommentAdded?.(post.id)}
          />
        </View>
      )}

      {/* ── Post Options Modal (Instagram Style 3-dots Menu) ── */}
      <Modal
        visible={isOptionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOptionsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOptionsOpen(false)}>
          <View style={styles.optionsBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.optionsSheet}>
                <View style={styles.optionsHandleBar} />

                {isAuthorSelf && (
                  <>
                    <IOSPressable
                      style={styles.optionRow}
                      onPress={handleToggleArchive}
                      activeScale={0.96}
                    >
                      <Archive size={18} color="#FFFFFF" />
                      <Text style={styles.optionText}>
                        {isArchived ? 'Unarchive Post' : 'Archive Post'}
                      </Text>
                    </IOSPressable>

                    <IOSPressable
                      style={styles.optionRowDestructive}
                      onPress={handleDeletePost}
                      activeScale={0.96}
                    >
                      <Trash2 size={18} color="#EF4444" />
                      <Text style={styles.optionTextDestructive}>Delete Post</Text>
                    </IOSPressable>
                  </>
                )}

                <IOSPressable
                  style={styles.optionRow}
                  onPress={handleSharePost}
                  activeScale={0.96}
                >
                  <Share2 size={18} color="#FFFFFF" />
                  <Text style={styles.optionText}>Share Post...</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionRow}
                  onPress={() => {
                    setIsOptionsOpen(false);
                    showToast.success('Link copied to clipboard');
                  }}
                  activeScale={0.96}
                >
                  <Copy size={18} color="#FFFFFF" />
                  <Text style={styles.optionText}>Copy Link</Text>
                </IOSPressable>

                {!isAuthorSelf && (
                  <>
                    {onToggleFollow && (
                      <IOSPressable
                        style={styles.optionRow}
                        onPress={() => {
                          setIsOptionsOpen(false);
                          onToggleFollow(author);
                        }}
                        activeScale={0.96}
                      >
                        <UserPlus size={18} color="#FFFFFF" />
                        <Text style={styles.optionText}>
                          {author.is_following ? 'Unfollow' : 'Follow'} @{authorHandle}
                        </Text>
                      </IOSPressable>
                    )}

                    <IOSPressable
                      style={styles.optionRowDestructive}
                      onPress={() => {
                        setIsOptionsOpen(false);
                        showToast.info('Post reported. Thank you for keeping Plotmint safe.');
                      }}
                      activeScale={0.96}
                    >
                      <Flag size={18} color="#EF4444" />
                      <Text style={styles.optionTextDestructive}>Report Post</Text>
                    </IOSPressable>
                  </>
                )}

                <IOSPressable
                  style={styles.optionCancelBtn}
                  onPress={() => setIsOptionsOpen(false)}
                  activeScale={0.96}
                >
                  <Text style={styles.optionCancelText}>Cancel</Text>
                </IOSPressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: 10,
  },
  authorTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorMeta: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
  followingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  authorSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondaryLabel,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  followBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#000000',
  },
  authorHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  morePostBtn: {
    padding: 4,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: '#1E1E26',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  optionsHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionRowDestructive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: '#FFFFFF',
  },
  optionTextDestructive: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: '#EF4444',
  },
  optionCancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  optionCancelText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: '#FFFFFF',
  },
  taggedMovieBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: spacing.lg,
    marginBottom: 8,
    backgroundColor: 'rgba(229,9,20,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.2)',
  },
  taggedMovieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#FFFFFF',
    flex: 1,
  },
  movieRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  movieRatingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFC107',
  },
  bodyContainer: {
    paddingHorizontal: spacing.lg,
    marginVertical: 4,
  },
  postText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 20,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  spoilerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    gap: 4,
  },
  spoilerTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#EF4444',
  },
  spoilerSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondaryLabel,
  },
  spoilerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  spoilerTagText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#EF4444',
  },
  hideSpoilerText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    marginLeft: 'auto',
  },
  pollContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
    gap: 8,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  pollTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#F59E0B',
  },
  pollOptionBtn: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pollProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(245,158,11,0.2)',
  },
  pollOptionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#FFFFFF',
    zIndex: 1,
  },
  pollPctText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#F59E0B',
    zIndex: 1,
  },
  mediaContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 8,
    maxHeight: 340,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mediaImage: {
    width: '100%',
    height: 240,
  },
  reactionPickerBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#181722',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginHorizontal: spacing.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  emojiBtn: {
    padding: 6,
  },
  emojiText: {
    fontSize: 22,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  actionLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  actionCountText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  iconBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeReactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    marginTop: 2,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reactionChipActive: {
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderColor: 'rgba(239,68,68,0.45)',
  },
  reactionChipEmoji: {
    fontSize: 13,
  },
  reactionChipCount: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  viewCommentsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  viewCommentsText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.55)',
  },
  commentsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    gap: 8,
  },
});

export const FeedPostCard = React.memo(FeedPostCardComponent);

