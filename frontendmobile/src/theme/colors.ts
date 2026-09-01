/**
 * Design tokens ported verbatim from `frontend/app/globals.css`.
 * The web app is dark-only — there is no light palette to mirror.
 */

export const colors = {
  // Surfaces
  bg: '#0F0F0F',
  surface: '#1A1A1A',
  surface2: '#242424',
  surface3: '#2E2E2E',
  /** MovieCard poster ground (`.mc-root` background-color) */
  posterBg: '#09090B',

  // iOS Semantic Dark Surfaces
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',
  systemGroupedBackground: '#0F0F10',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemGroupedBackground: '#2C2C2E',

  // iOS Semantic Dark Labels
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.60)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.30)',
  quaternaryLabel: 'rgba(235, 235, 245, 0.18)',

  // iOS System Fills & Separators
  systemFill: 'rgba(120, 120, 128, 0.36)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.32)',
  tertiarySystemFill: 'rgba(118, 118, 128, 0.24)',
  quaternarySystemFill: 'rgba(118, 118, 128, 0.18)',
  separator: 'rgba(84, 84, 88, 0.65)',
  opaqueSeparator: '#38383A',

  // Liquid Glass Material Tokens
  glassBg: 'rgba(28, 26, 34, 0.82)',
  glassBgLight: 'rgba(40, 38, 48, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.14)',
  glassBorderLight: 'rgba(255, 255, 255, 0.22)',
  glassSpecular: 'rgba(255, 255, 255, 0.35)',

  // Brand
  primary: '#E50914',
  primaryHover: '#FF1A24',
  primaryGlow: 'rgba(229, 9, 20, 0.3)',
  primarySoft: 'rgba(229, 9, 20, 0.12)',
  primarySoftBorder: 'rgba(229, 9, 20, 0.25)',

  // Text
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  textDim: '#6B7280',

  // Lines & fills
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.2)',
  input: 'rgba(255, 255, 255, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.75)',
  scrim: 'rgba(0, 0, 0, 0.6)',

  // Semantic
  gold: '#FFC107',
  goldSoft: 'rgba(255, 193, 7, 0.15)',
  /** Rating chips on cards use the brighter amber (`.mc-mobile-rating`) */
  amber: '#FBBF24',
  destructive: '#EF4444',
  success: '#10B981',
  info: '#3B82F6',
  warning: '#F59E0B',
  violet: '#8B5CF6',
  pink: '#EC4899',
  rose: '#F43F5E',

  // Debate stance gradients (`.stance-agree` / `.stance-disagree`)
  agree: ['#10B981', '#059669'] as const,
  disagree: ['#EF4444', '#DC2626'] as const,

  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * The universal ambient glow behind every screen. On web this is a single
 * radial-gradient; natively it is expressed as a top-anchored linear gradient
 * with the same three stops.
 */
export const ambientGlow = {
  colors: ['#3B2355', '#150E1B', colors.bg] as const,
  locations: [0, 0.45, 0.8] as const,
} as const;

export type ColorToken = keyof typeof colors;
