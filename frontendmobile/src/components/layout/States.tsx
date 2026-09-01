import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { CloudOff, Inbox, RefreshCw, SearchX, ShieldAlert, type LucideIcon } from 'lucide-react-native';

import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/theme';

interface BaseProps {
  style?: ViewStyle;
  /** Fills the screen and centres vertically. Off inside a list section. */
  fullscreen?: boolean;
}

// ─── Loading ─────────────────────────────────────────────────────────────────

export function LoadingState({
  label = 'Loading…',
  fullscreen = true,
  style,
}: BaseProps & { label?: string }) {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? (
        <Text variant="caption" center>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Error ───────────────────────────────────────────────────────────────────

export interface ErrorStateProps extends BaseProps {
  error: unknown;
  onRetry?: () => void;
  /** Overrides the message derived from the error. */
  message?: string;
}

/**
 * Renders a failed request. The copy comes from `ApiError`, so a dropped
 * connection reads differently from a 500 — and the retry button only appears
 * when retrying could actually help.
 */
export function ErrorState({
  error,
  onRetry,
  message,
  fullscreen = true,
  style,
}: ErrorStateProps) {
  const apiError = error instanceof ApiError ? error : null;
  const kind = apiError?.kind;

  const Icon: LucideIcon =
    kind === 'network' || kind === 'timeout'
      ? CloudOff
      : kind === 'unauthorized' || kind === 'forbidden'
        ? ShieldAlert
        : RefreshCw;

  const title =
    kind === 'network' || kind === 'timeout'
      ? "You're offline"
      : kind === 'unauthorized'
        ? 'Sign in required'
        : 'Something went wrong';

  const body =
    message ??
    (error instanceof Error ? error.message : 'Please try again in a moment.');

  // A 404 or a permission error will fail again identically; only offer retry
  // where it is plausibly transient.
  const canRetry = onRetry != null && (apiError == null || apiError.retryable);

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen, style]}>
      <Icon size={40} color={colors.textDim} strokeWidth={1.5} />
      <Text variant="sectionTitle" center>
        {title}
      </Text>
      <Text variant="caption" center style={styles.body}>
        {body}
      </Text>
      {canRetry ? (
        <Button label="Try again" variant="ghost" size="sm" onPress={onRetry} />
      ) : null}
    </View>
  );
}

// ─── Empty ───────────────────────────────────────────────────────────────────

export interface EmptyStateProps extends BaseProps {
  title: string;
  description?: string;
  /** Defaults to an inbox; pass `SearchX` for "no results" cases. */
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  fullscreen = true,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen, style]}>
      <Icon size={40} color={colors.textDim} strokeWidth={1.5} />
      <Text variant="sectionTitle" center>
        {title}
      </Text>
      {description ? (
        <Text variant="caption" center style={styles.body}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="ghost" size="sm" onPress={onAction} />
      ) : null}
    </View>
  );
}

/** Preset for a search that returned nothing. */
export function NoResultsState({ query, ...rest }: { query: string } & BaseProps) {
  return (
    <EmptyState
      icon={SearchX}
      title="No matches"
      description={`Nothing came up for "${query}". Try a different spelling or a shorter title.`}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing['3xl'],
  },
  fullscreen: {
    flex: 1,
  },
  body: {
    maxWidth: 320,
  },
});
