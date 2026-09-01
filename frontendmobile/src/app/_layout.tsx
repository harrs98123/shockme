import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { queryClient } from '@/lib/query-client';
import { useSessionSync } from '@/hooks/useSessionSync';
import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/theme';
import { AmbientGlow } from '@/components/layout/AmbientGlow';

SplashScreen.preventAutoHideAsync();

// Paints the window background before the first frame, so a cold start does not
// flash white behind the splash on Android.
SystemUI.setBackgroundColorAsync(colors.bg);

export default function RootLayout() {
  const restore = useAuthStore((s) => s.restore);
  const authStatus = useAuthStore((s) => s.status);

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

  // Hold the splash until fonts and the stored session are both settled — that
  // avoids a flash of fallback type and a flash of the logged-out UI.
  // A font *error* still releases it: shipping system type beats a stuck splash.
  const ready = (fontsLoaded || fontError != null) && authStatus !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
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
                fullScreenGestureEnabled: true,
                orientation: 'portrait',
              }}
            />
            <ToastHost />
          </View>
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
