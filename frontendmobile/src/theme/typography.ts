import type { TextStyle } from 'react-native';

import { colors } from './colors';

/**
 * Font families matching `frontend/app/layout.tsx`:
 * Poppins for headings and buttons, Inter for body copy.
 * These names are the keys passed to `useFonts` in the root layout.
 */
export const fonts = {
  heading: 'Poppins_700Bold',
  headingSemi: 'Poppins_600SemiBold',
  headingBlack: 'Poppins_800ExtraBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyLight: 'Inter_300Light',
} as const;

export type TypeVariant =
  // Existing tokens
  | 'display'
  | 'title'
  | 'sectionTitle'
  | 'cardTitle'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'button'
  | 'micro'
  // iOS Apple HIG tokens
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'subheadline'
  | 'callout'
  | 'footnote'
  | 'caption1'
  | 'caption2';

/**
 * Type ramp. Web headings use `line-height: 1.2`; body copy sits around 1.5.
 * Extended with standard iOS typography metrics for native feel.
 */
export const typography: Record<TypeVariant, TextStyle> = {
  // Existing tokens
  display: {
    fontFamily: fonts.headingBlack,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: colors.text,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.3,
    color: colors.text,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: -0.2,
    color: colors.text,
  },
  cardTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  bodyStrong: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  button: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  micro: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textDim,
  },

  // Apple HIG Tokens
  largeTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: 0.37,
    color: colors.label,
  },
  title1: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.36,
    color: colors.label,
  },
  title2: {
    fontFamily: fonts.headingSemi,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.35,
    color: colors.label,
  },
  title3: {
    fontFamily: fonts.headingSemi,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0.38,
    color: colors.label,
  },
  headline: {
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: colors.label,
  },
  subheadline: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: colors.secondaryLabel,
  },
  callout: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
    color: colors.label,
  },
  footnote: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.08,
    color: colors.secondaryLabel,
  },
  caption1: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.secondaryLabel,
  },
  caption2: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.07,
    color: colors.tertiaryLabel,
  },
};
