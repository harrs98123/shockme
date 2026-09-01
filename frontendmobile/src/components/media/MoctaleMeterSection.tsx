import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Pressable,
  Share,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  Share2,
  ThumbsUp,
  MessageCircle,
  MoreHorizontal,
  CheckCircle2,
  Send,
  CornerDownRight,
} from 'lucide-react-native';
import { Image } from 'expo-image';

import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import showToast from '@/lib/toast';

interface ReviewComment {
  id: number;
  review_id: number;
  user_id: number;
  author_name: string;
  author_username?: string;
  author_avatar?: string;
  content: string;
  created_at: string;
  likes_count: number;
  user_liked?: boolean;
}

interface Review {
  id: number;
  user_id: number;
  author_name: string;
  author_username?: string;
  author_avatar?: string;
  label: string;
  review_text?: string;
  created_at: string;
  likes_count: number;
  comments_count?: number;
  user_liked?: boolean;
  comments?: ReviewComment[];
}

interface MoctaleStats {
  total: number;
  skip: number;
  timepass: number;
  goforit: number;
  perfection: number;
  skip_pct: number;
  timepass_pct: number;
  goforit_pct: number;
  perfection_pct: number;
  top_label: string;
  user_label: string | null;
  reviews: Review[];
}

interface Props {
  movieId: number | string;
  mediaType?: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
}

const LABELS = [
  { id: 'skip', label: 'Skip', color: '#F43F5E' },
  { id: 'timepass', label: 'Timepass', color: '#FBBF24' },
  { id: 'goforit', label: 'Go for it', color: '#10B981' },
  { id: 'perfection', label: 'Perfection', color: '#A78BFA' },
] as const;

