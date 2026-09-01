import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

import type { Genre } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';

interface Props {
  genres?: Genre[];
}

const GENRE_COLORS: Record<string, string> = {
  Action: '#EF4444',
  Adventure: '#F97316',
  Animation: '#3B82F6',
  Comedy: '#FBBF24',
  Crime: '#7C3AED',
  Documentary: '#10B981',
  Drama: '#8B5CF6',
  Family: '#EC4899',
  Fantasy: '#6366F1',
  History: '#B45309',
  Horror: '#374151',
  Music: '#F43F5E',
  Mystery: '#0EA5E9',
  Romance: '#DB2777',
  'Science Fiction': '#06B6D4',
  SciFi: '#06B6D4',
  Thriller: '#DC2626',
  War: '#78350F',
  Western: '#A16207',
};

const DEFAULT_COLOR = '#6B7280';

export function VibeChartSection({ genres }: Props) {
  if (!genres || genres.length === 0) return null;

  const weights = [53, 27, 20, 10, 5];
  const chartData = genres.slice(0, 4).map((g, i) => ({
    name: g.name,
    weight: weights[i] || 10,
    color: GENRE_COLORS[g.name] || DEFAULT_COLOR,
  }));

  const totalWeight = chartData.reduce((sum, item) => sum + item.weight, 0);
  const normalizedData = chartData.map((item) => ({
    ...item,
    pct: Math.round((item.weight / totalWeight) * 100),
  }));

  const size = 180;
  const strokeWidth = 22;
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const cx = size / 2;
  const cy = size / 2;

  let currentOffset = 0;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Vibe Chart</Text>

      {/* Donut Chart */}
      <View style={styles.chartWrap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${cx}, ${cy}`}>
            {/* Background track */}
            <Circle
              cx={cx}
              cy={cy}
              r={radiusVal}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Segment Arcs */}
            {normalizedData.map((item, i) => {
              const strokeDasharray = `${(item.pct / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -currentOffset;
              currentOffset += (item.pct / 100) * circumference;

              return (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={radiusVal}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        </Svg>

        {/* Central Overlay Text */}
        <View style={styles.centerTextContainer}>
          <Text style={styles.centerGenre} numberOfLines={1}>
            {normalizedData[0]?.name}
          </Text>
          <Text style={styles.centerPct}>{normalizedData[0]?.pct}%</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {normalizedData.map((item, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={styles.legendLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendName}>{item.name}</Text>
            </View>
            <Text style={styles.legendPct}>{item.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111116',
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 24,
    marginHorizontal: spacing.lg,
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerGenre: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 2,
  },
  centerPct: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  legendContainer: {
    gap: 10,
    marginTop: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  legendPct: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
});
