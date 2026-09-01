import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/ui/Text';
import { PlotmintLogo } from '@/components/ui/PlotmintLogo';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { colors, fonts, radius, screenPadding, spacing } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Shows a back chevron. Omit on the entry screen of the auth stack. */
  onBack?: () => void;
  footer?: React.ReactNode;
}

export function AuthScreen({ title, subtitle, children, onBack, footer }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.safe}>
      {/* Ambient Top Violet Radial Glow */}
      <LinearGradient
        colors={['rgba(139,92,246,0.22)', 'rgba(99,102,241,0.08)', 'transparent']}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      {/* Top Safe Navigation Bar (Properly clears the iOS notch and clock) */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {onBack ? (
          <IOSPressable
            onPress={onBack}
            activeScale={0.88}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
          </IOSPressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, 20) + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.centerContainer}>
            {/* Single Brand Logo & Header */}
            <View style={styles.header}>
              {/* Only ONE Logo Component */}
              <View style={styles.brandLogoWrap}>
                <PlotmintLogo size={28} />
              </View>

              {/* Properly Spaced & Unclipped Screen Title */}
              <Text style={styles.titleText}>{title}</Text>
              {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
            </View>

            {/* Glass Form Container */}
            <View style={styles.formCard}>
              <View style={styles.body}>{children}</View>
            </View>

            {/* Footer Navigation */}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Inline error banner with dark red glass panel */
export function FormError({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.errorText}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: screenPadding,
    paddingBottom: 4,
    zIndex: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 38,
    height: 38,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
    paddingTop: 4,
  },
  centerContainer: {
    width: '100%',
    paddingVertical: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandLogoWrap: {
    marginBottom: 12,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: fonts.heading,
    fontSize: 24,
    lineHeight: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitleText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#121118',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  body: {
    gap: 14,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: '#F87171',
    textAlign: 'center',
  },
});
