import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Tv,
  Calendar,
  Clock,
  Users,
  Plus,
  X,
  PlaySquare,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { api, request } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import showToast from '@/lib/toast';

interface WatchPartyParticipant {
  user_id: number;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  joined_at: string;
}

interface WatchParty {
  id: number;
  movie_id: number;
  title: string;
  scheduled_time: string;
  status: string;
  host: {
    id: number;
    name: string;
    username?: string | null;
    avatar_url?: string | null;
  };
  participants: WatchPartyParticipant[];
}

export default function WatchPartiesScreen() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [movieTitle, setMovieTitle] = useState('');
  const [movieId, setMovieId] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: parties = [], isLoading, refetch, isRefetching } = useQuery<WatchParty[]>({
    queryKey: ['watch-parties'],
    queryFn: () => request<WatchParty[]>(() => api.get('/watch-parties/')),
  });

  const handleJoinParty = async (partyId: number) => {
    if (!isAuthenticated) {
      showToast.info('Sign in to join watch parties');
      return;
    }

    try {
      await api.post(`/watch-parties/${partyId}/join`);
      qc.invalidateQueries({ queryKey: ['watch-parties'] });
      showToast.success('Joined Watch Party! 🍿');
    } catch {
      showToast.error('Action failed');
    }
  };

  const handleCreateParty = async () => {
    if (!movieTitle.trim() || !movieId.trim()) {
      showToast.error('Movie title and ID are required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/watch-parties/', {
        title: movieTitle.trim(),
        movie_id: Number(movieId.trim()),
        scheduled_time: scheduledTime.trim() || new Date(Date.now() + 3600000).toISOString(),
      });
      setIsCreateModalOpen(false);
      setMovieTitle('');
      setMovieId('');
      setScheduledTime('');
      qc.invalidateQueries({ queryKey: ['watch-parties'] });
      showToast.success('Watch Party scheduled! 🎉');
    } catch {
      showToast.error('Failed to create watch party');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <IOSHeader
        title="Watch Parties"
        subtitle="Stream and sync with friends"
        rightAction={
          <IOSPressable
            style={styles.createHeaderBtn}
            onPress={() => {
              if (!isAuthenticated) {
                showToast.info('Sign in to host a party');
                return;
              }
              setIsCreateModalOpen(true);
            }}
            activeScale={0.9}
            accessibilityRole="button"
            accessibilityLabel="Host Party"
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.createHeaderBtnText}>Host</Text>
          </IOSPressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner Hero */}
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={['rgba(229,9,20,0.2)', 'rgba(59,130,246,0.15)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroIconWrap}>
            <Tv size={28} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Live Cinema Rooms</Text>
          <Text style={styles.heroSub}>
            Watch together in real-time, live react with stickers, and discuss synchronously.
          </Text>
        </View>

        {/* Parties List */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Clock size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>
              Active & Upcoming Rooms ({parties.length})
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
          ) : parties.length === 0 ? (
            <View style={styles.emptyWrap}>
              <PlaySquare size={40} color={colors.secondaryLabel} />
              <Text style={styles.emptyTitle}>No scheduled watch parties</Text>
              <Text style={styles.emptySub}>
                Be the host and invite fellow cinephiles to a group watch party!
              </Text>
              <IOSPressable
                style={styles.hostPartyBtn}
                onPress={() => setIsCreateModalOpen(true)}
                activeScale={0.94}
              >
                <Text style={styles.hostPartyBtnText}>Host a Watch Party</Text>
              </IOSPressable>
            </View>
          ) : (
            parties.map((party) => {
              const isJoined = user && party.participants?.some((p) => p.user_id === user.id);
              const dateStr = party.scheduled_time
                ? new Date(party.scheduled_time).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Coming Soon';

              return (
                <View key={party.id} style={styles.partyCard}>
                  <View style={styles.partyTopRow}>
                    <View style={styles.partyInfo}>
                      <Text style={styles.partyMovieTitle}>{party.title}</Text>
                      <View style={styles.timeBadge}>
                        <Clock size={11} color={colors.primary} />
                        <Text style={styles.timeBadgeText}>{dateStr}</Text>
                      </View>
                    </View>

                    <IOSPressable
                      style={[
                        styles.joinRoomBtn,
                        isJoined && styles.joinedRoomBtn,
                      ]}
                      onPress={() => handleJoinParty(party.id)}
                      activeScale={0.92}
                    >
                      {isJoined ? (
                        <>
                          <Check size={12} color="#FFFFFF" />
                          <Text style={styles.joinedRoomBtnText}>Joined</Text>
                        </>
                      ) : (
                        <Text style={styles.joinRoomBtnText}>Join Room</Text>
                      )}
                    </IOSPressable>
                  </View>

                  {/* Host & Participants Row */}
                  <View style={styles.participantsRow}>
                    <View style={styles.hostInfo}>
                      <Avatar
                        src={party.host?.avatar_url}
                        seed={party.host?.username || party.host?.name}
                        name={party.host?.name}
                        size={24}
                        borderRadius={12}
                      />
                      <Text style={styles.hostName}>
                        Hosted by {party.host?.name || 'Cinephile'}
                      </Text>
                    </View>

                    <View style={styles.memberCountBadge}>
                      <Users size={11} color={colors.secondaryLabel} />
                      <Text style={styles.memberCountText}>
                        {party.participants?.length || 1} watching
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Host Watch Party Modal */}
      <Modal
        visible={isCreateModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Host Watch Party</Text>
              <Text style={styles.modalSub}>Schedule a synchronous room</Text>
            </View>
            <IOSPressable
              style={styles.modalCloseBtn}
              onPress={() => setIsCreateModalOpen(false)}
              activeScale={0.9}
            >
              <X size={18} color={colors.textMuted} />
            </IOSPressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>MOVIE TITLE</Text>
              <TextInput
                style={styles.formInput}
                value={movieTitle}
                onChangeText={setMovieTitle}
                placeholder="e.g. Interstellar"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>MOVIE / SHOW ID (TMDB)</Text>
              <TextInput
                style={styles.formInput}
                value={movieId}
                onChangeText={setMovieId}
                placeholder="e.g. 157336"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>SCHEDULED TIME (ISO / DATE)</Text>
              <TextInput
                style={styles.formInput}
                value={scheduledTime}
                onChangeText={setScheduledTime}
                placeholder="e.g. 2026-09-01T20:00:00Z (optional)"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <IOSPressable
              style={styles.submitHostBtn}
              onPress={handleCreateParty}
              activeScale={0.96}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitHostBtnText}>Schedule Party</Text>
              )}
            </IOSPressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  createHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  createHeaderBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  heroBanner: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    overflow: 'hidden',
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229,9,20,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 320,
  },
  listSection: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 16,
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 20,
  },
  partyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  partyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  partyInfo: {
    flex: 1,
    marginRight: 10,
  },
  partyMovieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.primary,
  },
  joinRoomBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  joinRoomBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#000000',
  },
  joinedRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  joinedRoomBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostName: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondaryLabel,
  },
  memberCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.secondaryLabel,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  hostPartyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  hostPartyBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  modalRoot: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
  },
  modalSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondaryLabel,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: spacing.lg,
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.secondaryLabel,
    letterSpacing: 0.8,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  submitHostBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitHostBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
