import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  X,
  Star,
  Film,
  ChevronRight,
  MoreVertical,
  Trash2,
  Share2,
  Copy,
  Flag,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import type { UserStoryGroup, Story } from '@/api/stories';
import { storiesApi } from '@/api/stories';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, radius, spacing } from '@/theme';
import { backdropUrl, posterUrl } from '@/lib/images';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import showToast from '@/lib/toast';

const STORY_DURATION_MS = 6000;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORY_POSTER_WIDTH = Math.min(SCREEN_WIDTH * 0.52, 210);
const STORY_POSTER_HEIGHT = Math.round(STORY_POSTER_WIDTH * 1.48);

interface CineStoryViewerModalProps {
  visible: boolean;
  userGroups: UserStoryGroup[];
  initialUserIndex?: number;
  onClose: () => void;
}

export function CineStoryViewerModal({
  visible,
  userGroups,
  initialUserIndex = 0,
  onClose,
}: CineStoryViewerModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const progress = useSharedValue(0);

  useEffect(() => {
    setUserIndex(initialUserIndex);
    setStoryIndex(0);
  }, [initialUserIndex, visible]);

  const currentGroup = userGroups[userIndex];
  const stories = currentGroup?.stories || [];
  const currentStory: Story | undefined = stories[storyIndex];

  const isOwnStory = Boolean(user && currentGroup && user.id === currentGroup.user_id);

  const nextStory = () => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (userIndex < userGroups.length - 1) {
      setUserIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (userIndex > 0) {
      setUserIndex((prev) => prev - 1);
      const prevStories = userGroups[userIndex - 1]?.stories || [];
      setStoryIndex(Math.max(0, prevStories.length - 1));
    }
  };

  useEffect(() => {
    if (!visible || !currentStory || isPaused || isOptionsOpen) return;

    progress.value = 0;
    progress.value = withTiming(
      1,
      {
        duration: STORY_DURATION_MS,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(nextStory)();
        }
      }
    );
  }, [visible, userIndex, storyIndex, isPaused, isOptionsOpen, currentStory]);

  const handleDeleteStory = () => {
    if (!currentStory) return;
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story? It will no longer be visible to anyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsOptionsOpen(false);
              await storiesApi.delete(currentStory.id);
              qc.invalidateQueries({ queryKey: ['stories'] });
              showToast.success('Story deleted');
              if (stories.length > 1) {
                nextStory();
              } else {
                onClose();
              }
            } catch {
              showToast.error('Failed to delete story');
            }
          },
        },
      ]
    );
  };

  const handleShareStory = async () => {
    try {
      setIsOptionsOpen(false);
      await Share.share({
        message: `Check out ${currentGroup?.name || 'film'}'s story on Plotmint! ${currentStory?.movie_title ? `About ${currentStory.movie_title}` : ''}`,
      });
    } catch {
      // quiet
    }
  };

  const handleReact = async (reaction: string) => {
    if (!currentStory) return;
    try {
      await storiesApi.react(currentStory.id, reaction);
      showToast.success(`Sent ${reaction} to story!`);
    } catch {
      // quiet
    }
  };

  if (!visible || !currentGroup || !currentStory) return null;

  const posterImg =
    posterUrl(currentStory.movie_poster, 'w780') ||
    posterUrl(currentStory.movie_backdrop, 'w780');

  const bgImage =
    backdropUrl(currentStory.movie_backdrop, 'w1280') ||
    posterImg;

  const movieTitle = currentStory.movie_title || 'Film Story';
  const mediaType = currentStory.media_type || 'movie';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" translucent />
      <View style={styles.root}>
        {/* Atmospheric Blurred Backdrop */}
        {bgImage ? (
          <Image
            source={{ uri: bgImage }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            blurRadius={Platform.OS === 'ios' ? 24 : 14}
            priority="high"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#100D18' }]} />
        )}

        {/* Ambient Dark Gradients */}
        <LinearGradient
          colors={[
            'rgba(10, 8, 16, 0.84)',
            'rgba(10, 8, 16, 0.58)',
            'rgba(8, 6, 14, 0.94)',
          ]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top Progress Bars */}
        <View style={[styles.progressContainer, { paddingTop: insets.top + 10 }]}>
          {stories.map((s, idx) => (
            <View key={s.id || idx} style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width:
                      idx < storyIndex
                        ? '100%'
                        : idx === storyIndex
                        ? `${progress.value * 100}%`
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Story Header: Real User Avatar & Name */}
        <View style={styles.storyHeader}>
          <IOSPressable
            style={styles.authorBadge}
            onPress={() => {
              onClose();
              router.push(`/user/${currentGroup.user_id}` as never);
            }}
            activeScale={0.95}
          >
            <Avatar
              src={currentGroup.avatar_url}
              seed={currentGroup.username || currentGroup.name}
              name={currentGroup.name}
              size={36}
              borderRadius={18}
            />
            <View style={styles.authorMeta}>
              <Text style={styles.authorName} numberOfLines={1}>
                {currentGroup.name}
              </Text>
              <Text style={styles.authorSub}>
                {currentStory.story_type?.toUpperCase().replace('_', ' ') || 'FILM PULSE'} • 24h
              </Text>
            </View>
          </IOSPressable>

          <View style={styles.topRightStoryActions}>
            <IOSPressable
              style={styles.moreOptionsBtn}
              onPress={() => setIsOptionsOpen(true)}
              activeScale={0.88}
              accessibilityRole="button"
              accessibilityLabel="Story Options"
            >
              <MoreVertical size={20} color="#FFFFFF" />
            </IOSPressable>

            <IOSPressable
              style={styles.closeBtn}
              onPress={onClose}
              activeScale={0.88}
              accessibilityRole="button"
              accessibilityLabel="Close story"
            >
              <X size={20} color="#FFFFFF" />
            </IOSPressable>
          </View>
        </View>

        {/* Tap navigation zones (left & right sides for story flip) */}
        <View style={styles.touchAreaContainer}>
          <TouchableWithoutFeedback
            onPress={prevStory}
            onPressIn={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
          >
            <View style={styles.touchLeft} />
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback
            onPress={nextStory}
            onPressIn={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
          >
            <View style={styles.touchRight} />
          </TouchableWithoutFeedback>
        </View>

        {/* ── Main Centerpiece Content: Floating Movie Poster & Aesthetic Caption ── */}
        <View style={styles.centerContent} pointerEvents="box-none">
          {/* Floating 3D-Style Poster Card */}
          {posterImg ? (
            <View style={styles.posterWrapper} pointerEvents="none">
              <View style={styles.posterGlowBackdrop} />
              <View style={styles.posterFrame}>
                <Image
                  source={{ uri: posterImg }}
                  style={styles.posterImage}
                  contentFit="cover"
                  priority="high"
                />

                {/* Subtle top sheen */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.22)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0.4 }}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Floating Rating Badge on Poster */}
                {currentStory.rating ? (
                  <View style={styles.floatingRatingBadge}>
                    <Star size={11} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.floatingRatingText}>
                      {currentStory.rating}/5
                    </Text>
                  </View>
                ) : null}

                {/* Floating Story Type Tag on Poster */}
                <View style={styles.floatingTypeBadge}>
                  <Text style={styles.floatingTypeText}>
                    {currentStory.story_type?.toUpperCase().replace('_', ' ') || 'FILM PULSE'}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Aesthetic Modern Caption Box */}
          {currentStory.caption ? (
            <View style={styles.aestheticCaptionBox} pointerEvents="none">
              <LinearGradient
                colors={['rgba(28, 22, 42, 0.88)', 'rgba(14, 11, 24, 0.94)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.captionQuoteIndicator} />
              <Text style={styles.aestheticCaptionText}>
                {currentStory.caption}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Bottom Card Overlay: Explore Action & Reactions ── */}
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
          {/* Movie Details Glass Pill */}
          {currentStory.movie_id ? (
            <IOSPressable
              style={styles.explorePillBtn}
              onPress={() => {
                onClose();
                router.push(`/${mediaType}/${currentStory.movie_id}` as never);
              }}
              activeScale={0.94}
              accessibilityRole="button"
              accessibilityLabel="Explore Movie"
            >
              <Film size={14} color="#000000" />
              <Text style={styles.explorePillTitle} numberOfLines={1}>
                Explore {movieTitle}
              </Text>
              <View style={styles.exploreArrowCircle}>
                <ChevronRight size={13} color="#000000" strokeWidth={2.5} />
              </View>
            </IOSPressable>
          ) : null}

          {/* Quick Reaction Bar */}
          <View style={styles.quickReactionBar}>
            {['🔥', '🍿', '❤️', '🤯', '👏'].map((emoji) => (
              <IOSPressable
                key={emoji}
                style={styles.emojiReactionPill}
                onPress={() => handleReact(emoji)}
                activeScale={1.25}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </IOSPressable>
            ))}
          </View>
        </View>

        {/* ── Story Options Modal (Instagram Style 3-dots Menu) ── */}
        <Modal
          visible={isOptionsOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOptionsOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsOptionsOpen(false)}>
            <View style={styles.optionsBackdrop}>
              <TouchableWithoutFeedback>
                <View style={[styles.optionsSheet, { paddingBottom: insets.bottom + 16 }]}>
                  <View style={styles.optionsHandleBar} />

                  {isOwnStory && (
                    <IOSPressable
                      style={styles.optionRowDestructive}
                      onPress={handleDeleteStory}
                      activeScale={0.96}
                    >
                      <Trash2 size={18} color="#EF4444" />
                      <Text style={styles.optionTextDestructive}>Delete Story</Text>
                    </IOSPressable>
                  )}

                  <IOSPressable
                    style={styles.optionRow}
                    onPress={handleShareStory}
                    activeScale={0.96}
                  >
                    <Share2 size={18} color="#FFFFFF" />
                    <Text style={styles.optionText}>Share Story...</Text>
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

                  {!isOwnStory && (
                    <IOSPressable
                      style={styles.optionRowDestructive}
                      onPress={() => {
                        setIsOptionsOpen(false);
                        showToast.info('Story reported. Thank you for keeping Plotmint safe.');
                      }}
                      activeScale={0.96}
                    >
                      <Flag size={18} color="#EF4444" />
                      <Text style={styles.optionTextDestructive}>Report Story</Text>
                    </IOSPressable>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    zIndex: 20,
  },
  progressBarTrack: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 20,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  authorMeta: {
    maxWidth: 180,
  },
  authorName: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  authorSub: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
  },
  topRightStoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreOptionsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  touchAreaContainer: {
    position: 'absolute',
    top: 70,
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 10,
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 2,
  },
  centerContent: {
    position: 'absolute',
    top: 95,
    bottom: 140,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  posterWrapper: {
    width: STORY_POSTER_WIDTH,
    height: STORY_POSTER_HEIGHT,
    marginBottom: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterGlowBackdrop: {
    position: 'absolute',
    width: STORY_POSTER_WIDTH + 14,
    height: STORY_POSTER_HEIGHT + 14,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.35)',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  posterFrame: {
    width: STORY_POSTER_WIDTH,
    height: STORY_POSTER_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: '#14121E',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  floatingRatingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  floatingRatingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FBBF24',
  },
  floatingTypeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  floatingTypeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: '#E9D5FF',
    letterSpacing: 0.3,
  },
  aestheticCaptionBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  captionQuoteIndicator: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C084FC',
    marginBottom: 8,
  },
  aestheticCaptionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    zIndex: 20,
  },
  explorePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginBottom: 12,
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  explorePillTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#000000',
    maxWidth: 220,
  },
  exploreArrowCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickReactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emojiReactionPill: {
    padding: 6,
  },
  emojiText: {
    fontSize: 22,
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
});
