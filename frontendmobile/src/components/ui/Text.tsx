import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography, type TypeVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  /** Type-ramp entry. Defaults to `body`. */
  variant?: TypeVariant;
  /** Overrides the variant's colour with a palette token. */
  color?: string;
  center?: boolean;
}

/**
 * The single text primitive. Every string in the app renders through this so
 * font family and line height stay consistent — React Native, unlike the web,
 * does not inherit typography from a parent element.
 */
export function Text({
  variant = 'body',
  color,
  center,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        typography[variant],
        color ? { color } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
}

/** Convenience wrappers for the two most common headings. */
export function Title(props: Omit<TextProps, 'variant'>) {
  return <Text variant="title" {...props} />;
}

export function SectionTitle(props: Omit<TextProps, 'variant'>) {
  return <Text variant="sectionTitle" {...props} />;
}

export function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" color={colors.textMuted} {...props} />;
}
