import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Award, TrendingUp } from 'lucide-react-native';

import { colors, fonts, radius, spacing } from '@/theme';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';
import showToast from '@/lib/toast';

interface PredictionPoll {
  id: number;
  question: string;
  category: string;
  closes_in: string;
  total_votes: number;
  options: { id: string; text: string; votes: number; percent: number }[];
}

const SAMPLE_POLLS: PredictionPoll[] = [
  {
    id: 1,
    question: 'Will Avatar 3 surpass $2 Billion globally at the Box Office?',
    category: 'Box Office 2026',
    closes_in: '14 days',
    total_votes: 1420,
    options: [
      { id: 'yes', text: 'Yes, easily reaches $2B+', votes: 980, percent: 69 },
      { id: 'no', text: 'No, lands between $1.5B - $1.9B', votes: 440, percent: 31 },
    ],
  },
  {
    id: 2,
    question: 'Which film will win Best Picture at next year\'s Academy Awards?',
    category: 'Oscars & Awards',
    closes_in: '28 days',
    total_votes: 890,
    options: [
      { id: 'a', text: 'Dune: Part Two', votes: 420, percent: 47 },
      { id: 'b', text: 'The Brutalist', votes: 260, percent: 29 },
      { id: 'c', text: 'Sing Sing', votes: 130, percent: 15 },
      { id: 'd', text: 'Anora', votes: 80, percent: 9 },
    ],
  },
  {
    id: 3,
    question: 'Will the new DCU Superman movie score above 85% on Rotten Tomatoes?',
    category: 'Critical Acclaim',
    closes_in: '3 months',
    total_votes: 2150,
    options: [
      { id: 'yes', text: 'Yes, Certified Fresh 85%+', votes: 1520, percent: 71 },
      { id: 'no', text: 'No, Below 85%', votes: 630, percent: 29 },
    ],
  },
];

function PollCard({ poll }: { poll: PredictionPoll }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleVote = (optId: string) => {
    setSelectedOption(optId);
    showToast.success('Vote submitted! 🗳️');
  };

  return (
    <View style={styles.pollCard}>
      {/* Category badge */}
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{poll.category}</Text>
        </View>
        <Text style={styles.closesText}>Closes in {poll.closes_in}</Text>
      </View>

      <Text style={styles.question}>{poll.question}</Text>

      {/* Options */}
      <View style={styles.optionsList}>
        {poll.options.map((opt) => {
          const isSelected = selectedOption === opt.id;
          return (
            <IOSPressable
              key={opt.id}
              style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
              onPress={() => handleVote(opt.id)}
              activeScale={0.98}
              accessibilityRole="button"
              accessibilityLabel={opt.text}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt.text}
                </Text>
                {selectedOption && (
                  <Text style={styles.percentText}>{opt.percent}%</Text>
                )}
              </View>

              {/* Progress fill bar if voted */}
              {selectedOption && (
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${opt.percent}%`,
                      backgroundColor: isSelected ? 'rgba(229,9,20,0.35)' : 'rgba(255,255,255,0.08)',
                    },
                  ]}
                />
              )}
            </IOSPressable>
          );
        })}
      </View>

      <View style={styles.cardFooter}>
        <TrendingUp size={13} color="#9CA3AF" />
        <Text style={styles.votesCount}>{poll.total_votes.toLocaleString()} cinephiles voted</Text>
      </View>
    </View>
  );
}

export default function PredictionsScreen() {
  return (
    <View style={styles.root}>
      {/* iOS Header */}
      <IOSHeader
        title="Predictions & Polls"
        subtitle="Test your cinema instincts"
        rightAction={<Award size={20} color="#FFC107" />}
      />

      <FlatList<PredictionPoll>
        data={SAMPLE_POLLS}
        renderItem={({ item }) => <PollCard poll={item} />}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: 14,
  },
  pollCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,193,7,0.15)',
    borderRadius: radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.3)',
  },
  categoryText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFC107',
  },
  closesText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#9CA3AF',
  },
  question: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
    marginBottom: 14,
  },
  optionsList: {
    gap: 8,
    marginBottom: 12,
  },
  optionBtn: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 44,
    justifyContent: 'center',
  },
  optionBtnSelected: {
    borderColor: colors.primary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  optionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#E5E7EB',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.bodySemi,
  },
  percentText: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  votesCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#9CA3AF',
  },
});

