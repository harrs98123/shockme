import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { AtSign, Check, Lock, Mail, User, X } from 'lucide-react-native';

import { authApi } from '@/api/auth';
import { AuthScreen, FormError } from '@/components/auth/AuthScreen';
import { TurnstileGate } from '@/components/auth/TurnstileGate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { passwordRules, registerSchema, type RegisterForm } from '@/lib/validation';
import { colors, fonts, radius, spacing } from '@/theme';

export default function RegisterScreen() {
  const { register } = useAuth();

  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const username = useWatch({ control, name: 'username' });
  const password = useWatch({ control, name: 'password' });

  const debouncedUsername = useDebounce(username, 450);
  const canCheck = debouncedUsername.trim().length >= 3;

  const { data: usernameCheck, isFetching: checkingUsername } = useQuery({
    queryKey: ['auth', 'check-username', debouncedUsername],
    queryFn: () => authApi.checkUsername(debouncedUsername.trim()),
    enabled: canCheck,
    retry: false,
    staleTime: 60_000,
  });

  const handleInvalidate = useCallback(() => setTurnstileToken(''), []);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('');

    if (usernameCheck?.available === false) {
      setSubmitError('Please choose an available username');
      return;
    }
    if (!turnstileToken) {
      setSubmitError('Please complete the security verification');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        turnstile_token: turnstileToken,
      });
      router.replace('/(tabs)/profile');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An error occurred during registration'
      );
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  });

  const passedRules = passwordRules.filter((r) => r.test(password || ''));
  const strengthScore = passedRules.length;

  return (
    <AuthScreen
      title="Create Account"
      subtitle="Join the next generation of cinema curation"
      onBack={() => router.replace('/(auth)/login')}
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/login" replace asChild>
            <IOSPressable hitSlop={8} activeScale={0.94}>
              <Text style={styles.loginLink}>
                Sign in
              </Text>
            </IOSPressable>
          </Link>
        </View>
      }
    >
      {submitError ? <FormError message={submitError} /> : null}

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Full Name"
            placeholder="e.g. Christopher Nolan"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
            icon={<User size={16} color="#A78BFA" />}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="name"
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Input
              label="Username"
              placeholder="e.g. cinephile"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.username?.message}
              icon={<AtSign size={16} color="#A78BFA" />}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              textContentType="username"
              returnKeyType="next"
            />

            {/* Live Username Availability Feedback */}
            {canCheck && (
              <View style={styles.usernameStatusRow}>
                {checkingUsername ? (
                  <View style={styles.statusBadge}>
                    <ActivityIndicator size="small" color="#A78BFA" />
                    <Text style={styles.statusText}>Checking username…</Text>
                  </View>
                ) : usernameCheck?.available ? (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Check size={13} color="#10B981" strokeWidth={3} />
                    <Text style={[styles.statusText, { color: '#10B981' }]}>
                      Username available
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <X size={13} color="#EF4444" strokeWidth={3} />
                    <Text style={[styles.statusText, { color: '#EF4444' }]}>
                      Username already taken
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Username Suggestions */}
            {usernameCheck && !usernameCheck.available && usernameCheck.suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsLabel}>Suggestions:</Text>
                <View style={styles.suggestionsRow}>
                  {usernameCheck.suggestions.map((suggestion) => (
                    <IOSPressable
                      key={suggestion}
                      onPress={() => setValue('username', suggestion, { shouldValidate: true })}
                      style={styles.suggestionChip}
                      activeScale={0.92}
                    >
                      <Text style={styles.suggestionChipText}>{suggestion}</Text>
                    </IOSPressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email Address"
            placeholder="you@domain.com"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            icon={<Mail size={16} color="#A78BFA" />}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Input
              label="Password"
              placeholder="Create a strong password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              icon={<Lock size={16} color="#A78BFA" />}
              password
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="next"
            />

            {/* Password Strength Meter */}
            {password ? (
              <View style={styles.strengthWrap}>
                <View style={styles.meterTrack}>
                  {[1, 2, 3, 4, 5].map((seg) => (
                    <View
                      key={seg}
                      style={[
                        styles.meterSegment,
                        seg <= strengthScore && {
                          backgroundColor:
                            strengthScore <= 2
                              ? '#EF4444'
                              : strengthScore <= 4
                              ? '#F59E0B'
                              : '#10B981',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.strengthText}>
                  {strengthScore <= 2 ? 'Weak' : strengthScore <= 4 ? 'Good' : 'Strong'}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
            icon={<Lock size={16} color="#A78BFA" />}
            password
            autoCapitalize="none"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        )}
      />

      <TurnstileGate
        onVerify={setTurnstileToken}
        onInvalidate={handleInvalidate}
        resetSignal={turnstileReset}
      />

      <Button
        label="Create Account"
        onPress={onSubmit}
        loading={submitting}
        disabled={!turnstileToken}
        fullWidth
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  usernameStatusRow: {
    marginTop: 6,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  suggestionsContainer: {
    marginTop: 6,
    marginBottom: 8,
  },
  suggestionsLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  suggestionChipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    color: colors.primary,
  },
  strengthWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meterTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  meterSegment: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  strengthText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
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
  loginLink: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: colors.primary,
  },
});
