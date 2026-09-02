import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { AtSign, Lock, User, Check } from 'lucide-react-native';

import { AuthScreen, FormError } from '@/components/auth/AuthScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginForm } from '@/lib/validation';
import { colors, fonts, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  /** Set when a guard bounced the user here, so we can return them after. */
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // 30-day persistent session

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { loginId: '', password: '' },
  });

  const loginId = useWatch({ control, name: 'loginId' });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('');

    setSubmitting(true);
    try {
      await login({
        login_id: values.loginId,
        password: values.password,
      });
      // `replace`, not `push` — the login screen must not stay on the back
      // stack once the session exists.
      router.replace(from ? (from as never) : '/(tabs)/profile');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Invalid identification or password'
      );
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthScreen
      title="Welcome Back"
      subtitle="Sign in to your Plotmint account"
      onBack={() => router.replace('/(tabs)')}
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Link href="/(auth)/register" replace asChild>
            <IOSPressable hitSlop={8} activeScale={0.94}>
              <Text style={styles.signupLink}>
                Sign up
              </Text>
            </IOSPressable>
          </Link>
        </View>
      }
    >
      {submitError ? <FormError message={submitError} /> : null}

      <Controller
        control={control}
        name="loginId"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Username or Email"
            placeholder="e.g. cinema_lover or you@domain.com"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.loginId?.message}
            icon={
              loginId.includes('@') ? (
                <AtSign size={16} color="#A78BFA" />
              ) : (
                <User size={16} color="#A78BFA" />
              )
            }
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Password"
            placeholder="Enter your password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            icon={<Lock size={16} color="#A78BFA" />}
            password
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        )}
      />

      {/* ── 30-Day Remember Me & Forgot Password Row ── */}
      <View style={styles.optionsRow}>
        <IOSPressable
          style={styles.rememberRow}
          onPress={() => setRememberMe(!rememberMe)}
          activeScale={0.92}
          accessibilityRole="button"
          accessibilityState={{ checked: rememberMe }}
          accessibilityLabel="Keep me signed in for 30 days"
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
            {rememberMe && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.rememberText}>Stay signed in (30 days)</Text>
        </IOSPressable>

        <Link href="/(auth)/forgot-password" asChild>
          <IOSPressable hitSlop={8} activeScale={0.94}>
            <Text style={styles.forgotText}>
              Forgot password?
            </Text>
          </IOSPressable>
        </Link>
      </View>

      <Button
        label="Sign in"
        onPress={onSubmit}
        loading={submitting}
        fullWidth
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
    marginBottom: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  forgotText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.primary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  signupLink: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: colors.primary,
  },
});
