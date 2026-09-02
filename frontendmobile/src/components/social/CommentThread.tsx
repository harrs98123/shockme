import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, Pressable } from 'react-native';
import {
  Send,
  ChevronUp,
  ChevronDown,
  CornerDownRight,
  Minus,
  Plus,
} from 'lucide-react-native';

import type { PostComment } from '@/api/social';
import { socialApi } from '@/api/social';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import showToast from '@/lib/toast';

function timeAgo(dateStr: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return '';
  }
}

interface CommentThreadProps {
  postId: number;
  currentUserId?: number;
  onCommentAdded?: () => void;
}

export function CommentThread({ postId, currentUserId, onCommentAdded }: CommentThreadProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    socialApi
      .getComments(postId)
      .then((fetched) => { if (!cancelled) setComments(fetched); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId]);

  // Flat list -> tree, built here so replies-to-replies (arbitrary depth,
  // Reddit-style) don't need N lazy round trips per node.
  const childrenMap = useMemo(() => {
    const map = new Map<number, PostComment[]>();
    for (const c of comments) {
      if (c.parent_id != null) {
        if (!map.has(c.parent_id)) map.set(c.parent_id, []);
        map.get(c.parent_id)!.push(c);
      }
    }
    return map;
  }, [comments]);

  const roots = useMemo(() => comments.filter((c) => c.parent_id == null), [comments]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await socialApi.addComment(postId, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      onCommentAdded?.();
      showToast.success('Comment posted');
    } catch {
      showToast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: number, text: string) => {
    const newComment = await socialApi.addComment(postId, text, false, parentId);
    setComments((prev) => [...prev, newComment]);
    onCommentAdded?.();
    setCollapsedIds((prev) => {
      if (!prev.has(parentId)) return prev;
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
  };

  const handleVote = async (commentId: number, vote: 'up' | 'down') => {
    setComments((prev) => prev.map((c) => {
      if (c.id !== commentId) return c;
      const upvoted = c.user_vote === 'up';
      const downvoted = c.user_vote === 'down';
      let newUp = c.upvotes;
      let newDown = c.downvotes;
      let newVote: 'up' | 'down' | null = null;

      if (vote === 'up') {
        if (upvoted) { newUp--; newVote = null; }
        else { newUp++; if (downvoted) newDown--; newVote = 'up'; }
      } else {
        if (downvoted) { newDown--; newVote = null; }
        else { newDown++; if (upvoted) newUp--; newVote = 'down'; }
      }

      return { ...c, upvotes: newUp, downvotes: newDown, user_vote: newVote };
    }));

    try {
      await socialApi.voteComment(commentId, vote);
    } catch {
      showToast.error('Failed to vote');
    }
  };

  const toggleCollapse = (id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
      ) : roots.length === 0 ? (
        <Text style={styles.emptyText}>No comments yet. Be the first to say something.</Text>
      ) : (
        roots.map((c) => (
          <CommentNode
            key={c.id}
            comment={c}
            depth={0}
            childrenMap={childrenMap}
            collapsedIds={collapsedIds}
            onToggleCollapse={toggleCollapse}
            onVote={handleVote}
            onReply={handleReply}
          />
        ))
      )}

      {/* Quick Comment Input */}
      <View style={styles.commentInputRow}>
        <TextInput
          ref={inputRef}
          style={styles.commentTextInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Add a comment..."
          placeholderTextColor={colors.textDim}
        />
        <IOSPressable
          style={styles.commentSendBtn}
          onPress={handleAddComment}
          disabled={submitting || !commentText.trim()}
          activeScale={0.88}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.postCommentText, commentText.trim().length > 0 && { color: colors.primary }]}>
              Post
            </Text>
          )}
        </IOSPressable>
      </View>
    </View>
  );
}

interface CommentNodeProps {
  comment: PostComment;
  depth: number;
  childrenMap: Map<number, PostComment[]>;
  collapsedIds: Set<number>;
  onToggleCollapse: (id: number) => void;
  onVote: (id: number, vote: 'up' | 'down') => void;
  onReply: (parentId: number, text: string) => Promise<void>;
}

