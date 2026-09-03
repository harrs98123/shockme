import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';

import { colors } from '@/theme';
import { env } from '@/config/env';

/**
 * App-wide fallback for render-time crashes.
 *
 * Expo Router picks this up automatically because `src/app/_layout.tsx`
 * re-exports it as `ErrorBoundary`. Without it, a thrown error in any screen
 * unmounts the whole tree and the user sees a frozen/blank window — exactly the
 * "opens then crashes" symptom on a release build. Here they get a readable
 * message and a way back in instead.
 *
 * In `__DEV__` the raw error and stack are shown; in production only a short
 * message, to avoid leaking internals.
 */
export function RootErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Something broke</Text>
        <Text style={styles.body}>
          The app hit an unexpected error. You can try again — if it keeps
          happening, reopen the app.
        </Text>

        {env.isDev ? (
          <View style={styles.debugBox}>
            <Text style={styles.debugLabel}>{error.name}</Text>
            <Text style={styles.debugText}>{error.message}</Text>
            {error.stack ? (
              <Text style={styles.debugStack}>{error.stack}</Text>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={retry} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  debugBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  debugLabel: {
    color: colors.destructive,
    fontSize: 13,
    fontWeight: '700',
  },
  debugText: {
    color: colors.text,
    fontSize: 13,
  },
  debugStack: {
    color: colors.textDim,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