export function MoctaleMeterSection({ movieId, mediaType = 'movie', title, posterPath }: Props) {
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState<MoctaleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLabel, setSelectedLabel] = useState<string>('perfection');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<number[]>([]);

  // Comments state per review
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentingReviewId, setCommentingReviewId] = useState<number | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<MoctaleStats>(`/moctale/${movieId}?media_type=${mediaType}`);
      setStats(res.data);
      if (res.data?.user_label) {
        setSelectedLabel(res.data.user_label);
      }
    } catch {
      // Endpoint may return empty if no reviews
    } finally {
      setLoading(false);
    }
  }, [mediaType, movieId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleVoteSubmit = async () => {
    if (!user) {
      showToast.error('Please log in to post a review.');
      return;
    }
    if (!selectedLabel) {
      showToast.warning('Please select a verdict.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/moctale/${movieId}`, {
        label: selectedLabel,
        media_type: mediaType,
        review_text: reviewText.trim() || undefined,
        title,
        poster_path: posterPath ?? undefined,
      });
      showToast.success('Verdict & Review posted! ✨');
      setReviewText('');
      await fetchStats();
    } catch {
      showToast.error('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeReview = async (reviewId: number) => {
    if (!user) {
      showToast.error('Please log in to like reviews.');
      return;
    }
    try {
      await api.post(`/moctale/reviews/${reviewId}/like`);
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  likes_count: r.user_liked ? r.likes_count - 1 : r.likes_count + 1,
                  user_liked: !r.user_liked,
                }
              : r
          ),
        };
      });
    } catch {
      showToast.error('Failed to like review');
    }
  };

  const toggleComments = (reviewId: number) => {
    setExpandedComments((prev) =>
      prev.includes(reviewId) ? prev.filter((id) => id !== reviewId) : [...prev, reviewId]
    );
  };

  const toggleExpandReview = (reviewId: number) => {
    setExpandedReviews((prev) =>
      prev.includes(reviewId) ? prev.filter((id) => id !== reviewId) : [...prev, reviewId]
    );
  };

  const handlePostComment = async (reviewId: number) => {
    const text = commentInputs[reviewId]?.trim();
    if (!text) return;
    if (!user) {
      showToast.error('Please log in to comment');
      return;
    }

    setCommentingReviewId(reviewId);
    try {
      const res = await api.post<ReviewComment>(`/moctale/reviews/${reviewId}/comments`, {
        content: text,
      });
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  comments_count: (r.comments_count || 0) + 1,
                  comments: [...(r.comments || []), res.data],
                }
              : r
          ),
        };
      });
      setCommentInputs((prev) => ({ ...prev, [reviewId]: '' }));
      showToast.success('Comment posted!');
    } catch {
      showToast.error('Failed to post comment');
    } finally {
      setCommentingReviewId(null);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out the Moctale verdict for "${title}" on Plotmint! 🎬`,
      });
    } catch {}
  };

  const total = stats?.total ?? 0;
  const topLabelMeta = LABELS.find((l) => l.id === (stats?.top_label || 'perfection')) || LABELS[3];
  const topPct = stats
    ? Math.round((stats as any)[`${stats.top_label || 'perfection'}_pct`] ?? 0)
    : 0;

  // ── Multi-Segment SVG Arc Calculation (Exact Web Match) ──
  const R = 75;
  const cx = 100;
  const cy = 90;
  const strokeW = 14;
  const gapAngle = 4;

  const segments = [
    { key: 'skip', pct: stats?.skip_pct ?? 0, color: '#F43F5E' },
    { key: 'timepass', pct: stats?.timepass_pct ?? 0, color: '#FBBF24' },
    { key: 'goforit', pct: stats?.goforit_pct ?? 0, color: '#10B981' },
    { key: 'perfection', pct: stats?.perfection_pct ?? 0, color: '#A78BFA' },
  ].filter((s) => s.pct > 0);

  const totalPct = segments.reduce((sum, seg) => sum + seg.pct, 0) || 100;
  const totalGaps = segments.length > 1 ? (segments.length - 1) * gapAngle : 0;
  const availableAngle = Math.max(0, 180 - totalGaps);

  const polarToX = (angle: number) => cx + R * Math.cos((Math.PI * angle) / 180);
  const polarToY = (angle: number) => cy - R * Math.sin((Math.PI * angle) / 180);

  let currentAngle = 0;
  const arcs = segments.map((seg) => {
    const sweep = (seg.pct / totalPct) * availableAngle;
    const startAngle = 180 - currentAngle;
    const endAngle = 180 - (currentAngle + sweep);
    const x1 = polarToX(startAngle);
    const y1 = polarToY(startAngle);
    const x2 = polarToX(endAngle);
    const y2 = polarToY(endAngle);
    const largeArc = sweep > 180 ? 1 : 0;
    currentAngle += sweep + gapAngle;

    return {
      d: `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`,
      color: seg.color,
      key: seg.key,
    };
  });

  const userInitial = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : 'SU';
  const userHandle = user?.username ? `@${user.username}` : '@superman';

  const reviewsList = stats?.reviews || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeading}>Moctale Meter</Text>
        <IOSPressable style={styles.shareBtn} onPress={handleShare} activeScale={0.88}>
          <Share2 size={16} color="#FFFFFF" />
        </IOSPressable>
      </View>

      {/* Semicircular Gauge Card */}
      <View style={styles.gaugeCard}>
        <View style={styles.arcContainer}>
          {/* Radial Arch SVG with Real Segmented Arcs */}
          <Svg width={200} height={105} viewBox="0 0 200 105">
            {/* Background Arch Track */}
            <Path
              d={`M ${polarToX(180)} ${polarToY(180)} A ${R} ${R} 0 0 1 ${polarToX(0)} ${polarToY(0)}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
            {/* Active Multi-Segment Arcs */}
            {arcs.map((arc) => (
              <Path
                key={arc.key}
                d={arc.d}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeW}
                strokeLinecap="round"
              />
            ))}
          </Svg>

          {/* Central Percentage & Votes */}
          <View style={styles.gaugeCenterText}>
            <Text style={[styles.gaugePct, { color: topLabelMeta.color }]}>
              {total > 0 ? `${topPct}%` : '0%'}
            </Text>
            <Text style={styles.gaugeVotes}>
              {total} {total === 1 ? 'Vote' : 'Votes'}
            </Text>
          </View>
        </View>

        {/* 4-Verdict Stats Legend (Real Backend Percentages & Counts) */}
        <View style={styles.statsLegendGrid}>
          {LABELS.map((item) => {
            const pct = stats ? Math.round((stats as any)[`${item.id}_pct`] ?? 0) : 0;
            const count = stats ? (stats as any)[item.id] ?? 0 : 0;

            return (
              <View key={item.id} style={styles.legendItem}>
                <View style={[styles.statDot, { backgroundColor: item.color }]} />
                <Text style={styles.statLabel}>
                  {item.label}{' '}
                  <Text style={styles.statPct}>
                    {pct}% <Text style={styles.statCount}>({count})</Text>
                  </Text>
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Reviews Section ── */}
      <View style={styles.reviewsSection}>
        <Text style={styles.reviewsHeading}>Reviews</Text>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          <View style={styles.filterPillActive}>
            <Text style={styles.filterPillTextActive}>↓↑ Most Liked ⌵</Text>
          </View>
          <View style={styles.filterPill}>
            <View style={styles.checkboxBox} />
            <Text style={styles.filterPillText}>Show Spoilers</Text>
          </View>
          <View style={styles.filterPill}>
            <View style={styles.checkboxBox} />
            <Text style={styles.filterPillText}>Following Only</Text>
          </View>
        </View>

        {/* Review Composer Card */}
        <View style={styles.composerCard}>
          <View style={styles.composerUserRow}>
            <View style={styles.composerAvatar}>
              <Text style={styles.composerAvatarText}>{userInitial}</Text>
            </View>
            <Text style={styles.composerHandle}>{userHandle}</Text>
          </View>

          {/* 4-Verdict Pill Selector with Real Backend Counts */}
          <View style={styles.verdictTabs}>
            {LABELS.map((item) => {
              const isSelected = selectedLabel === item.id;
              const count = stats ? (stats as any)[item.id] ?? 0 : 0;

              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.verdictTab,
                    isSelected && {
                      backgroundColor: item.color,
                      borderColor: item.color,
                    },
                  ]}
                  onPress={() => setSelectedLabel(item.id)}
                >
                  <Text
                    style={[
                      styles.verdictTabText,
                      isSelected && {
                        color: '#000000',
                        fontFamily: fonts.headingSemi,
                      },
                    ]}
                  >
                    {item.label}{' '}
                    <Text style={{ opacity: isSelected ? 0.75 : 0.5 }}>{count}</Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Text Area */}
          <TextInput
            style={styles.composerInput}
            placeholder="Write your review here..."
            placeholderTextColor="rgba(255, 255, 255, 0.35)"
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={3}
            maxLength={1000}
          />

          {/* Footer with Char Count & Post CTA */}
          <View style={styles.composerFooter}>
            <Text style={styles.charCount}>{reviewText.length}/1000</Text>
            <IOSPressable
              style={styles.postBtn}
              onPress={handleVoteSubmit}
              disabled={submitting}
              activeScale={0.94}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.postBtnText}>Post</Text>
              )}
            </IOSPressable>
          </View>
        </View>

        {/* ── Real Database Reviews Stream ── */}
        <View style={styles.reviewsList}>
          {reviewsList.length > 0 ? (
            reviewsList.map((rev) => {
              const revMeta = LABELS.find((l) => l.id === rev.label) ?? LABELS[3];
              const isCommentsOpen = expandedComments.includes(rev.id);
              const isExpanded = expandedReviews.includes(rev.id);

              return (
                <View key={rev.id} style={styles.reviewItemCard}>
                  {/* Header: Avatar, Name, Handle, Badge */}
                  <View style={styles.reviewItemHeader}>
                    <View style={styles.reviewAuthorBlock}>
                      <View
                        style={[
                          styles.reviewAvatar,
                          {
                            borderColor: revMeta.color,
                            borderWidth: 1.5,
                            backgroundColor: `${revMeta.color}20`,
                          },
                        ]}
                      >
                        {rev.author_avatar ? (
                          <Image source={{ uri: rev.author_avatar }} style={styles.reviewAvatarImg} />
                        ) : (
                          <Text style={styles.reviewAvatarText}>
                            {rev.author_name ? rev.author_name.slice(0, 2).toUpperCase() : 'U'}
                          </Text>
                        )}
                      </View>
                      <View>
                        <View style={styles.authorNameRow}>
                          <Text style={styles.reviewAuthorName}>{rev.author_name}</Text>
                          <CheckCircle2 size={13} color="#3B82F6" fill="#3B82F6" />
                        </View>
                        {rev.author_username && (
                          <Text style={styles.reviewAuthorHandle}>
                            @{rev.author_username}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Verdict Badge */}
                    <View style={[styles.verdictBadgePill, { backgroundColor: revMeta.color }]}>
                      <Text style={styles.verdictBadgeText}>{revMeta.label}</Text>
                    </View>
                  </View>

                  {/* Review Body */}
                  {rev.review_text ? (
                    <View style={styles.reviewContentBlock}>
                      <Text
                        style={styles.reviewContent}
                        numberOfLines={isExpanded ? undefined : 3}
                      >
                        {rev.review_text}
                      </Text>
                      {rev.review_text.length > 120 && !isExpanded && (
                        <Pressable onPress={() => toggleExpandReview(rev.id)} hitSlop={6}>
                          <Text style={styles.moreToggleText}>... more</Text>
                        </Pressable>
                      )}
                    </View>
                  ) : null}

                  {/* Actions Footer: Like, Comment, Options */}
                  <View style={styles.reviewActionFooter}>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => handleLikeReview(rev.id)}
                      hitSlop={8}
                    >
                      <ThumbsUp
                        size={14}
                        color={rev.user_liked ? colors.primary : 'rgba(255,255,255,0.45)'}
                        fill={rev.user_liked ? colors.primary : 'none'}
                      />
                      <Text style={[styles.actionNum, rev.user_liked && { color: colors.primary }]}>
                        {rev.likes_count}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => toggleComments(rev.id)}
                      hitSlop={8}
                    >
                      <MessageCircle size={14} color="rgba(255,255,255,0.45)" />
                      <Text style={styles.actionNum}>{rev.comments_count ?? rev.comments?.length ?? 0}</Text>
                    </Pressable>

                    <Pressable style={{ marginLeft: 'auto' }} hitSlop={8}>
                      <MoreHorizontal size={16} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                  </View>

                  {/* Expandable Comments Thread */}
                  {isCommentsOpen && (
                    <View style={styles.commentsContainer}>
                      {rev.comments && rev.comments.length > 0 ? (
                        rev.comments.map((c) => (
                          <View key={c.id} style={styles.commentItem}>
                            <CornerDownRight size={12} color="rgba(255,255,255,0.3)" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.commentAuthor}>{c.author_name}</Text>
                              <Text style={styles.commentBody}>{c.content}</Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noCommentsText}>No replies yet</Text>
                      )}

                      {/* Reply Input Box */}
                      <View style={styles.replyInputRow}>
                        <TextInput
                          style={styles.replyInput}
                          placeholder="Write a reply..."
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={commentInputs[rev.id] || ''}
                          onChangeText={(t) =>
                            setCommentInputs((prev) => ({ ...prev, [rev.id]: t }))
                          }
                        />
                        <Pressable
                          style={styles.replySendBtn}
                          onPress={() => handlePostComment(rev.id)}
                          disabled={commentingReviewId === rev.id}
                        >
                          {commentingReviewId === rev.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Send size={13} color="#FFFFFF" />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyReviewsCard}>
              <Text style={styles.emptyReviewsTitle}>No reviews yet</Text>
              <Text style={styles.emptyReviewsSub}>
                Be the first to share your verdict on {title}!
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeading: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
  },
  shareBtn: {
    padding: 6,
  },
  gaugeCard: {
    backgroundColor: '#111116',
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  arcContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 110,
  },
  gaugeCenterText: {
    position: 'absolute',
    bottom: 6,
    alignItems: 'center',
  },
  gaugePct: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 36,
  },
  gaugeVotes: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statsLegendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '42%',
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  statPct: {
    fontFamily: fonts.headingSemi,
    color: '#FFFFFF',
  },
  statCount: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
  },
  reviewsSection: {
    marginTop: 28,
  },
  reviewsHeading: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterPillTextActive: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFFFFF',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  filterPillText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  checkboxBox: {
    width: 11,
    height: 11,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  composerCard: {
    backgroundColor: '#111116',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  composerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  composerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerAvatarText: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  composerHandle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  verdictTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  verdictTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  verdictTabText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  composerInput: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 4,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  charCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
  },
  postBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 7,
  },
  postBtnText: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#000000',
  },
  reviewsList: {
    marginTop: 14,
    gap: 12,
  },
  reviewItemCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reviewAvatarImg: {
    width: '100%',
    height: '100%',
  },
  reviewAvatarText: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reviewAuthorName: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  reviewAuthorHandle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  verdictBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  verdictBadgeText: {
    fontFamily: fonts.headingSemi,
    fontSize: 10.5,
    color: '#000000',
  },
  reviewContentBlock: {
    paddingLeft: 48,
    gap: 2,
  },
  reviewContent: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 19,
  },
  moreToggleText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  reviewActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 4,
    paddingLeft: 48,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionNum: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  commentsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 6,
    marginLeft: 48,
    gap: 8,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  commentAuthor: {
    fontFamily: fonts.headingSemi,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  commentBody: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  noCommentsText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 12,
  },
  replySendBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: radius.sm,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyReviewsCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyReviewsTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptyReviewsSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
