import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Users, MessageSquare, Plus, Check } from 'lucide-react-native';

import { colors, fonts, radius, spacing } from '@/theme';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';
import showToast from '@/lib/toast';

interface GroupItem {
  id: number;
  name: string;
  tagline: string;
  members_count: number;
  topics_count: number;
  emoji: string;
  color: string;
}

const GROUPS_DATA: GroupItem[] = [
  {
    id: 1,
    name: 'Sci-Fi Think Tank',
    tagline: 'Deep discussions on time loops, alien lore & futuristic worlds',
    members_count: 3420,
    topics_count: 148,
    emoji: '🚀',
    color: '#06B6D4',
  },
  {
    id: 2,
    name: 'A24 Aesthetic Vault',
    tagline: 'Indie cinema appreciation, cinematography breakdowns & arthouse vibes',
    members_count: 2890,
    topics_count: 112,
    emoji: '🎭',
    color: '#8B5CF6',
  },
  {
    id: 3,
    name: 'Midnight Horror Guild',
    tagline: 'For those who thrive in psychological dread and creature features',
    members_count: 1950,
    topics_count: 89,
    emoji: '👻',
    color: '#EF4444',
  },
  {
    id: 4,
    name: 'Studio Ghibli & Anime Otakus',
    tagline: 'Celebrating anime films, animated legends and cozy animation art',
    members_count: 4210,
    topics_count: 230,
    emoji: '⛩️',
    color: '#10B981',
  },
  {
    id: 5,
    name: 'Christopher Nolan Theorists',
    tagline: 'Analyzing Inception spinning tops, Oppenheimer timelines & Tenet loops',
    members_count: 5120,
    topics_count: 310,
    emoji: '⏳',
    color: '#F59E0B',
  },
];

function GroupCard({ group }: { group: GroupItem }) {
  const [isJoined, setIsJoined] = useState(false);

  const handleToggleJoin = () => {
    setIsJoined((prev) => !prev);
    if (!isJoined) {
      showToast.success(`Joined ${group.name}! 🎉`);
    } else {
      showToast.info(`Left ${group.name}`);
    }
  };

  return (
    <View style={styles.groupCard}>
      <View style={styles.cardTop}>
        <View style={[styles.emojiCircle, { backgroundColor: `${group.color}20` }]}>
          <Text style={styles.emoji}>{group.emoji}</Text>
        </View>

        <View style={styles.groupMeta}>
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Users size={11} color="#9CA3AF" />
              <Text style={styles.statText}>{group.members_count.toLocaleString()} members</Text>
            </View>
            <View style={styles.stat}>
              <MessageSquare size={11} color="#9CA3AF" />
              <Text style={styles.statText}>{group.topics_count} debates</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.tagline}>{group.tagline}</Text>

      <View style={styles.cardBottom}>
        <IOSPressable
          style={[styles.joinBtn, isJoined && styles.joinBtnActive]}
          onPress={handleToggleJoin}
          activeScale={0.92}
          accessibilityRole="button"
          accessibilityLabel={isJoined ? `Joined ${group.name}` : `Join ${group.name}`}
        >
          {isJoined ? (
            <>
              <Check size={14} color="#FFFFFF" />
              <Text style={styles.joinTextActive}>Joined</Text>
            </>
          ) : (
            <>
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.joinText}>Join Group</Text>
            </>
          )}
        </IOSPressable>
      </View>
    </View>
  );
}

export default function GroupsScreen() {
  return (
    <View style={styles.root}>
      {/* iOS Header */}
      <IOSHeader
        title="Cinephile Groups"
        subtitle="Join passionate communities"
        rightAction={<Users size={20} color="#06B6D4" />}
      />

      <FlatList<GroupItem>
        data={GROUPS_DATA}
        renderItem={({ item }) => <GroupCard group={item} />}
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
  groupCard: {
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  groupMeta: {
    flex: 1,
  },
  groupName: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#9CA3AF',
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 17,
    marginBottom: 14,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    minHeight: 34,
    borderRadius: radius.md,
  },
  joinBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  joinText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  joinTextActive: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#D1D5DB',
  },
});

