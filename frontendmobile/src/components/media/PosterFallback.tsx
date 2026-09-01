import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius } from '@/theme';

/** Deterministic number in [0, n) from a seed. */
function deterministicRand(seed: number, n: number): number {
  let x = seed ^ (seed >> 16);
  x = Math.imul(x ^ (x >> 13), 0x45d9f3b);
  x = (x ^ (x >> 16)) >>> 0;
  return x % n;
}

const SARCASTIC_LINES = [
  'We lost the\nposter. Sorry.',
  '404:\nPoster not found',
  'Our designer\ntook a day off',
  'Imagine a cool\nposter here',
  'Poster escaped\ninto the wild',
  'Coming soon\n(the poster, at least)',
  "We're too lazy\nto find this one",
  'Hidden gem or\njust hidden?',
];

const BG_PAIRS: [string, string][] = [
  ['#1a0a2e', '#16213e'],
  ['#0d1117', '#161b22'],
  ['#1a1a2e', '#16213e'],
  ['#0f0e17', '#1a1a2e'],
  ['#1b1b2f', '#162447'],
  ['#0a0a0a', '#1a0a0a'],
  ['#0d0d0d', '#1a1a0d'],
  ['#0a1628', '#162032'],
];

interface Props {
  title: string;
  seed: number;
  width?: number;
  height?: number;
}

/**
 * Sarcastic poster fallback — shown when TMDB has no poster for a film.
 * Deterministic: same movie always gets the same colour pair + text.
 * Memoized for efficient rendering in large VirtualizedLists.
 */
function PosterFallbackComponent({ title, seed, width, height }: Props) {
  const [top, bottom] = useMemo(
    () => BG_PAIRS[deterministicRand(seed, BG_PAIRS.length)],
    [seed]
  );
  const line = useMemo(
    () => SARCASTIC_LINES[deterministicRand(seed + 1, SARCASTIC_LINES.length)],
    [seed]
  );
  const initials = useMemo(
    () =>
      title
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join(''),
    [title]
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: top },
        width !== undefined && height !== undefined ? { width, height } : {},
      ]}
    >
      {/* Bottom gradient stripe */}
      <View style={[styles.stripe, { backgroundColor: bottom }]} />

      <Text style={styles.initials}>{initials}</Text>
      <Text style={styles.label}>{line}</Text>
    </View>
  );
}

export const PosterFallback = memo(PosterFallbackComponent);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripe: {
    ...StyleSheet.absoluteFillObject,
    top: '60%',
    opacity: 0.6,
  },
  initials: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: 'rgba(255,255,255,0.15)',
    position: 'absolute',
    top: 12,
    left: 12,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 16,
  },
});
