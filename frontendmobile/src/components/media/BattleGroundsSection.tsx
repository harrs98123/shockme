import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Check, X, Send, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react-native';

import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import type { Debate } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import showToast from '@/lib/toast';

interface Props {
  movieId: number | string;
  mediaType?: 'movie' | 'tv';
}

export function BattleGroundsSection({ movieId, mediaType = 'movie' }: Props) {
  const user = useAuthStore((s) => s.user);

  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stance, setStance] = useState<'agree' | 'disagree' | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setDebates((prev) => [res.data, ...prev]);
      setContent('');
      setStance(null);
    } catch {
      showToast.error('Failed to post debate argument.');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <View style={styles.container}>
      {/* Heading with Red Accent Bar */}
      <View style={styles.titleRow}>
        <View style={styles.redBar} />
        <Text style={styles.sectionHeading}>Battle Grounds</Text>
      </View>

      {/* Join the Debate Card */}
      <View style={styles.debateCard}>
        <Text style={styles.cardTitle}>Join the Debate</Text>
        <Text style={styles.cardSubtitle}>
          Is this a masterpiece or overrated? Pick a side.
        </Text>

        {/* 2 Stance Selection Buttons */}
        <View style={styles.stanceRow}>
          <IOSPressable
            style={[
              styles.stanceBtn,
              stance === 'agree' && styles.stanceBtnActiveAgree,
            ]}
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
            style={[
              styles.stanceBtn,
              stance === 'disagree' && styles.stanceBtnActiveDisagree,
            ]}
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

        {/* Text input area */}
        <TextInput
          style={styles.argumentInput}
          placeholder={stance ? `State why you ${stance}...` : 'Select a stance to start...'}
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={3}
        />

        {/* Start debate CTA */}
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

        {/* Empty state or debates stream */}
        {debates.length === 0 ? (
          <View style={styles.emptyArena}>
            <MessageSquare size={20} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyArenaText}>
              The arena is empty. Be the first to strike.
            </Text>
          </View>
        ) : (
          <View style={styles.debatesList}>
            {debates.map((d) => {
              const isAgree = d.stance === 'agree';
              return (
                <View key={d.id} style={styles.debateItem}>
                  <View style={styles.debateItemHeader}>
                    <View style={styles.authorGroup}>
                      <View style={styles.miniAvatar}>
                        <Text style={styles.miniAvatarText}>
                          {d.author_name ? d.author_name.slice(0, 1) : 'U'}
                        </Text>
                      </View>
                      <Text style={styles.authorNameText}>{d.author_name}</Text>
                    </View>

                    <View
                      style={[
                        styles.stanceTag,
                        {
                          backgroundColor: isAgree
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          borderColor: isAgree
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(239, 68, 68, 0.3)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stanceTagText,
                          { color: isAgree ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {isAgree ? 'AGREE' : 'DISAGREE'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.debateContentText}>{d.content}</Text>

                  {/* Vote controls */}
                  <View style={styles.voteRow}>
                    <Pressable
                      style={styles.voteAction}
                      onPress={() => handleVote(d.id, 'up')}
                      hitSlop={6}
                    >
                      <ThumbsUp
                        size={12}
                        color={d.user_vote === 'up' ? '#10B981' : colors.textMuted}
                        fill={d.user_vote === 'up' ? '#10B981' : 'none'}
                      />
                      <Text style={[styles.voteCountText, d.user_vote === 'up' && { color: '#10B981' }]}>
                        {d.upvotes}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.voteAction}
                      onPress={() => handleVote(d.id, 'down')}
                      hitSlop={6}
                    >
                      <ThumbsDown
                        size={12}
                        color={d.user_vote === 'down' ? '#EF4444' : colors.textMuted}
                        fill={d.user_vote === 'down' ? '#EF4444' : 'none'}
                      />
                      <Text style={[styles.voteCountText, d.user_vote === 'down' && { color: '#EF4444' }]}>
                        {d.downvotes}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
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
    gap: 8,
    marginBottom: 14,
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
  debateItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontFamily: fonts.headingSemi,
    fontSize: 9,
    color: '#FFFFFF',
  },
  authorNameText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFFFFF',
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
    gap: 14,
    paddingTop: 4,
  },
  voteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteCountText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
});
