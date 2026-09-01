import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Pressable,
} from 'react-native';
import { Tv, ExternalLink, Globe } from 'lucide-react-native';
import { Image } from 'expo-image';

import type { CountryWatchProviders, WatchProvider } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';

const LOGO_BASE = 'https://image.tmdb.org/t/p/w92';

const PRIORITY_COUNTRIES = [
  { code: 'IN', label: 'India', flag: '🇮🇳' },
  { code: 'US', label: 'USA', flag: '🇺🇸' },
  { code: 'GB', label: 'UK', flag: '🇬🇧' },
  { code: 'CA', label: 'Canada', flag: '🇨🇦' },
  { code: 'AU', label: 'Australia', flag: '🇦🇺' },
];

const CATEGORIES: { key: keyof CountryWatchProviders; label: string; color: string }[] = [
  { key: 'flatrate', label: 'Stream', color: '#10B981' },
  { key: 'rent', label: 'Rent', color: '#3B82F6' },
  { key: 'buy', label: 'Buy', color: '#8B5CF6' },
  { key: 'free', label: 'Free', color: '#F59E0B' },
  { key: 'ads', label: 'Ads', color: '#6366F1' },
];

interface Props {
  watchProviders?: {
    results?: Record<string, CountryWatchProviders>;
  } | null;
  title: string;
}

export function WhereToWatchSection({ watchProviders, title }: Props) {
  const [selectedCountry, setSelectedCountry] = useState('IN');

  const availableCountries = useMemo(() => {
    if (!watchProviders?.results) return [];
    return Object.keys(watchProviders.results);
  }, [watchProviders]);

  const activeCountryData = watchProviders?.results?.[selectedCountry] ?? null;

  const currentProviders = useMemo(() => {
    if (!activeCountryData) return [];
    const list: { category: string; color: string; providers: WatchProvider[] }[] = [];

    CATEGORIES.forEach((cat) => {
      const items = activeCountryData[cat.key];
      if (Array.isArray(items) && items.length > 0) {
        list.push({
          category: cat.label,
          color: cat.color,
          providers: items as WatchProvider[],
        });
      }
    });
    return list;
  }, [activeCountryData]);

  if (!watchProviders?.results || availableCountries.length === 0) {
    return null;
  }

  const handleOpenLink = (url?: string) => {
    const targetUrl = url || activeCountryData?.link;
    if (targetUrl) {
      Linking.openURL(targetUrl).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Tv size={18} color="#10B981" />
          <Text style={styles.sectionHeading}>Where to Watch</Text>
        </View>
        <Text style={styles.sectionSub}>Official streaming & digital stores</Text>
      </View>

      {/* Country Switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.countryScroll}
      >
        {PRIORITY_COUNTRIES.map((c) => {
          const isSelected = selectedCountry === c.code;
          const hasData = availableCountries.includes(c.code);
          return (
            <IOSPressable
              key={c.code}
              style={[
                styles.countryChip,
                isSelected && styles.countryChipActive,
                !hasData && styles.countryChipDisabled,
              ]}
              onPress={() => setSelectedCountry(c.code)}
              activeScale={0.94}
            >
              <Text style={styles.countryFlag}>{c.flag}</Text>
              <Text
                style={[
                  styles.countryLabel,
                  isSelected && styles.countryLabelActive,
                  !hasData && { opacity: 0.4 },
                ]}
              >
                {c.label}
              </Text>
            </IOSPressable>
          );
        })}
      </ScrollView>

      {/* Providers Content */}
      {currentProviders.length > 0 ? (
        <View style={styles.providersCard}>
          {currentProviders.map((group) => (
            <View key={group.category} style={styles.groupSection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: group.color }]} />
                <Text style={styles.categoryTitle}>{group.category}</Text>
              </View>

              <View style={styles.providerGrid}>
                {group.providers.map((p) => (
                  <Pressable
                    key={p.provider_id}
                    style={styles.providerItem}
                    onPress={() => handleOpenLink()}
                  >
                    {p.logo_path ? (
                      <Image
                        source={{ uri: `${LOGO_BASE}${p.logo_path}` }}
                        style={styles.providerLogo}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.providerLogo, { backgroundColor: colors.surface2 }]} />
                    )}
                    <Text style={styles.providerName} numberOfLines={1}>
                      {p.provider_name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {activeCountryData?.link ? (
            <IOSPressable
              style={styles.tmdbLinkRow}
              onPress={() => handleOpenLink(activeCountryData.link)}
              activeScale={0.96}
            >
              <Text style={styles.tmdbLinkText}>View all options on JustWatch</Text>
              <ExternalLink size={12} color={colors.textMuted} />
            </IOSPressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No streaming providers listed for this region yet.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: '#FFFFFF',
  },
  sectionSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  countryScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  countryChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  countryChipDisabled: {
    opacity: 0.6,
  },
  countryFlag: {
    fontSize: 13,
  },
  countryLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  countryLabelActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bodySemi,
  },
  providersCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 16,
  },
  groupSection: {
    gap: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  providerItem: {
    alignItems: 'center',
    width: 58,
    gap: 5,
  },
  providerLogo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
  },
  providerName: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
  },
  tmdbLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  tmdbLinkText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
