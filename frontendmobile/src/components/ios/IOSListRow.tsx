import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from './IOSPressable';

export interface IOSListRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  onPress?: () => void;
  rightAccessory?: React.ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * iOS Inset Grouped list row component.
 */
export function IOSListRow({
  title,
  subtitle,
  icon,
  iconBg = 'rgba(255, 255, 255, 0.08)',
  onPress,
  rightAccessory,
  showChevron = true,
  destructive = false,
  disabled = false,
  style,
  isFirst = false,
  isLast = false,
}: IOSListRowProps) {
  return (
    <IOSPressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[
        styles.row,
        isFirst && styles.firstRow,
        isLast && styles.lastRow,
        !isLast && styles.bordered,
        style,
      ]}
    >
      {/* Leading Icon */}
      {icon ? (
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          {icon}
        </View>
      ) : null}

      {/* Main Content */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            destructive && styles.destructiveText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right Content */}
      {rightAccessory ? (
        <View style={styles.rightAccessory}>{rightAccessory}</View>
      ) : null}

      {/* Chevron */}
      {showChevron && onPress ? (
        <ChevronRight size={18} color={colors.textDim} style={styles.chevron} />
      ) : null}
    </IOSPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.surface,
    minHeight: 52,
  },
  firstRow: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  lastRow: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  bordered: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  destructiveText: {
    color: colors.destructive,
  },
  disabledText: {
    color: colors.textDim,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondaryLabel,
    marginTop: 1,
  },
  rightAccessory: {
    marginLeft: 8,
  },
  chevron: {
    marginLeft: 6,
    opacity: 0.6,
  },
});
