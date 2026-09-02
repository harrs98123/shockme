import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Brain, Wand2, Copy, Check } from 'lucide-react-native';

import { api } from '@/api/client';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import showToast from '@/lib/toast';

interface Props {
  movieId: number | string;
  mediaType?: 'movie' | 'tv';
  title: string;
}

const ALT_TYPES = [
  { id: 'twist', label: 'Mind Twist', icon: '🌪️', color: '#8B5CF6' },
  { id: 'dark', label: 'Dark Reality', icon: '🌑', color: '#8B5CF6' },
  { id: 'happy', label: 'Uplifting', icon: '☀️', color: '#8B5CF6' },
];

export function AiInsightsSection({ movieId, mediaType = 'movie', title }: Props) {
  // Explanation state
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExpl, setLoadingExpl] = useState(false);

  // Alternate ending state
  const [altType, setAltType] = useState<string>('twist');
  const [altEnding, setAltEnding] = useState<string | null>(null);
  const [loadingAlt, setLoadingAlt] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchExplanation = async () => {
    setLoadingExpl(true);
    try {
      const res = await api.get<{ explanation: string }>(
        `/explanation/${movieId}?media_type=${mediaType}`
      );
      setExplanation(res.data.explanation);
    } catch {
      showToast.error('Could not generate AI analysis at this time.');
    } finally {
      setLoadingExpl(false);
    }
  };

  const generateAlternateEnding = async (selectedType = altType) => {
    setLoadingAlt(true);
    setAltEnding(null);
    setCopied(false);
    try {
      const res = await api.get<{ alternate_ending: string }>(
        `/alternate-ending/${movieId}?media_type=${mediaType}&ending_type=${selectedType}`
      );
      setAltEnding(res.data.alternate_ending);
    } catch {
      showToast.error('Could not generate alternate ending.');
    } finally {
      setLoadingAlt(false);
    }
  };

  const handleCopy = (text: string) => {
    setCopied(true);
    showToast.success('Saved to clipboard! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* ── Section 1: AI Deep Dive / Explanation Engine ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.aiBadge}>
              <Brain size={11} color="#A78BFA" />
              <Text style={styles.aiBadgeText}>AI ANALYSIS</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Why This Matters</Text>
          <Text style={styles.cardSubtitle}>
            Deep dive into historical context, themes, and cultural legacy
          </Text>
        </View>

        {explanation ? (
          <View style={styles.contentBox}>
            <Text style={styles.markdownText}>{explanation}</Text>
          </View>
        ) : (
          <IOSPressable
            style={styles.generateBtn}
            onPress={fetchExplanation}
            disabled={loadingExpl}
            activeScale={0.96}
          >
            {loadingExpl ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Brain size={14} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Generate Deep Analysis</Text>
              </>
            )}
          </IOSPressable>
        )}
      </View>

      {/* ── Section 2: AI Alternate Ending Generator ── */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.whatIfBadge}>
              <Wand2 size={11} color="#F87171" />
              <Text style={styles.whatIfBadgeText}>WHAT IF?</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Alternate Ending Generator</Text>
          <Text style={styles.cardSubtitle}>
            Rewrite how the story concludes with creative AI screenwriting
          </Text>
        </View>

        {/* Ending Style Tabs */}
        <View style={styles.altTabsRow}>
          {ALT_TYPES.map((t) => {
            const isSelected = altType === t.id;
            return (
              <IOSPressable
                key={t.id}
                style={[
                  styles.altTab,
                  isSelected && styles.altTabActive,
                ]}
                onPress={() => {
                  setAltType(t.id);
                  if (altEnding) generateAlternateEnding(t.id);
                }}
                activeScale={0.94}
              >
                <Text style={styles.altIcon}>{t.icon}</Text>
                <Text
                  style={[
                    styles.altLabel,
                    isSelected && styles.altLabelActive,
                  ]}
                >
                  {t.label}
                </Text>
              </IOSPressable>
            );
          })}
        </View>

        {altEnding ? (
          <View style={styles.contentBox}>
            <View style={styles.altHeaderBar}>
              <Text style={styles.altModeTitle}>
                {ALT_TYPES.find((t) => t.id === altType)?.icon}{' '}
                {ALT_TYPES.find((t) => t.id === altType)?.label} Ending
              </Text>
              <Pressable
                style={styles.copyBtn}
                onPress={() => handleCopy(altEnding)}
                hitSlop={8}
              >
                {copied ? (
                  <Check size={14} color="#10B981" />
                ) : (
                  <Copy size={14} color={colors.textMuted} />
                )}
                <Text style={[styles.copyText, copied && { color: '#10B981' }]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.markdownText}>{altEnding}</Text>
          </View>
        ) : (
          <IOSPressable
            style={styles.writeEndingBtn}
            onPress={() => generateAlternateEnding(altType)}
            disabled={loadingAlt}
            activeScale={0.96}
          >
            {loadingAlt ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Wand2 size={14} color="#FFFFFF" />
                <Text style={styles.writeEndingText}>Write Alternate Ending</Text>
              </>
            )}
          </IOSPressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: '#111116',
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  cardHeader: {
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  aiBadgeText: {
    fontFamily: fonts.headingSemi,
    fontSize: 9,
    letterSpacing: 0.5,
    color: '#A78BFA',
  },
  whatIfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  whatIfBadgeText: {
    fontFamily: fonts.headingSemi,
    fontSize: 9,
    letterSpacing: 0.5,
    color: '#F87171',
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: radius.md,
    height: 44,
    marginTop: 4,
  },
  generateBtnText: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  writeEndingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E1E26',
    borderRadius: radius.md,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 4,
  },
  writeEndingText: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  contentBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  markdownText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 19,
  },
  altTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  altTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  altTabActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(124, 58, 237, 0.6)',
  },
  altIcon: {
    fontSize: 12,
  },
  altLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  altLabelActive: {
    color: '#FFFFFF',
    fontFamily: fonts.headingSemi,
  },
  altHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 8,
    marginBottom: 6,
  },
  altModeTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
});
