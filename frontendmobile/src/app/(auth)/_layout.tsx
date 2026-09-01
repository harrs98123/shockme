import { Stack } from 'expo-router';

import { colors } from '@/theme';

/**
 * Auth stack. Headerless because each screen draws its own back control inside
 * `AuthScreen`, matching the web app hiding the navbar on `/login` and
 * `/register` (`NavbarWrapper`'s `hideChrome`).
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
