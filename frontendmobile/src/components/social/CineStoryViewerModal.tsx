import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Star,
  Film,
  ChevronRight,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import type { UserStoryGroup, Story } from '@/api/stories';
import { storiesApi } from '@/api/stories';
import { colors, fonts, radius, spacing } from '@/theme';
import { backdropUrl, posterUrl } from '@/lib/images';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import showToast from '@/lib/toast';

const STORY_DURATION_MS = 6000;

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
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (visible) {
      setUserIndex(Math.min(initialUserIndex, Math.max(0, userGroups.length - 1)));
      setStoryIndex(0);
    }
  }, [visible, initialUserIndex, userGroups.length]);

  const currentGroup = userGroups[userIndex] || userGroups[0];
  const stories = currentGroup?.stories || [];
  const currentStory = stories[storyIndex] || stories[0];

  const progress = useSharedValue(0);

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
    if (!visible || !currentStory || isPaused) return;

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
  }, [visible, userIndex, storyIndex, isPaused, currentStory]);

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

  const bgImage =
    backdropUrl(currentStory.movie_backdrop, 'w1280') ||
    posterUrl(currentStory.movie_poster, 'w780');

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
        {/* Real TMDB Backdrop / Poster Image (No stock photos) */}
        {bgImage ? (
          <Image
            source={{ uri: bgImage }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            priority="high"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#101015' }]} />
        )}

        {/* Ambient Dark Gradients */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.85)',
            'rgba(0,0,0,0.2)',
            'rgba(0,0,0,0.4)',
            'rgba(0,0,0,0.92)',
          ]}
          locations={[0, 0.25, 0.6, 1]}
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
                {currentStory.story_type?.toUpperCase() || 'FILM PULSE'} • 24h
              </Text>
            </View>
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

        {/* Tap navigation zones */}
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

        {/* Bottom Film Card Overlay */}
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 20 }]}>
          {/* Caption */}
          {currentStory.caption ? (
            <View style={styles.captionBox}>
              <Text style={styles.captionText}>{currentStory.caption}</Text>
            </View>
          ) : null}

          {/* Movie Details Glass Card */}
          {currentStory.movie_title && (
            <View style={styles.movieGlassCard}>
              <View style={styles.movieInfoLeft}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {movieTitle}
                </Text>
                {currentStory.rating ? (
                  <View style={styles.ratingBadge}>
                    <Star size={11} color="#FFC107" fill="#FFC107" />
                    <Text style={styles.ratingText}>{currentStory.rating}/5</Text>
                  </View>
                ) : null}
              </View>

              {currentStory.movie_id ? (
                <IOSPressable
                  style={styles.viewMovieBtn}
                  onPress={() => {
                    onClose();
                    router.push(`/${mediaType}/${currentStory.movie_id}` as never);
                  }}
                  activeScale={0.92}
                  accessibilityRole="button"
                  accessibilityLabel="View Movie Details"
                >
                  <Text style={styles.viewMovieBtnText}>Explore</Text>
                  <ChevronRight size={14} color="#000000" />
                </IOSPressable>
              ) : null}
            </View>
          )}

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
    backgroundColor: 'rgba(0,0,0,0.45)',
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
    flex: 1,
    flexDirection: 'row',
    zIndex: 10,
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 2,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    zIndex: 20,
  },
  captionBox: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  captionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 19,
  },
  movieGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20,20,25,0.75)',
    borderRadius: radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 14,
  },
  movieInfoLeft: {
    flex: 1,
    marginRight: 12,
  },
  movieTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,193,7,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFC107',
  },
  viewMovieBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  viewMovieBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#000000',
  },
  quickReactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emojiReactionPill: {
    padding: 6,
  },
  emojiText: {
    fontSize: 22,
  },
});
