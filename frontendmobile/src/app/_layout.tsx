import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
// Imported by subpath, not from the package root: the root re-exports every
// weight and italic, and Metro would bundle ~2MB of faces the app never uses.
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins/800ExtraBold';
import { Inter_300Light } from '@expo-google-fonts/inter/300Light';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';

import { ToastHost } from '@/components/ui/ToastHost';
import { maybeRefreshSession } from '@/api/client';
import { queryClient } from '@/lib/query-client';
import { useSessionSync } from '@/hooks/useSessionSync';
import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/theme';
import { AmbientGlow } from '@/components/layout/AmbientGlow';
import { AppSplashScreen } from '@/components/layout/AppSplashScreen';
import { NoInternetOverlay } from '@/components/common/NoInternetOverlay';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Paints the window background before the first frame, so a cold start does not
// flash white behind the splash on Android.
SystemUI.setBackgroundColorAsync(colors.bg);

export default function RootLayout() {
  const restore = useAuthStore((s) => s.restore);
  const authStatus = useAuthStore((s) => s.status);
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Read persisted tokens once, before anything renders that depends on them.
  useEffect(() => {
    restore();
  }, [restore]);

  // Keep the 30-day session rolling: rotate the token on cold start and every
  // time the app comes back to the foreground, before it can lapse into a
  // user-visible logout. Runs after `restore()` has populated the store.
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    if (authStatus === 'authenticated') {
      maybeRefreshSession();
    }
  }, [authStatus]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const cameToForeground =
        appState.current.match(/inactive|background/) && next === 'active';
      appState.current = next;
      if (cameToForeground) maybeRefreshSession();
    });
    return () => sub.remove();
  }, []);

  // Hold the splash briefly so a fast cold start doesn't flash the UI in and
  // straight back out. 500ms is long enough to read as intentional without
  // adding avoidable startup latency.
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinSplashElapsed(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const ready = (fontsLoaded || fontError != null) && authStatus !== 'loading';
  const isAppReady = ready && minSplashElapsed;

  // Release native splash as soon as React component mounts to let animated splash take over
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppSplashScreen isReady={isAppReady}>
            <View style={styles.root}>
              {/* Purple ambient glow from the corner — matches the web app */}
              <AmbientGlow />
              <StatusBar style="light" />
              <SessionSync />
              {/*
                Screens are inferred from the filesystem. Declaring a
                <Stack.Screen> for a route group that does not exist yet makes
                Expo Router warn that it is extraneous, so per-group options are
                added here as each group lands — `(auth)` arrives in Phase 1.
              */}
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg },
                  animation: 'default',
                  gestureEnabled: true,
                  fullScreenGestureEnabled: false,
                  orientation: 'portrait',
                }}
              />
              <ToastHost />
              <NoInternetOverlay />
            </View>
          </AppSplashScreen>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});

/**
 * Revalidates a restored session against `/auth/me`. It lives in a child of
 * QueryClientProvider because the hook it wraps uses React Query.
 */
function SessionSync() {
  useSessionSync();
  return null;
}
