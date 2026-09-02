import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Check,
  Info,
  Loader2,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { toastManager, type ToastItem, type ToastType } from '@/lib/toast';
import { colors, fonts, radius } from '@/theme';

const ICONS: Record<ToastType, LucideIcon | null> = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
  default: null,
};

const ACCENTS: Record<ToastType, string> = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  loading: '#A1A1AA',
  default: '#A1A1AA',
};

/**
 * Minimal dynamic-island style floating toast pill.
 * Compact, unobtrusive, and beautifully aligned for mobile.
 */
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => toastManager.subscribe(setToasts), []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((item) =>
      setTimeout(() => toastManager.dismiss(item.id), item.duration ?? 2500)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  if (toasts.length === 0) return null;

  // Show only the latest toast in a clean minimal pill
  const activeToast = toasts[0];
  const type = activeToast.type ?? 'default';
  const Icon = ICONS[type];
  const accent = ACCENTS[type];
  const message = activeToast.title || activeToast.description || '';

  return (
    <View
      style={[styles.host, { top: insets.top + 8, pointerEvents: 'box-none' }]}
    >
      <Animated.View
        key={activeToast.id}
        entering={FadeInUp.duration(180).springify().damping(18)}
        exiting={FadeOutUp.duration(140)}
        layout={LinearTransition.duration(150)}
        style={styles.toastCapsule}
      >
        <Pressable
          onPress={() => toastManager.dismiss(activeToast.id)}
          style={styles.pressable}
          accessibilityRole="alert"
          accessibilityLabel={message}
        >
          {Icon ? (
            <View style={[styles.iconCircle, { backgroundColor: `${accent}25` }]}>
              <Icon size={11} color={accent} strokeWidth={3} />
            </View>
          ) : (
            <View style={[styles.dot, { backgroundColor: accent }]} />
          )}

          <Text style={styles.toastText} numberOfLines={1} ellipsizeMode="tail">
            {message}
          </Text>

          {activeToast.action ? (
            <Pressable
              onPress={() => {
                activeToast.action?.onClick();
                toastManager.dismiss(activeToast.id);
              }}
              hitSlop={6}
              style={styles.actionBtn}
            >
              <Text style={styles.actionText}>
                {activeToast.action.label}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastCapsule: {
    maxWidth: '88%',
    backgroundColor: 'rgba(18, 18, 24, 0.94)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toastText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  actionBtn: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.primary,
  },
});
