import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, screenPadding } from '@/theme';

export interface ScreenProps {
  children: React.ReactNode;
  /**
   * Which safe-area edges to inset. Screens inside the tab navigator should
   * omit `bottom` — the tab bar already occupies it.
   */
  edges?: readonly Edge[];
  /** Applies the standard horizontal page padding (`.container` on web). */
  padded?: boolean;
  style?: ViewStyle;
}

/**
 * Root wrapper for every screen: paints the app background and handles notches,
 * the Android navigation bar and the iOS home indicator.
 *
 * The web app's fixed ambient radial glow is deliberately not reproduced as a
 * per-screen layer — a full-bleed gradient behind every scroll view costs a
 * composite pass on every frame. It is painted once in the root layout instead.
 */
export function Screen({
  children,
  edges = ['top'],
  padded = false,
  style,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={[styles.content, padded && styles.padded, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: screenPadding,
  },
});
