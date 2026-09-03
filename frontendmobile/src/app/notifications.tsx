import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  CheckCheck,
  Bell,
  Sparkles,
  ChevronRight,
  Film,
  Users,
} from 'lucide-react-native';

import {
  notificationsApi,
  type NotificationItem,
  type SuggestedUser,
} from '@/api/notifications';
import { api } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import { AmbientGlow } from '@/components/layout/AmbientGlow';
import { posterUrl, backdropUrl } from '@/lib/images';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SUGGEST_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.42, 160);

type NotificationFilter = 'all' | 'like' | 'comment' | 'follow';

function timeAgo(dateStr: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  } catch {
    return '';
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});

  // 1. Fetch notifications
  const {
    data,
    isLoading: notifsLoading,
    refetch: refetchNotifs,
    isRefetching,
  } = useQuery({
    queryKey: ['user', 'notifications'],
    queryFn: () => notificationsApi.get(50, 0),
    enabled: isAuthenticated,
    staleTime: 20 * 1000,
  });

  // 2. Fetch suggested users & follow-back candidates
  const {
    data: suggestions = [],
    isLoading: suggestLoading,
    refetch: refetchSuggestions,
  } = useQuery<SuggestedUser[]>({
    queryKey: ['user', 'suggestions'],
    queryFn: () => notificationsApi.getSuggestions(15),
    enabled: isAuthenticated,
    staleTime: 45 * 1000,
  });

  const notifications = data?.notifications || [];

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markRead();
      qc.invalidateQueries({ queryKey: ['user', 'notifications'] });
      qc.invalidateQueries({ queryKey: ['user', 'notifications', 'unread-count'] });
      showToast.success('All marked as read');
    } catch {
      showToast.error('Action failed');
    }
  };

  const handleToggleFollow = async (targetUser: { id: number; name: string }) => {
    const currentStatus = followingMap[targetUser.id] ?? false;
    const nextStatus = !currentStatus;

    // Optimistic UI
    setFollowingMap((prev) => ({ ...prev, [targetUser.id]: nextStatus }));

    try {
      await api.post(`/user/${targetUser.id}/follow`);
      qc.invalidateQueries({ queryKey: ['user', 'suggestions'] });
      qc.invalidateQueries({ queryKey: ['user', currentUser?.id, 'following'] });
      showToast.success(nextStatus ? `Following @${targetUser.name}!` : 'Unfollowed');
    } catch {
      setFollowingMap((prev) => ({ ...prev, [targetUser.id]: currentStatus }));
      showToast.error('Action failed');
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const onRefresh = useCallback(() => {
    refetchNotifs();
    refetchSuggestions();
  }, [refetchNotifs, refetchSuggestions]);

  return (
    <View style={styles.root}>
      {/* ── Ambient Cosmic Glow ── */}
      <AmbientGlow />

      {/* ── Corner Purple Aura ── */}
      <LinearGradient
        colors={[
          'rgba(147, 51, 234, 0.4)',
          'rgba(126, 34, 206, 0.2)',
          'rgba(15, 12, 22, 0)',
        ]}
        locations={[0, 0.35, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
        style={styles.cornerPurpleGlow}
        pointerEvents="none"
      />

      {/* ── Top Navigation Header ── */}
      <IOSHeader
        title="Activity"
        translucent
        rightAction={
          notifications.length > 0 ? (
            <IOSPressable
              onPress={handleMarkAllRead}
              style={styles.markReadBtn}
              activeScale={0.88}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <CheckCheck size={18} color="#C084FC" />
            </IOSPressable>
          ) : null
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── 1. Suggested Cinephiles & Follow-Back Carousel ── */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <View style={styles.suggestionsHeader}>
              <View style={styles.suggestionsTitleRow}>
                <Sparkles size={14} color="#C084FC" />
                <Text style={styles.suggestionsTitle}>Suggested Cinephiles</Text>
              </View>
              <Text style={styles.suggestionsSub}>Discover & Follow Back</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestions.map((item) => {
                const isFollowed = followingMap[item.id] ?? item.is_following;

                return (
                  <View key={item.id} style={styles.suggestCard}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                      style={StyleSheet.absoluteFillObject}
                    />

                    {/* Avatar with profile jump */}
                    <IOSPressable
                      onPress={() => router.push(`/user/${item.id}` as never)}
                      style={styles.suggestAvatarWrap}
                      activeScale={0.94}
                    >
                      <Avatar
                        src={item.avatar_url}
                        seed={item.username || item.name}
                        name={item.name}
                        size={52}
                        borderRadius={26}
                      />
                    </IOSPressable>

                    <Text style={styles.suggestName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.suggestHandle} numberOfLines={1}>
                      @{item.username || item.name.toLowerCase().replace(/\s/g, '')}
                    </Text>

                    {/* Follows You / Cinephile Badge */}
                    {item.follows_you ? (
                      <View style={styles.followsYouPill}>
                        <Text style={styles.followsYouText}>⚡ Follows you</Text>
                      </View>
                    ) : (
                      <View style={styles.cinephileMatchPill}>
                        <Text style={styles.cinephileMatchText}>🎬 Match</Text>
                      </View>
                    )}

                    {/* 1-Tap Action Button */}
                    <IOSPressable
                      style={[
                        styles.suggestActionBtn,
                        isFollowed && styles.suggestActionBtnFollowing,
                      ]}
                      onPress={() => handleToggleFollow(item)}
                      activeScale={0.93}
                    >
                      {isFollowed ? (
                        <>
                          <UserCheck size={12} color="#FFFFFF" />
                          <Text style={styles.suggestFollowingText}>Following</Text>
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} color="#000000" />
                          <Text style={styles.suggestFollowText}>
                            {item.follows_you ? 'Follow back' : 'Follow'}
                          </Text>
                        </>
                      )}
                    </IOSPressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── 2. Filter Category Pills ── */}
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            <IOSPressable
              style={[
                styles.filterChip,
                activeFilter === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('all')}
              activeScale={0.94}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'all' && styles.filterChipTextActive,
                ]}
              >
                All ({notifications.length})
              </Text>
            </IOSPressable>

            <IOSPressable
              style={[
                styles.filterChip,
                activeFilter === 'like' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('like')}
              activeScale={0.94}
            >
              <Heart
                size={12}
                color={activeFilter === 'like' ? '#000' : '#EF4444'}
                fill={activeFilter === 'like' ? '#000' : '#EF4444'}
              />
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'like' && styles.filterChipTextActive,
                ]}
              >
                Likes
              </Text>
            </IOSPressable>

            <IOSPressable
              style={[
                styles.filterChip,
                activeFilter === 'comment' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('comment')}
              activeScale={0.94}
            >
              <MessageCircle
                size={12}
                color={activeFilter === 'comment' ? '#000' : '#38BDF8'}
              />
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'comment' && styles.filterChipTextActive,
                ]}
              >
                Comments
              </Text>
            </IOSPressable>

            <IOSPressable
              style={[
                styles.filterChip,
                activeFilter === 'follow' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('follow')}
              activeScale={0.94}
            >
              <Users
                size={12}
                color={activeFilter === 'follow' ? '#000' : '#A855F7'}
              />
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'follow' && styles.filterChipTextActive,
                ]}
              >
                Follows
              </Text>
            </IOSPressable>
          </ScrollView>
        </View>

        {/* ── 3. Notifications Stream ── */}
        {notifsLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Bell size={42} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all'
                ? 'No notifications yet'
                : `No ${activeFilter} notifications`}
            </Text>
            <Text style={styles.emptySub}>
              When cinephiles like your takes, comment, or start following you,
              you'll see them right here.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((n) => {
              const poster =
                posterUrl(n.post_poster, 'w185') ||
                backdropUrl(n.post_poster, 'w300');

              return (
                <IOSPressable
                  key={n.id}
                  style={[
                    styles.notifCard,
                    !n.is_read && styles.notifCardUnread,
                  ]}
                  onPress={() => {
                    if (n.post_id) {
                      router.push(`/(tabs)/feed` as never);
                    } else if (n.actor?.id) {
                      router.push(`/user/${n.actor.id}` as never);
                    }
                  }}
                  activeScale={0.98}
                >
                  <LinearGradient
                    colors={
                      !n.is_read
                        ? ['rgba(147, 51, 244, 0.12)', 'rgba(24, 20, 32, 0.6)']
                        : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']
                    }
                    style={StyleSheet.absoluteFillObject}
                  />

                  {/* Actor Avatar with Type Badge */}
                  <View style={styles.notifAvatarContainer}>
                    <Avatar
                      src={n.actor.avatar_url}
                      seed={n.actor.username || n.actor.name}
                      name={n.actor.name}
                      size={44}
                      borderRadius={22}
                    />
                    <View
                      style={[
                        styles.notifTypeBadge,
                        n.type === 'like' && { backgroundColor: '#EF4444' },
                        n.type === 'comment' && { backgroundColor: '#0284C7' },
                        n.type === 'follow' && { backgroundColor: '#9333EA' },
                      ]}
                    >
                      {n.type === 'like' && (
                        <Heart size={9} color="#FFFFFF" fill="#FFFFFF" />
                      )}
                      {n.type === 'comment' && (
                        <MessageCircle size={9} color="#FFFFFF" fill="#FFFFFF" />
                      )}
                      {n.type === 'follow' && (
                        <UserPlus size={9} color="#FFFFFF" />
                      )}
                    </View>
                  </View>

                  {/* Narrative Body */}
                  <View style={styles.notifContent}>
                    <Text style={styles.notifText}>
                      <Text style={styles.notifBold}>{n.actor.name}</Text>{' '}
                      {n.type === 'like' && (
                        <>
                          reacted{' '}
                          <Text style={{ fontSize: 13 }}>
                            {n.reaction_type === 'loved'
                              ? '❤️'
                              : n.reaction_type === 'amazing'
                              ? '🔥'
                              : n.reaction_type === 'funny'
                              ? '😂'
                              : '👏'}
                          </Text>{' '}
                          to your take on{' '}
                          <Text style={styles.notifFilmTitle}>
                            {n.post_title || 'a film'}
                          </Text>
                        </>
                      )}
                      {n.type === 'comment' && (
                        <>
                          commented: "{n.content || 'Great point!'}" on{' '}
                          <Text style={styles.notifFilmTitle}>
                            {n.post_title || 'your post'}
                          </Text>
                        </>
                      )}
                      {n.type === 'follow' && 'started following you.'}
                    </Text>

                    <Text style={styles.notifTime}>{timeAgo(n.created_at)}</Text>
                  </View>

                  {/* Right Thumbnail or Follow Button */}
                  {n.type === 'follow' ? (
                    <IOSPressable
                      style={[
                        styles.followBackMiniBtn,
                        n.is_following_back && styles.followBackMiniBtnFollowing,
                      ]}
                      onPress={() => handleToggleFollow(n.actor)}
                      activeScale={0.92}
                    >
                      <Text
                        style={[
                          styles.followBackMiniText,
                          n.is_following_back && styles.followBackMiniTextFollowing,
                        ]}
                      >
                        {n.is_following_back ? 'Following' : 'Follow back'}
                      </Text>
                    </IOSPressable>
                  ) : poster ? (
                    <Image
                      source={{ uri: poster }}
                      style={styles.notifPosterThumb}
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                  )}
                </IOSPressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  cornerPurpleGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 1.1,
    height: 380,
    zIndex: 0,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  markReadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsSection: {
    paddingTop: 10,
    marginBottom: 16,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  suggestionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionsTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  suggestionsSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  suggestCard: {
    width: SUGGEST_CARD_WIDTH,
    borderRadius: 18,
    backgroundColor: 'rgba(24, 20, 32, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  suggestAvatarWrap: {
    marginBottom: 8,
  },
  suggestName: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
  },
  suggestHandle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 6,
    width: '100%',
  },
  followsYouPill: {
    backgroundColor: 'rgba(168,85,247,0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.35)',
  },
  followsYouText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9.5,
    color: '#E9D5FF',
  },
  cinephileMatchPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: 10,
  },
  cinephileMatchText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.7)',
  },
  suggestActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  suggestActionBtnFollowing: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  suggestFollowText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#000000',
  },
  suggestFollowingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFFFFF',
  },
  filtersSection: {
    marginBottom: 14,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterChipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  filterChipTextActive: {
    color: '#000000',
  },
  loadingWrap: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyWrap: {
    paddingHorizontal: 32,
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 6,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  notificationsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(24, 20, 32, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  notifCardUnread: {
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  notifAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  notifTypeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  notifContent: {
    flex: 1,
    marginRight: 10,
  },
  notifText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  notifBold: {
    fontFamily: fonts.headingSemi,
    color: '#FFFFFF',
  },
  notifFilmTitle: {
    fontFamily: fonts.bodySemi,
    color: '#C084FC',
  },
  notifTime: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 3,
  },
  notifPosterThumb: {
    width: 38,
    height: 54,
    borderRadius: 6,
    backgroundColor: '#1C1C24',
  },
  followBackMiniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
  },
  followBackMiniBtnFollowing: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  followBackMiniText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#000000',
  },
  followBackMiniTextFollowing: {
    color: '#FFFFFF',
  },
});
