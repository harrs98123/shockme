import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import {
  Check,
  X,
  Send,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  CornerDownRight,
  Minus,
  Plus,
} from 'lucide-react-native';

import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import type { Debate } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import showToast from '@/lib/toast';

interface Props {
  movieId: number | string;
  mediaType?: 'movie' | 'tv';
}

const INDENT_PX = 16;

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

export function BattleGroundsSection({ movieId, mediaType = 'movie' }: Props) {
  const user = useAuthStore((s) => s.user);

  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<'top' | 'new'>('top');
  const [stance, setStance] = useState<'agree' | 'disagree' | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  const fetchDebates = useCallback(async () => {
    try {
      const res = await api.get<Debate[]>(`/debates?movie_id=${movieId}&media_type=${mediaType}`);
      setDebates(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [movieId, mediaType]);

  useEffect(() => {
    fetchDebates();
  }, [fetchDebates]);

  // One flat fetch; the tree is built here so replies-to-replies (arbitrary
  // depth, Reddit-style) don't need N lazy round trips per node.
  const childrenMap = useMemo(() => {
    const map = new Map<number, Debate[]>();
    for (const d of debates) {
      if (d.parent_id != null) {
        if (!map.has(d.parent_id)) map.set(d.parent_id, []);
        map.get(d.parent_id)!.push(d);
      }
    }
    return map;
  }, [debates]);

  const roots = useMemo(() => {
    const list = debates.filter((d) => d.parent_id == null);
    if (sortMode === 'top') {
      return [...list].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    }
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [debates, sortMode]);

  const handleSubmitDebate = async () => {
    if (!user) {
      showToast.error('Please log in to join the debate.');
      return;
    }
    if (!stance) {
      showToast.warning('Please select Agree or Disagree.');
      return;
    }
    if (!content.trim()) {
      showToast.warning('Please enter your argument.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<Debate>('/debates', {
        movie_id: Number(movieId),
        media_type: mediaType,
        stance,
        content: content.trim(),
      });
      showToast.success('Debate argument posted! ⚔️');
      setDebates((prev) => [...prev, res.data]);
      setContent('');
      setStance(null);
    } catch {
      showToast.error('Failed to post debate argument.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: number, text: string) => {
    if (!user) {
      showToast.error('Please log in to reply.');
      return;
    }
    const res = await api.post<Debate>('/debates', {
      movie_id: Number(movieId),
      media_type: mediaType,
      content: text,
      parent_id: parentId,
    });
    setDebates((prev) => [...prev, res.data]);
    setCollapsedIds((prev) => {
      if (!prev.has(parentId)) return prev;
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
  };

  const handleVote = async (debateId: number, vote: 'up' | 'down') => {
    if (!user) {
      showToast.error('Please log in to vote on debates.');
      return;
    }

    setDebates((prev) =>
      prev.map((d) => {
        if (d.id === debateId) {
          const wasUp = d.user_vote === 'up';
          const wasDown = d.user_vote === 'down';
          let newUp = d.upvotes;
          let newDown = d.downvotes;
          let newVote: 'up' | 'down' | null = null;

          if (vote === 'up') {
            if (wasUp) {
              newUp--;
              newVote = null;
            } else {
              newUp++;
              if (wasDown) newDown--;
              newVote = 'up';
            }
          } else {
            if (wasDown) {
              newDown--;
              newVote = null;
            } else {
              newDown++;
              if (wasUp) newUp--;
              newVote = 'down';
            }
          }

          return { ...d, upvotes: newUp, downvotes: newDown, user_vote: newVote };
        }
        return d;
      })
    );

    try {
      await api.post(`/debates/${debateId}/vote`, { vote });
    } catch {
      fetchDebates();
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
      {/* Heading with Red Accent Bar + Sort Toggle */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <View style={styles.redBar} />
          <Text style={styles.sectionHeading}>Battle Grounds</Text>
        </View>
        {roots.length > 1 && (
          <View style={styles.sortToggle}>
            {(['top', 'new'] as const).map((mode) => (
              <IOSPressable
                key={mode}
                style={[styles.sortBtn, sortMode === mode && styles.sortBtnActive]}
                onPress={() => setSortMode(mode)}
                activeScale={0.94}
              >
                <Text style={[styles.sortBtnText, sortMode === mode && styles.sortBtnTextActive]}>
                  {mode.toUpperCase()}
                </Text>
              </IOSPressable>
            ))}
          </View>
        )}
      </View>

      {/* Join the Debate Card */}
      <View style={styles.debateCard}>
        <Text style={styles.cardTitle}>Join the Debate</Text>
        <Text style={styles.cardSubtitle}>
          Is this a masterpiece or overrated? Pick a side.
        </Text>

        <View style={styles.stanceRow}>
          <IOSPressable
            style={[styles.stanceBtn, stance === 'agree' && styles.stanceBtnActiveAgree]}
            onPress={() => setStance('agree')}
            activeScale={0.96}
          >
            <View style={[styles.stanceIconCircle, stance === 'agree' && { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Check size={14} color={stance === 'agree' ? '#10B981' : colors.textMuted} />
            </View>
            <Text style={[styles.stanceText, stance === 'agree' && { color: '#10B981', fontFamily: fonts.headingSemi }]}>
              AGREE
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.stanceBtn, stance === 'disagree' && styles.stanceBtnActiveDisagree]}
            onPress={() => setStance('disagree')}
            activeScale={0.96}
          >
            <View style={[styles.stanceIconCircle, stance === 'disagree' && { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <X size={14} color={stance === 'disagree' ? '#EF4444' : colors.textMuted} />
            </View>
            <Text style={[styles.stanceText, stance === 'disagree' && { color: '#EF4444', fontFamily: fonts.headingSemi }]}>
              DISAGREE
            </Text>
          </IOSPressable>
        </View>

        <TextInput
          style={styles.argumentInput}
          placeholder={stance ? `State why you ${stance}...` : 'Select a stance to start...'}
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={3}
        />

        <IOSPressable
          style={[styles.startDebateBtn, (!stance || !content.trim()) && { opacity: 0.7 }]}
          onPress={handleSubmitDebate}
          disabled={submitting}
          activeScale={0.96}
        >
          {submitting ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <View style={styles.startBtnContent}>
              <Send size={13} color="#000000" />
              <Text style={styles.startDebateText}>START DEBATE</Text>
            </View>
          )}
        </IOSPressable>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        ) : roots.length === 0 ? (
          <View style={styles.emptyArena}>
            <MessageSquare size={20} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyArenaText}>
              The arena is empty. Be the first to strike.
            </Text>
          </View>
        ) : (
          <View style={styles.debatesList}>
            {roots.map((d) => (
              <DebateNode
                key={d.id}
                debate={d}
                depth={0}
                childrenMap={childrenMap}
                collapsedIds={collapsedIds}
                onToggleCollapse={toggleCollapse}
                onVote={handleVote}
                onReply={handleReply}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

interface DebateNodeProps {
  debate: Debate;
  depth: number;
  childrenMap: Map<number, Debate[]>;
  collapsedIds: Set<number>;
  onToggleCollapse: (id: number) => void;
  onVote: (id: number, vote: 'up' | 'down') => void;
  onReply: (parentId: number, text: string) => Promise<void>;
}

function DebateNode({
  debate,
  depth,
  childrenMap,
  collapsedIds,
  onToggleCollapse,
  onVote,
  onReply,
}: DebateNodeProps) {
  const kids = childrenMap.get(debate.id) ?? [];
  const isCollapsed = collapsedIds.has(debate.id);
  const isReply = debate.stance === 'neutral';
  const isAgree = debate.stance === 'agree';

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyText.trim() || posting) return;
    setPosting(true);
    try {
      await onReply(debate.id, replyText.trim());
      setReplyText('');
      setReplyOpen(false);
    } catch {
      showToast.error('Failed to post reply');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={depth > 0 ? { marginLeft: INDENT_PX, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: 'rgba(255,255,255,0.07)' } : undefined}>
      <View style={[styles.debateItem, depth > 0 && styles.debateItemReply]}>
        <View style={styles.debateItemHeader}>
          <View style={styles.authorGroup}>
            <Avatar
              src={debate.author_avatar}
              seed={debate.author_username || debate.author_name}
              name={debate.author_name}
              size={depth === 0 ? 22 : 18}
              borderRadius={depth === 0 ? 11 : 9}
            />
            <Text style={styles.authorNameText}>{debate.author_name}</Text>
            <Text style={styles.timeText}>· {timeAgo(debate.created_at)}</Text>
          </View>

          {!isReply && (
            <View
              style={[
                styles.stanceTag,
                {
                  backgroundColor: isAgree ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  borderColor: isAgree ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                },
              ]}
            >
              <Text style={[styles.stanceTagText, { color: isAgree ? '#10B981' : '#EF4444' }]}>
                {isAgree ? 'AGREE' : 'DISAGREE'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.debateContentText}>{debate.content}</Text>

        {/* Reddit-style action row */}
        <View style={styles.voteRow}>
          {kids.length > 0 && (
            <Pressable
              style={styles.collapseBtn}
              onPress={() => onToggleCollapse(debate.id)}
              hitSlop={6}
            >
              {isCollapsed ? <Plus size={12} color={colors.textMuted} /> : <Minus size={12} color={colors.textMuted} />}
            </Pressable>
          )}

          <View style={styles.votePill}>
            <Pressable style={styles.voteChevron} onPress={() => onVote(debate.id, 'up')} hitSlop={6}>
              <ChevronUp size={15} color={debate.user_vote === 'up' ? '#FF4500' : colors.textMuted} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.netScoreText}>{debate.upvotes - debate.downvotes}</Text>
            <Pressable style={styles.voteChevron} onPress={() => onVote(debate.id, 'down')} hitSlop={6}>
              <ChevronDown size={15} color={debate.user_vote === 'down' ? '#00BFFF' : colors.textMuted} strokeWidth={2.5} />
            </Pressable>
          </View>

          <Pressable style={styles.replyToggleBtn} onPress={() => setReplyOpen((v) => !v)} hitSlop={6}>
            <CornerDownRight size={12} color={replyOpen ? '#FFFFFF' : colors.textMuted} />
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
              placeholder={`Reply to ${debate.author_name}...`}
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
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
                  <Text style={styles.replySendText}>Reply</Text>
                )}
              </IOSPressable>
            </View>
          </View>
        )}
      </View>

      {!isCollapsed && kids.length > 0 && (
        <View style={{ gap: 8, marginTop: 8 }}>
          {kids.map((child) => (
            <DebateNode
              key={child.id}
              debate={child}
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
    marginTop: 28,
    paddingHorizontal: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redBar: {
    width: 3.5,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  sectionHeading: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
  },
  sortToggle: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.pill,
    padding: 3,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  sortBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  sortBtnText: {
    fontFamily: fonts.headingSemi,
    fontSize: 10,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.5)',
  },
  sortBtnTextActive: {
    color: '#000000',
  },
  debateCard: {
    backgroundColor: '#111116',
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  cardTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 16,
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  stanceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  stanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stanceBtnActiveAgree: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  stanceBtnActiveDisagree: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  stanceIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  stanceText: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  argumentInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: radius.md,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  startDebateBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  startBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startDebateText: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#000000',
    letterSpacing: 0.5,
  },
  emptyArena: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyArenaText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  debatesList: {
    gap: 10,
    marginTop: 8,
  },
  debateItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  debateItemReply: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
  },
  debateItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  authorNameText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFFFFF',
  },
  timeText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
  },
  stanceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  stanceTagText: {
    fontFamily: fonts.headingSemi,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  debateContentText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 17,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
    flexWrap: 'wrap',
  },
  collapseBtn: {
    width: 22,
    height: 22,
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
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  netScoreText: {
    fontFamily: fonts.headingSemi,
    fontSize: 11,
    color: '#FFFFFF',
    minWidth: 14,
    textAlign: 'center',
  },
  replyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  replyToggleText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.textMuted,
  },
  repliesCountText: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.3)',
  },
  replyBox: {
    marginTop: 8,
    gap: 6,
  },
  replyInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.md,
    padding: 10,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 12,
    minHeight: 44,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  replyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  replyCancelText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.textMuted,
  },
  replySendBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  replySendText: {
    fontFamily: fonts.headingSemi,
    fontSize: 11,
    color: '#000000',
  },
});
