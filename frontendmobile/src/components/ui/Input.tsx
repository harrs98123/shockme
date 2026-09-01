import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Eye, EyeOff, X } from 'lucide-react-native';

import { colors, fonts, MIN_TOUCH_TARGET, radius, spacing, typography } from '@/theme';

import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Validation message. Renders below the field and reddens the border. */
  error?: string;
  /** Helper text shown when there is no error. */
  hint?: string;
  /** Rendered inside the field, before the text — pass a lucide icon element. */
  icon?: React.ReactNode;
  /** Adds a show/hide toggle and forces `secureTextEntry`. */
  password?: boolean;
  /** Shows an iOS-style clear button when text is present. */
  clearable?: boolean;
  containerStyle?: ViewStyle;
}

/**
 * Text field mirroring iOS design guidelines with dark appearance.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, icon, password = false, clearable = false, containerStyle, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const hasValue = Boolean(rest.value && rest.value.length > 0);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}

        <TextInput
          ref={ref}
          {...rest}
          style={[typography.bodyStrong, styles.input]}
          placeholderTextColor={colors.textDim}
          selectionColor={colors.primary}
          keyboardAppearance="dark"
          secureTextEntry={password && !revealed}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          accessibilityLabel={rest.accessibilityLabel ?? label}
        />

        {clearable && hasValue && !password ? (
          <Pressable
            onPress={() => rest.onChangeText?.('')}
            hitSlop={8}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear text"
          >
            <View style={styles.clearCircle}>
              <X size={12} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          </Pressable>
        ) : null}

        {password ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            style={styles.reveal}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            {revealed ? (
              <EyeOff size={18} color={colors.textDim} />
            ) : (
              <Eye size={18} color={colors.textDim} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color={colors.destructive} style={styles.message}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color={colors.textDim} style={styles.message}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontFamily: fonts.headingSemi,
    fontSize: 11,
    letterSpacing: 0.6,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 2,
    marginBottom: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  fieldError: {
    borderColor: colors.destructive,
  },
  icon: {
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingVertical: 0,
  },
  clearBtn: {
    justifyContent: 'center',
  },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reveal: {
    justifyContent: 'center',
  },
  message: {
    marginLeft: spacing.xs,
  },
});
