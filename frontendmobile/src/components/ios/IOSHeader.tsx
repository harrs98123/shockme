import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { colors, fonts, spacing } from '@/theme';
import { IOSPressable } from './IOSPressable';

export interface IOSHeaderProps {
  title?: string;
  subtitle?: string;
  largeTitle?: boolean;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  translucent?: boolean;
}

/**
 * Standard iOS Navigation Header bar.
 * Matches Apple HIG metrics, status bar insets, and spring back button behavior.
 */
export function IOSHeader({
  title,
  subtitle,
  largeTitle = false,
  onBack,
  showBack = true,
  rightAction,
  style,
  translucent = false,
}: IOSHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + (translucent ? 4 : 8) },
        translucent && styles.translucentRoot,
        style,
      ]}
    >
      <View style={styles.navRow}>
        {/* Left Back / Cancel Button */}
        <View style={styles.leftBox}>
          {showBack ? (
            <IOSPressable
              style={styles.backBtn}
              onPress={handleBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.4} />
            </IOSPressable>
          ) : null}
        </View>

        {/* Center Title (when not largeTitle) */}
        {!largeTitle && title ? (
          <View style={styles.centerBox}>
            <Text style={styles.inlineTitle} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.inlineSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.centerSpacer} />
        )}

        {/* Right Action */}
        <View style={styles.rightBox}>{rightAction}</View>
      </View>

      {/* Large Title layout */}
      {largeTitle && title ? (
        <View style={styles.largeTitleBox}>
          <Text style={styles.largeTitleText}>{title}</Text>
          {subtitle ? (
            <Text style={styles.largeSubtitleText}>{subtitle}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 50,
  },
  translucentRoot: {
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftBox: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  centerSpacer: {
    flex: 1,
  },
  inlineTitle: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  inlineSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondaryLabel,
    marginTop: 1,
    textAlign: 'center',
  },
  rightBox: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  largeTitleBox: {
    marginTop: 12,
    paddingBottom: 4,
  },
  largeTitleText: {
    fontFamily: fonts.headingBlack,
    fontSize: 30,
    lineHeight: 36,
    color: '#FFFFFF',
    letterSpacing: 0.35,
  },
  largeSubtitleText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
});
