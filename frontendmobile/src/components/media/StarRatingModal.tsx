import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Star, X } from 'lucide-react-native';

import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import showToast from '@/lib/toast';

interface Props {
  visible: boolean;
  onClose: () => void;
  movieId: number | string;
  mediaType?: 'movie' | 'tv';
  title: string;
  initialRating?: number | null;
  onRated?: (rating: number) => void;
}

export function StarRatingModal({
  visible,
  onClose,
  movieId,
  mediaType = 'movie',
  title,
  initialRating = null,
  onRated,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const [selectedStars, setSelectedStars] = useState<number>(initialRating ?? 8);
  const [submitting, setSubmitting] = useState(false);

  const handleRatingSubmit = async () => {
    if (!user) {
      showToast.error('Please log in to rate movies.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/ratings', {
        movie_id: Number(movieId),
        media_type: mediaType,
        rating: selectedStars,
      });
      showToast.success(`Rated "${title}" ${selectedStars}/10 ⭐`);
      onRated?.(selectedStars);
      onClose();
    } catch {
      showToast.error('Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.heading}>Rate Movie</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.movieName} numberOfLines={1}>
            {title}
          </Text>

          {/* Rating Score Large Display */}
          <View style={styles.scoreRow}>
            <Star size={26} color="#FFC107" fill="#FFC107" />
            <Text style={styles.scoreNumber}>{selectedStars}</Text>
            <Text style={styles.scoreMax}>/10</Text>
          </View>

          {/* 10-Star Tap Row */}
          <View style={styles.starsContainer}>
            {Array.from({ length: 10 }).map((_, i) => {
              const starValue = i + 1;
              const isFilled = starValue <= selectedStars;
              return (
                <Pressable
                  key={starValue}
                  onPress={() => setSelectedStars(starValue)}
                  hitSlop={4}
                  style={styles.starTouch}
                >
                  <Star
                    size={22}
                    color={isFilled ? '#FFC107' : 'rgba(255,255,255,0.2)'}
                    fill={isFilled ? '#FFC107' : 'transparent'}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Submit Button */}
          <IOSPressable
            style={styles.submitBtn}
            onPress={handleRatingSubmit}
            disabled={submitting}
            activeScale={0.96}
          >
            {submitting ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text style={styles.submitText}>Save Rating</Text>
            )}
          </IOSPressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
  },
  movieName: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4,
  },
  scoreNumber: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 36,
  },
  scoreMax: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 6,
  },
  starTouch: {
    padding: 2,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitText: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#000000',
  },
});
