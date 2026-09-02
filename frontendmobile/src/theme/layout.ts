import { Platform } from 'react-native';

/**
 * Spacing scale. The web app spaces on a 4px grid (Tailwind defaults plus a
 * handful of hand-tuned values); these are the sizes it actually uses.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
} as const;

/** `--radius: 0.625rem` (10px) and `--radius-lg: 20px`, plus the card radii. */
export const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  pill: 999,
} as const;

/** `--shadow-card` and `--shadow-glow`, translated to RN shadow props. */
export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' },
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    default: { elevation: 6 },
  }),
  poster: Platform.select({
    web: { boxShadow: '0 10px 15px rgba(0, 0, 0, 0.5)' },
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
    },
    default: { elevation: 8 },
  }),
  glow: Platform.select({
    web: { boxShadow: '0 0 15px rgba(229, 9, 20, 0.45)' },
    ios: {
      shadowColor: '#E50914',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 15,
    },
    default: { elevation: 10 },
  }),
  none: Platform.select({
    web: { boxShadow: 'none' },
    ios: { shadowOpacity: 0 },
    default: { elevation: 0 },
  }),
} as const;

/**
 * Cross-platform textShadow helper avoiding React Native Web deprecation warnings.
 */
export function createTextShadow(color: string, offsetX = 0, offsetY = 1, radius = 3) {
  return Platform.select({
    web: { textShadow: `${offsetX}px ${offsetY}px ${radius}px ${color}` },
    default: {
      textShadowColor: color,
      textShadowOffset: { width: offsetX, height: offsetY },
      textShadowRadius: radius,
    },
  });
}

/**
 * Poster sizing. The web card is 135×202 on small phones and 148×222 from the
 * 400px breakpoint (`.mc-root` media queries). Posters are a 2:3 aspect ratio,
 * so height is always derived rather than hardcoded.
 */
export const POSTER_ASPECT = 2 / 3;

export const posterSize = {
  sm: 120,
  md: 135,
  lg: 148,
} as const;

/** Horizontal page padding — `.container` is 14px, widening to 24px at 640px. */
export const screenPadding = spacing.lg;

/** Minimum tappable area; every Pressable should meet this. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH_TARGET = 44;

/**
 * Reanimated Spring Physics Presets tailored to Apple Human Interface Guidelines.
 */
export const springPresets = {
  /** Responsive tap down and release on buttons and cards */
  snappy: {
    damping: 18,
    stiffness: 280,
    mass: 0.8,
  },
  /** Smooth interactive gesture tracking (e.g. swipe to dismiss, sheets) */
  interactive: {
    damping: 24,
    stiffness: 300,
    mass: 1,
  },
  /** Gentle modal slide and expanding items */
  gentle: {
    damping: 26,
    stiffness: 220,
    mass: 1,
  },
  /** Delightful micro-interaction bouncy feedback */
  bouncy: {
    damping: 12,
    stiffness: 240,
    mass: 0.7,
  },
} as const;
