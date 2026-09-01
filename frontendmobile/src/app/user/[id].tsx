import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  Eye,
  Clock,
  Star,
  LayoutGrid,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { api, request } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, radius, spacing } from '@/theme';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import { FollowModal } from '@/components/profile/FollowModal';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

type TabType = 'favorites' | 'reviews' | 'collections' | 'watchlist' | 'watched';

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);
  const { user: currentUser, isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>(
    'followers'
  );

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['user', numericId, 'public'],
    queryFn: () => request<any>(() => api.get(`/user/${numericId}/public`)),
    enabled: !!numericId,
  });

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      showToast.info('Sign in to follow cinephiles');
      return;
    }
    setFollowLoading(true);
    try {
      await api.post(`/user/${numericId}/follow`);
      qc.invalidateQueries({ queryKey: ['user', numericId, 'public'] });
      qc.invalidateQueries({ queryKey: ['user', currentUser?.id, 'following'] });
      showToast.success(data?.is_following ? 'Unfollowed' : 'Following! ✨');
    } catch {
      showToast.error('Action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !data || !data.user) {
    return (
      <View style={styles.centerRoot}>
        <IOSHeader title="Profile" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>User not found</Text>
          <Text style={styles.emptySub}>
            This user account does not exist or has been removed.
          </Text>
        </View>
      </View>
    );
  }

  const { user, stats, is_following, favorites = [], reviews = [], collections = [], watchlist = [], watched = [] } =
    data;

  const isOwnProfile = currentUser?.id === user.id;

  const renderContent = () => {
    if (activeTab === 'favorites') {
      if (favorites.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Heart size={36} color="#EF4444" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
          </View>
        );
      }
      return (
        <View style={styles.gridWrap}>
          {favorites.map((m: any) => (
            <IOSPressable
              key={m.id || m.movie_id}
              style={styles.card}
              onPress={() => router.push(`/${m.media_type || 'movie'}/${m.movie_id}` as never)}
              activeScale={0.96}
            >
              <PosterImage
                path={m.poster_path}
                title={m.title}
                movieId={m.movie_id}
                width={CARD_WIDTH}
                height={POSTER_HEIGHT}
                borderRadius={radius.md}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.movieTitle} numberOfLines={1}>
                  {m.title}
                </Text>
              </View>
            </IOSPressable>
          ))}
        </View>
      );
    }

    if (activeTab === 'reviews') {
      if (reviews.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Star size={36} color="#FFC107" />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
          </View>
        );
      }
      return (
        <View style={styles.listWrap}>
          {reviews.map((rev: any) => (
            <View key={rev.id || rev.movie_id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#FFC107" fill="#FFC107" />
                  <Text style={styles.ratingBadgeText}>
                    {rev.label?.toUpperCase() || 'RATED'}
                  </Text>
                </View>
              </View>
              <Text style={styles.reviewTitle}>
                {rev.title || `Movie #${rev.movie_id}`}
              </Text>
              {rev.review_text ? (
                <Text style={styles.reviewBody}>{rev.review_text}</Text>
              ) : null}
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === 'collections') {
      if (collections.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <LayoutGrid size={36} color="#8B5CF6" />
            <Text style={styles.emptyTitle}>No public collections</Text>
          </View>
        );
      }
      return (
        <View style={styles.listWrap}>
          {collections.map((col: any) => (
            <IOSPressable
              key={col.id}
              style={styles.colCard}
              onPress={() => router.push(`/collections/${col.id}` as never)}
              activeScale={0.97}
            >
              <View style={styles.colIcon}>
                <LayoutGrid size={18} color="#8B5CF6" />
              </View>
              <View style={styles.colInfo}>
                <Text style={styles.colTitle}>{col.name || col.title}</Text>
                <Text style={styles.colSub}>{col.item_count || 0} films</Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </IOSPressable>
          ))}
        </View>
      );
    }

    if (activeTab === 'watchlist') {
      if (watchlist.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Clock size={36} color="#3B82F6" />
            <Text style={styles.emptyTitle}>No watchlist items</Text>
          </View>
        );
      }
      return (
        <View style={styles.gridWrap}>
          {watchlist.map((m: any) => (
            <IOSPressable
              key={m.id || m.movie_id}
              style={styles.card}
              onPress={() => router.push(`/${m.media_type || 'movie'}/${m.movie_id}` as never)}
              activeScale={0.96}
            >
              <PosterImage
                path={m.poster_path}
                title={m.title}
                movieId={m.movie_id}
                width={CARD_WIDTH}
                height={POSTER_HEIGHT}
                borderRadius={radius.md}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.movieTitle} numberOfLines={1}>
                  {m.title}
                </Text>
              </View>
            </IOSPressable>
          ))}
        </View>
      );
    }

    if (activeTab === 'watched') {
      if (watched.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Eye size={36} color="#10B981" />
            <Text style={styles.emptyTitle}>No watched movies</Text>
          </View>
        );
      }
      return (
        <View style={styles.gridWrap}>
          {watched.map((m: any) => (
            <IOSPressable
              key={m.id || m.movie_id}
              style={styles.card}
              onPress={() => router.push(`/${m.media_type || 'movie'}/${m.movie_id}` as never)}
              activeScale={0.96}
            >
              <PosterImage
                path={m.poster_path}
                title={m.title}
                movieId={m.movie_id}
                width={CARD_WIDTH}
                height={POSTER_HEIGHT}
                borderRadius={radius.md}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.movieTitle} numberOfLines={1}>
                  {m.title}
                </Text>
              </View>
            </IOSPressable>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.root}>
      <IOSHeader title={user.name} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Header Hero */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['rgba(229,9,20,0.15)', 'rgba(139,92,246,0.12)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.userRow}>
            <Avatar
              src={user.avatar_url}
              seed={user.username || user.name}
              name={user.name}
              size={72}
              borderRadius={36}
            />

            <View style={styles.userInfo}>
              <Text style={styles.displayName} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={styles.handle}>
                @{user.username || user.name.toLowerCase().replace(/\s/g, '')}
              </Text>
              {user.bio ? (
                <Text style={styles.bioText} numberOfLines={2}>
                  {user.bio}
                </Text>
              ) : null}
            </View>

            {!isOwnProfile && (
              <IOSPressable
                style={[
                  styles.followBtn,
                  is_following && styles.followingBtn,
                ]}
                onPress={handleToggleFollow}
                activeScale={0.92}
                accessibilityRole="button"
                accessibilityLabel={is_following ? 'Unfollow' : 'Follow'}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={is_following ? '#FFF' : '#000'} />
                ) : is_following ? (
                  <>
                    <UserCheck size={13} color="#FFFFFF" />
                    <Text style={styles.followingBtnText}>Following</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={13} color="#000000" />
                    <Text style={styles.followBtnText}>Follow</Text>
                  </>
                )}
              </IOSPressable>
            )}
          </View>

          {/* Followers & Following Chips */}
          <View style={styles.followChipsRow}>
            <IOSPressable
              style={styles.followChip}
              onPress={() => {
                setFollowModalTab('followers');
                setIsFollowModalOpen(true);
              }}
              activeScale={0.94}
            >
              <Users size={13} color={colors.primary} />
              <Text style={styles.followCount}>{stats?.followers_count || 0}</Text>
              <Text style={styles.followLabel}>Followers</Text>
            </IOSPressable>

            <IOSPressable
              style={styles.followChip}
              onPress={() => {
                setFollowModalTab('following');
                setIsFollowModalOpen(true);
              }}
              activeScale={0.94}
            >
              <UserCheck size={13} color={colors.primary} />
              <Text style={styles.followCount}>{stats?.following_count || 0}</Text>
              <Text style={styles.followLabel}>Following</Text>
            </IOSPressable>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBarSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {[
              { id: 'favorites' as TabType, label: 'Favorites', icon: Heart, count: favorites.length, color: '#EF4444' },
              { id: 'reviews' as TabType, label: 'Reviews', icon: Star, count: reviews.length, color: '#FFC107' },
              { id: 'collections' as TabType, label: 'Collections', icon: LayoutGrid, count: collections.length, color: '#8B5CF6' },
              { id: 'watchlist' as TabType, label: 'Watchlist', icon: Clock, count: watchlist.length, color: '#3B82F6' },
              { id: 'watched' as TabType, label: 'Watched', icon: Eye, count: watched.length, color: '#10B981' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <IOSPressable
                  key={tab.id}
                  style={[
                    styles.tabPill,
                    isSelected && { backgroundColor: `${tab.color}25`, borderColor: tab.color },
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                  activeScale={0.93}
                >
                  <Icon size={14} color={isSelected ? tab.color : '#9CA3AF'} />
                  <Text style={[styles.tabPillText, isSelected && { color: '#FFFFFF', fontFamily: fonts.headingSemi }]}>
                    {tab.label}
                  </Text>
                  {tab.count > 0 && (
                    <View style={[styles.countBadge, isSelected && { backgroundColor: `${tab.color}40` }]}>
                      <Text style={styles.countBadgeText}>{tab.count}</Text>
                    </View>
                  )}
                </IOSPressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>{renderContent()}</View>
      </ScrollView>

      {/* Followers Modal */}
      <FollowModal
        visible={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        userId={user.id}
        initialTab={followModalTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  profileHeader: {
    padding: spacing.lg,
    paddingTop: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 14,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  handle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.primary,
    marginBottom: 4,
  },
  bioText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondaryLabel,
    lineHeight: 16,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  followBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#000000',
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  followingBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  followChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  followChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  followCount: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  followLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondaryLabel,
  },
  tabBarSection: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tabsScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 36,
  },
  tabPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 2,
  },
  countBadgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFFFFF',
  },
  contentSection: {
    paddingTop: 16,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardInfo: {
    padding: 8,
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  listWrap: {
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  colCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  colIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  colInfo: {
    flex: 1,
  },
  colTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
  colSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondaryLabel,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  reviewHeader: {
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(255,193,7,0.15)',
    borderRadius: radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.3)',
  },
  ratingBadgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFC107',
  },
  reviewTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reviewBody: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 17,
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
    marginTop: 6,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
