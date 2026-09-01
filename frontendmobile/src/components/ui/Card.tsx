import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

export interface CardProps extends ViewProps {
  /** `flat` drops the shadow — use inside lists, where elevation is noise. */
  elevation?: 'flat' | 'raised';
  padded?: boolean;
}

/** Surface container mirroring `.card` in globals.css. */
export function Card({
  elevation = 'flat',
  padded = true,
  style,
  ...rest
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevation === 'raised' && shadows.card,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});
