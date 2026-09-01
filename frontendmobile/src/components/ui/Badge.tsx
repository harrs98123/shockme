import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';

import { colors, radius, spacing } from '@/theme';

import { Text } from './Text';

// ─── Pill ────────────────────────────────────────────────────────────────────

export type PillTone = 'primary' | 'neutral' | 'success' | 'info' | 'warning';

export interface PillProps {
  label: string;
  tone?: PillTone;
  style?: ViewStyle;
}

/** Rounded chip mirroring `.genre-pill`. Used for genres, filters and tags. */
export function Pill({ label, tone = 'primary', style }: PillProps) {
  const palette = PILL_TONES[tone];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      <Text variant="micro" color={palette.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const PILL_TONES: Record<PillTone, { bg: string; border: string; text: string }> = {
  primary: {
    bg: colors.primarySoft,
    border: colors.primarySoftBorder,
    text: colors.primary,
  },
  neutral: {
    bg: 'rgba(255,255,255,0.08)',
    border: colors.border,
    text: colors.textMuted,
  },
  success: {
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
    text: colors.success,
  },
  info: {
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.25)',
    text: colors.info,
  },
  warning: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    text: colors.warning,
  },
};

// ─── Rating badge ────────────────────────────────────────────────────────────

export interface RatingBadgeProps {
  /** TMDB `vote_average`. Renders nothing when absent or zero. */
  rating?: number | null;
  /** `solid` is the amber chip on posters; `soft` is the tinted inline badge. */
  appearance?: 'solid' | 'soft';
  showIcon?: boolean;
  style?: ViewStyle;
}

/** Mirrors `.rating-badge` (soft) and `.mc-mobile-rating` (solid). */
export function RatingBadge({
  rating,
  appearance = 'solid',
  showIcon = false,
  style,
}: RatingBadgeProps) {
  if (typeof rating !== 'number' || rating <= 0) return null;

  const solid = appearance === 'solid';
  return (
    <View
      style={[
        styles.rating,
        solid ? styles.ratingSolid : styles.ratingSoft,
        style,
      ]}
    >
      {showIcon ? (
        <Star size={11} color={solid ? colors.black : colors.gold} fill={solid ? colors.black : colors.gold} />
      ) : null}
      <Text variant="micro" color={solid ? colors.black : colors.gold}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  ratingSolid: {
    backgroundColor: colors.amber,
  },
  ratingSoft: {
    backgroundColor: colors.goldSoft,
  },
});
