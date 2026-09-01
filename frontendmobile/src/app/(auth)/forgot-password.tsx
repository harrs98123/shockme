import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Check, KeyRound, Lock, Mail } from 'lucide-react-native';

import { authApi } from '@/api/auth';
import { AuthScreen, FormError } from '@/components/auth/AuthScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { IOSPressable } from '@/components/ios/IOSPressable';
import {
  emailSchema,
  passwordRules,
  resetSchema,
  type EmailForm,
  type ResetForm,
} from '@/lib/validation';
import { colors, spacing } from '@/theme';

/**
 * Password reset, matching the web app's four-step flow in
 * `app/(auth)/forgot-password/page.tsx`. The web app also has a separate
 * `/verify` route; on mobile the code step lives inside this flow, because a
 * standalone verify screen has no entry point without an email deep link.
 */
type Step = 'request' | 'verify' | 'reset' | 'success';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: '', password: '', confirmPassword: '' },
  });

  const requestCode = emailForm.handleSubmit(async (values) => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.forgotPassword(values.email.trim());
      setEmail(values.email.trim());
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code. Try again.');
    } finally {
      setSubmitting(false);
    }
  });

  const verifyCode = async () => {
    setError('');
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.verifyCode(email, code.trim());
      resetForm.setValue('code', code.trim());
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired verification code');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReset = resetForm.handleSubmit(async (values) => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.resetPassword(email, values.code.trim(), values.password);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password');
    } finally {
      setSubmitting(false);
    }
  });

  const password = useWatch({ control: resetForm.control, name: 'password' });

  const copy: Record<Step, { title: string; subtitle: string }> = {
    request: {
      title: 'Reset your password',
      subtitle: "Enter your email and we'll send you a 6-digit code.",
    },
    verify: {
      title: 'Check your email',
      subtitle: `We sent a 6-digit code to ${email}. It expires in 10 minutes.`,
    },
    reset: { title: 'Choose a new password', subtitle: 'Pick something you haven’t used before.' },
    success: { title: 'Password updated', subtitle: 'You can now sign in with your new password.' },
  };

  return (
    <AuthScreen
      title={copy[step].title}
      subtitle={copy[step].subtitle}
      onBack={() => {
        if (step === 'verify') setStep('request');
        else if (step === 'reset') setStep('verify');
        else router.replace('/(auth)/login');
      }}
    >
      {error ? <FormError message={error} /> : null}

      {step === 'request' ? (
        <>
          <Controller
            control={emailForm.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={emailForm.formState.errors.email?.message}
                icon={<Mail size={16} color={colors.textDim} />}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="go"
                onSubmitEditing={requestCode}
              />
            )}
          />
          <Button label="Send code" onPress={requestCode} loading={submitting} fullWidth />
        </>
      ) : null}

      {step === 'verify' ? (
        <>
          <Input
            label="Verification code"
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            icon={<KeyRound size={16} color={colors.textDim} />}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            returnKeyType="go"
            onSubmitEditing={verifyCode}
          />
          <Button label="Verify code" onPress={verifyCode} loading={submitting} fullWidth />
          <IOSPressable onPress={requestCode} hitSlop={8} activeScale={0.96} style={styles.centerLink}>
            <Text variant="caption" color={colors.textMuted}>
              Didn&apos;t get it? Send another code
            </Text>
          </IOSPressable>
        </>
      ) : null}

      {step === 'reset' ? (
        <>
          <Controller
            control={resetForm.control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New password"
                placeholder="Create a new password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={resetForm.formState.errors.password?.message}
                icon={<Lock size={16} color={colors.textDim} />}
                password
                autoCapitalize="none"
                autoComplete="password-new"
              />
            )}
          />

          {password.length > 0 ? (
            <View style={styles.rules}>
              {passwordRules.map((rule) => {
                const passed = rule.test(password);
                return (
                  <Text
                    key={rule.key}
                    variant="micro"
                    color={passed ? colors.success : colors.textDim}
                  >
                    {passed ? '✓' : '○'}  {rule.label}
                  </Text>
                );
              })}
            </View>
          ) : null}

          <Controller
            control={resetForm.control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm password"
                placeholder="Re-enter your new password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={resetForm.formState.errors.confirmPassword?.message}
                icon={<Lock size={16} color={colors.textDim} />}
                password
                autoCapitalize="none"
                returnKeyType="go"
                onSubmitEditing={submitReset}
              />
            )}
          />

          <Button label="Update password" onPress={submitReset} loading={submitting} fullWidth />
        </>
      ) : null}

      {step === 'success' ? (
        <View style={styles.success}>
          <Check size={40} color={colors.success} />
          <Button
            label="Back to sign in"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
          />
        </View>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  centerLink: {
    alignItems: 'center',
  },
  rules: {
    gap: spacing.xs,
    marginTop: -spacing.sm,
    paddingLeft: spacing.xs,
  },
  success: {
    alignItems: 'center',
    gap: spacing.xl,
  },
});