function CommentNode({
  comment,
  depth,
  childrenMap,
  collapsedIds,
  onToggleCollapse,
  onVote,
  onReply,
}: CommentNodeProps) {
  const kids = childrenMap.get(comment.id) ?? [];
  const isCollapsed = collapsedIds.has(comment.id);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyText.trim() || posting) return;
    setPosting(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setReplyOpen(false);
    } catch {
      showToast.error('Failed to post reply');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={depth > 0 ? { marginLeft: 16, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: 'rgba(255,255,255,0.07)' } : undefined}>
      <View style={styles.commentRow}>
        <Avatar
          src={comment.author?.avatar_url}
          seed={comment.author?.username || comment.author?.name}
          name={comment.author?.name}
          size={depth === 0 ? 26 : 20}
          borderRadius={depth === 0 ? 13 : 10}
        />
        <View style={{ flex: 1 }}>
          <View style={styles.commentBubble}>
            <Text style={styles.commentAuthorName}>{comment.author?.name || 'Cinephile'}</Text>
            <Text style={styles.commentContent}>{comment.content}</Text>
          </View>

          {/* Reddit-style action row */}
          <View style={styles.actionRow}>
            {kids.length > 0 && (
              <Pressable style={styles.collapseBtn} onPress={() => onToggleCollapse(comment.id)} hitSlop={6}>
                {isCollapsed ? <Plus size={11} color={colors.textMuted} /> : <Minus size={11} color={colors.textMuted} />}
              </Pressable>
            )}

            <View style={styles.votePill}>
              <Pressable style={styles.voteChevron} onPress={() => onVote(comment.id, 'up')} hitSlop={6}>
                <ChevronUp size={14} color={comment.user_vote === 'up' ? '#FF4500' : colors.textMuted} strokeWidth={2.5} />
              </Pressable>
              <Text style={styles.netScoreText}>{comment.upvotes - comment.downvotes}</Text>
              <Pressable style={styles.voteChevron} onPress={() => onVote(comment.id, 'down')} hitSlop={6}>
                <ChevronDown size={14} color={comment.user_vote === 'down' ? '#00BFFF' : colors.textMuted} strokeWidth={2.5} />
              </Pressable>
            </View>

            <Pressable style={styles.replyToggleBtn} onPress={() => setReplyOpen((v) => !v)} hitSlop={6}>
              <CornerDownRight size={11} color={replyOpen ? '#FFFFFF' : colors.textMuted} />
              <Text style={[styles.replyToggleText, replyOpen && { color: '#FFFFFF' }]}>Reply</Text>
            </Pressable>

            {kids.length > 0 && (
              <Text style={styles.repliesCountText}>
                {kids.length} {kids.length === 1 ? 'reply' : 'replies'}
              </Text>
            )}
          </View>

          {replyOpen && (
            <View style={styles.replyBox}>
              <TextInput
                autoFocus
                style={styles.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder={`Reply to ${comment.author?.name || 'Cinephile'}...`}
                placeholderTextColor={colors.textDim}
              />
              <View style={styles.replyActionsRow}>
                <Pressable onPress={() => { setReplyOpen(false); setReplyText(''); }} hitSlop={8}>
                  <Text style={styles.replyCancelText}>Cancel</Text>
                </Pressable>
                <IOSPressable
                  style={[styles.replySendBtn, (!replyText.trim() || posting) && { opacity: 0.5 }]}
                  onPress={handleSubmitReply}
                  disabled={!replyText.trim() || posting}
                  activeScale={0.94}
                >
                  {posting ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Send size={11} color="#000000" />
                      <Text style={styles.replySendText}>Reply</Text>
                    </View>
                  )}
                </IOSPressable>
              </View>
            </View>
          )}
        </View>
      </View>

      {!isCollapsed && kids.length > 0 && (
        <View style={{ gap: 8, marginTop: 8 }}>
          {kids.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              childrenMap={childrenMap}
              collapsedIds={collapsedIds}
              onToggleCollapse={onToggleCollapse}
              onVote={onVote}
              onReply={onReply}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    gap: 8,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.3)',
    paddingVertical: 4,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commentBubble: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  commentAuthorName: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.primary,
    marginBottom: 2,
  },
  commentContent: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  collapseBtn: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  votePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  voteChevron: {
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  netScoreText: {
    fontFamily: fonts.headingSemi,
    fontSize: 10.5,
    color: '#FFFFFF',
    minWidth: 13,
    textAlign: 'center',
  },
  replyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  replyToggleText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  repliesCountText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  replyBox: {
    marginTop: 6,
    gap: 6,
  },
  replyInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 11.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  replyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  replyCancelText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  replySendBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  replySendText: {
    fontFamily: fonts.headingSemi,
    fontSize: 10.5,
    color: '#000000',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
  },
  commentTextInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#FFFFFF',
    paddingVertical: 4,
  },
  commentSendBtn: {
    paddingHorizontal: 6,
  },
  postCommentText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textDim,
  },
});
