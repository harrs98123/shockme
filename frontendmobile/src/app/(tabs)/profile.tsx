import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  Eye,
  Clock,
  Star,
  LayoutGrid,
  MessageSquare,
  Users,
  UserCheck,
  TrendingUp,
  Bell,
  Compass,
  LogOut,
  Edit,
  Camera,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/hooks/useAuth';
import {
  favoritesApi,
  watchlistApi,
  watchedApi,
  interestsApi,
  reviewsApi,
  userCollectionsApi,
  userPostsApi,
  tierlistsApi,
} from '@/api/lists';
import { moviesApi } from '@/api/movies';
import { api, request } from '@/api/client';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { AuthGate } from '@/components/auth/AuthGate';
import { Avatar } from '@/components/avatar/Avatar';
import { AvatarModal } from '@/components/avatar/AvatarModal';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { FollowModal } from '@/components/profile/FollowModal';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

type TabType =
  | 'favorites'
  | 'suggestions'
  | 'watchlist'
  | 'watched'
  | 'reviews'
  | 'collections'
  | 'posts'
  | 'groups'
  | 'tierlists'
  | 'interested';

const TABS: { id: TabType; label: string; icon: any; color: string }[] = [
  { id: 'favorites', label: 'Favorites', icon: Heart, color: '#EF4444' },
  { id: 'suggestions', label: 'For You', icon: Compass, color: '#F59E0B' },
  { id: 'watchlist', label: 'Watchlist', icon: Clock, color: '#3B82F6' },
  { id: 'watched', label: 'Watched', icon: Eye, color: '#10B981' },
  { id: 'reviews', label: 'Reviews', icon: Star, color: '#FFC107' },
  { id: 'collections', label: 'Collections', icon: LayoutGrid, color: '#8B5CF6' },
  { id: 'posts', label: 'Posts', icon: MessageSquare, color: '#06B6D4' },
  { id: 'groups', label: 'Groups', icon: Users, color: '#EC4899' },
  { id: 'tierlists', label: 'Tier Lists', icon: TrendingUp, color: '#F97316' },
  { id: 'interested', label: 'Interested', icon: Bell, color: '#A855F7' },
];

function ProfileMovieCard({
  item,
  onRemove,
}: {
  item: {
    movie_id: number;
    title: string;
    poster_path: string | null;
    vote_average?: number | null;
    release_year?: string | null;
    media_type?: string;
  };
  onRemove?: (movieId: number) => void;
}) {
  const mediaType = item.media_type ?? 'movie';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  return (
    <IOSPressable
      style={styles.card}
      onPress={() => router.push(`/${mediaType}/${item.movie_id}` as never)}
      activeScale={0.96}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <PosterImage
        path={item.poster_path}
        title={item.title}
        movieId={item.movie_id}
        width={CARD_WIDTH}
        height={POSTER_HEIGHT}
        borderRadius={radius.md}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.movieTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.cardMeta}>
          {rating ? <Text style={styles.ratingText}>★ {rating}</Text> : null}
          {item.release_year ? (
            <Text style={styles.yearText}>• {item.release_year}</Text>
          ) : null}
          {onRemove && (
            <IOSPressable
              style={styles.removeBtn}
              onPress={() => onRemove(item.movie_id)}
              activeScale={0.88}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Remove item"
            >
              <Trash2 size={13} color="#EF4444" />
            </IOSPressable>
          )}
        </View>
      </View>
    </IOSPressable>
  );
}

export default function ProfileScreen() {
  return (
    <AuthGate>
      <ProfileView />
    </AuthGate>
  );
}

function ProfileView() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>(
    'followers'
  );

  // Queries for all user content
  const { data: favs = [], isLoading: favsLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.all(),
  });

  const { data: watchlist = [], isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.all(),
  });

  const { data: watched = [], isLoading: watchedLoading } = useQuery({
    queryKey: ['watched'],
    queryFn: () => watchedApi.all(),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', 'my'],
    queryFn: () => reviewsApi.my(),
  });

  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections', 'my'],
    queryFn: () => userCollectionsApi.my(),
  });

  const { data: myPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['groups', 'my', 'posts'],
    queryFn: () => userPostsApi.my(),
  });

  const { data: tierLists = [], isLoading: tierlistsLoading } = useQuery({
    queryKey: ['tierlists', 'all'],
    queryFn: () => tierlistsApi.all(),
  });

  const { data: interested = [], isLoading: interestedLoading } = useQuery({
    queryKey: ['interests', 'user', 'all'],
    queryFn: () => interestsApi.userAll(),
  });

  const { data: recommendations } = useQuery({
    queryKey: ['movies', 'profile-recommendations'],
    queryFn: () => moviesApi.popular(1),
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['user', user?.id, 'followers'],
    queryFn: () =>
      user ? request<any[]>(() => api.get(`/user/${user.id}/followers`)) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['user', user?.id, 'following'],
    queryFn: () =>
      user ? request<any[]>(() => api.get(`/user/${user.id}/following`)) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => request<any[]>(() => api.get('/groups')),
  });

  // Handlers for deleting items
  const handleRemoveFavorite = async (movieId: number) => {
    try {
      await favoritesApi.remove(movieId);
      qc.invalidateQueries({ queryKey: ['favorites'] });
      showToast.info('Removed from Favorites');
    } catch {
      showToast.error('Failed to remove');
    }
  };

  const handleRemoveWatchlist = async (movieId: number) => {
    try {
      await watchlistApi.remove(movieId);
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      showToast.info('Removed from Watchlist');
    } catch {
      showToast.error('Failed to remove');
    }
  };

  const handleRemoveWatched = async (movieId: number) => {
    try {
      await watchedApi.remove(movieId);
      qc.invalidateQueries({ queryKey: ['watched'] });
      showToast.info('Removed from Watched');
    } catch {
      showToast.error('Failed to remove');
    }
  };

  const handleDeleteReview = async (movieId: number) => {
    try {
      await reviewsApi.delete(movieId);
      qc.invalidateQueries({ queryKey: ['reviews', 'my'] });
      showToast.info('Review deleted');
    } catch {
      showToast.error('Failed to delete review');
    }
  };

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Plotmint?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const countMap: Record<TabType, number> = {
    favorites: favs.length,
    suggestions: (recommendations?.results ?? []).length,
    watchlist: watchlist.length,
    watched: watched.length,
    reviews: reviews.length,
    collections: collections.length,
    posts: myPosts.length,
    groups: groups.length,
    tierlists: tierLists.length,
    interested: interested.length,
  };

  const renderContent = () => {
    if (activeTab === 'favorites') {
      if (favsLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
      if (favs.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Heart size={36} color="#EF4444" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySub}>Tap the heart icon on any movie to add it here.</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={favs}
          renderItem={({ item }) => (
            <ProfileMovieCard item={item} onRemove={handleRemoveFavorite} />
          )}
          keyExtractor={(item) => String(item.id || item.movie_id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          scrollEnabled={false}
        />
      );
    }

    if (activeTab === 'suggestions') {
      const recMovies = (recommendations?.results ?? []).slice(0, 10).map((m: Media) => ({
        movie_id: m.id,
        title: m.title || m.name || '',
        poster_path: m.poster_path,
        vote_average: m.vote_average,
        release_year: (m.release_date || m.first_air_date)?.slice(0, 4),
        media_type: m.media_type,
      }));

      return (
        <FlatList
          data={recMovies}
          renderItem={({ item }) => <ProfileMovieCard item={item} />}
          keyExtractor={(item) => String(item.movie_id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          scrollEnabled={false}
        />
      );
    }

    if (activeTab === 'watchlist') {
      if (watchlistLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
      if (watchlist.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Clock size={36} color="#3B82F6" />
            <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
            <Text style={styles.emptySub}>Save movies you plan to watch later.</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={watchlist}
          renderItem={({ item }) => (
            <ProfileMovieCard item={item} onRemove={handleRemoveWatchlist} />
          )}
          keyExtractor={(item) => String(item.id || item.movie_id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          scrollEnabled={false}
        />
      );
    }

    if (activeTab === 'watched') {
      if (watchedLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
      if (watched.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Eye size={36} color="#10B981" />
            <Text style={styles.emptyTitle}>No watched movies yet</Text>
            <Text style={styles.emptySub}>Track the movies and series you have completed.</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={watched}
          renderItem={({ item }) => (
            <ProfileMovieCard item={item} onRemove={handleRemoveWatched} />
          )}
          keyExtractor={(item) => String(item.id || item.movie_id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          scrollEnabled={false}
        />
      );
    }

    if (activeTab === 'reviews') {
      if (reviewsLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
      if (reviews.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Star size={36} color="#FFC107" />
            <Text style={styles.emptyTitle}>No reviews written yet</Text>
            <Text style={styles.emptySub}>Rate and share your thoughts on movies.</Text>
          </View>
        );
      }
      return (
        <View style={styles.listWrap}>
          {reviews.map((rev) => (
            <View key={rev.id || rev.movie_id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#FFC107" fill="#FFC107" />
                  <Text style={styles.ratingBadgeText}>
                    {rev.label?.toUpperCase() || 'RATED'}
                  </Text>
                </View>
                <IOSPressable
                  onPress={() => handleDeleteReview(rev.movie_id)}
                  hitSlop={8}
                  activeScale={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Delete review"
                >
                  <Trash2 size={14} color="#EF4444" />
                </IOSPressable>
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
      if (collectionsLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
      if (collections.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <LayoutGrid size={36} color="#8B5CF6" />
            <Text style={styles.emptyTitle}>No collections created</Text>
            <Text style={styles.emptySub}>Create your custom movie playlists.</Text>
          </View>
        );
      }
      return (
        <View style={styles.listWrap}>
          {collections.map((col) => (
            <IOSPressable
              key={col.id}
              style={styles.colCard}
              onPress={() => router.push(`/collections/${col.id}` as never)}
              activeScale={0.97}
              accessibilityRole="button"
              accessibilityLabel={col.name || col.title}
            >
              <View style={styles.colIcon}>
                <LayoutGrid size={18} color="#8B5CF6" />
              </View>
              <View style={styles.colInfo}>
                <Text style={styles.colTitle}>{col.name || col.title}</Text>
                <Text style={styles.colSub}>{col.item_count || 12} films in collection</Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </IOSPressable>
          ))}
        </View>
      );
    }

    if (activeTab === 'posts') {
      if (postsLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
      if (myPosts.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <MessageSquare size={36} color="#06B6D4" />
            <Text style={styles.emptyTitle}>No community posts yet</Text>
            <Text style={styles.emptySub}>Join groups to start debates and discussions.</Text>
          </View>
        );
      }
      return (
        <View style={styles.listWrap}>
          {myPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <Text style={styles.postGroup}>{post.group_name || 'Cinephile Group'}</Text>
              <Text style={styles.postContent}>{post.content}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === 'groups') {
      return (
        <View style={styles.listWrap}>
          {groups.map((group) => (
            <IOSPressable
              key={group.id}
              style={styles.colCard}
              onPress={() => router.push('/groups' as never)}
              activeScale={0.97}
              accessibilityRole="button"
              accessibilityLabel={group.name}
            >
              <View style={[styles.colIcon, { backgroundColor: 'rgba(236,72,153,0.15)' }]}>
                <Users size={18} color="#EC4899" />
              </View>
              <View style={styles.colInfo}>
                <Text style={styles.colTitle}>{group.name}</Text>
                <Text style={styles.colSub}>{group.member_count || group.members_count || 120} members</Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </IOSPressable>
          ))}
        </View>
      );
    }

    if (activeTab === 'tierlists') {
      if (tierlistsLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
      if (tierLists.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <TrendingUp size={36} color="#F97316" />
            <Text style={styles.emptyTitle}>No tier lists saved</Text>
            <Text style={styles.emptySub}>Rank your favorite films on the Tier List screen.</Text>
            <IOSPressable
              style={styles.actionNavBtn}
              onPress={() => router.push('/tierlist' as never)}
              activeScale={0.95}
              accessibilityRole="button"
              accessibilityLabel="Create Tier List"
            >
              <Text style={styles.actionNavBtnText}>Create Tier List</Text>
            </IOSPressable>
          </View>
        );
      }
      return (
        <View style={styles.listWrap}>
          {tierLists.map((tl, i) => (
            <IOSPressable
              key={tl.id || i}
              style={styles.colCard}
              onPress={() => router.push('/tierlist' as never)}
              activeScale={0.97}
              accessibilityRole="button"
              accessibilityLabel={tl.name || 'Tier List'}
            >
              <View style={[styles.colIcon, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
                <TrendingUp size={18} color="#F97316" />
              </View>
              <View style={styles.colInfo}>
                <Text style={styles.colTitle}>{tl.name || `Ranking Set #${i + 1}`}</Text>
                <Text style={styles.colSub}>{tl.item_count || 6} ranked items</Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </IOSPressable>
          ))}
        </View>
      );
    }

    if (activeTab === 'interested') {
      if (interestedLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
      if (interested.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Bell size={36} color="#A855F7" />
            <Text style={styles.emptyTitle}>No upcoming alerts</Text>
            <Text style={styles.emptySub}>Mark interest in upcoming movies to get alerts.</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={interested}
          renderItem={({ item }) => (
            <ProfileMovieCard
              item={{
                movie_id: item.movie_id,
                title: item.title || 'Upcoming Title',
                poster_path: item.poster_path,
                release_year: item.release_date?.slice(0, 4),
                media_type: item.media_type,
              }}
            />
          )}
          keyExtractor={(item) => String(item.id || item.movie_id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          scrollEnabled={false}
        />
      );
    }

    return null;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Ambient Top Glow matching Search/Mood/Browse */}
      <LinearGradient
        colors={['rgba(139,92,246,0.22)', 'rgba(99,102,241,0.08)', 'transparent']}
        style={[styles.ambientGlow, { pointerEvents: 'none' }]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Header Hero */}
        <View style={styles.profileHeader}>

        {/* User Card Row */}
        <View style={styles.userRow}>
          {/* Avatar with Camera Trigger */}
          <IOSPressable
            style={styles.avatarButton}
            onPress={() => setIsAvatarModalOpen(true)}
            activeScale={0.92}
            accessibilityRole="button"
            accessibilityLabel="Open Avatar Studio"
          >
            <Avatar
              src={user?.avatar_url}
              seed={user?.username || user?.name}
              name={user?.name}
              size={72}
              borderRadius={36}
            />
            <View style={styles.avatarCameraBadge}>
              <Camera size={13} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          </IOSPressable>

          <View style={styles.userInfo}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.displayName} numberOfLines={1}>
                {user?.name || 'Cinephile'}
              </Text>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>MEMBER</Text>
              </View>
            </View>

            <Text style={styles.handle}>
              @{user?.username || user?.name.toLowerCase().replace(/\s/g, '')}
            </Text>

            {user?.bio ? (
              <Text style={styles.bioText} numberOfLines={2}>
                {user.bio}
              </Text>
            ) : null}
          </View>

          <IOSPressable
            style={styles.logoutBtn}
            onPress={confirmLogout}
            activeScale={0.9}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <LogOut size={17} color="#EF4444" />
          </IOSPressable>
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
            accessibilityRole="button"
            accessibilityLabel="View followers"
          >
            <Users size={13} color={colors.primary} />
            <Text style={styles.followCount}>{followers.length}</Text>
            <Text style={styles.followLabel}>Followers</Text>
          </IOSPressable>

          <IOSPressable
            style={styles.followChip}
            onPress={() => {
              setFollowModalTab('following');
              setIsFollowModalOpen(true);
            }}
            activeScale={0.94}
            accessibilityRole="button"
            accessibilityLabel="View following"
          >
            <UserCheck size={13} color={colors.primary} />
            <Text style={styles.followCount}>{following.length}</Text>
            <Text style={styles.followLabel}>Following</Text>
          </IOSPressable>
        </View>

        {/* Profile Action Buttons */}
        <View style={styles.profileActionBtns}>
          <IOSPressable
            style={styles.avatarStudioBtn}
            onPress={() => setIsAvatarModalOpen(true)}
            activeScale={0.94}
            accessibilityRole="button"
            accessibilityLabel="Avatar Studio"
          >
            <Camera size={13} color="#FFFFFF" />
            <Text style={styles.avatarStudioText}>Avatar Studio</Text>
          </IOSPressable>

          <IOSPressable
            style={styles.editProfileBtn}
            onPress={() => setIsEditModalOpen(true)}
            activeScale={0.94}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
          >
            <Edit size={13} color="#000000" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </IOSPressable>
        </View>

        {/* Bento Quick Stats Matrix */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bentoScroll}
        >
          <IOSPressable
            style={styles.bentoCard}
            onPress={() => setActiveTab('favorites')}
            activeScale={0.94}
          >
            <View style={[styles.bentoIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Heart size={16} color="#EF4444" />
            </View>
            <Text style={styles.bentoNumber}>{favs.length}</Text>
            <Text style={styles.bentoLabel}>Favorites</Text>
          </IOSPressable>

          <IOSPressable
            style={styles.bentoCard}
            onPress={() => setActiveTab('watched')}
            activeScale={0.94}
          >
            <View style={[styles.bentoIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
              <Eye size={16} color="#10B981" />
            </View>
            <Text style={styles.bentoNumber}>{watched.length}</Text>
            <Text style={styles.bentoLabel}>Watched</Text>
          </IOSPressable>

          <IOSPressable
            style={styles.bentoCard}
            onPress={() => setActiveTab('watchlist')}
            activeScale={0.94}
          >
            <View style={[styles.bentoIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Clock size={16} color="#3B82F6" />
            </View>
            <Text style={styles.bentoNumber}>{watchlist.length}</Text>
            <Text style={styles.bentoLabel}>Watchlist</Text>
          </IOSPressable>

          <IOSPressable
            style={styles.bentoCard}
            onPress={() => setActiveTab('reviews')}
            activeScale={0.94}
          >
            <View style={[styles.bentoIcon, { backgroundColor: 'rgba(255,193,7,0.15)' }]}>
              <Star size={16} color="#FFC107" />
            </View>
            <Text style={styles.bentoNumber}>{reviews.length}</Text>
            <Text style={styles.bentoLabel}>Reviews</Text>
          </IOSPressable>

          <IOSPressable
            style={styles.bentoCard}
            onPress={() => setActiveTab('collections')}
            activeScale={0.94}
          >
            <View style={[styles.bentoIcon, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
              <LayoutGrid size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.bentoNumber}>{collections.length}</Text>
            <Text style={styles.bentoLabel}>Collections</Text>
          </IOSPressable>
        </ScrollView>
      </View>

      {/* Profile Horizontal Tabs */}
      <View style={styles.tabBarSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            const count = countMap[tab.id];
            const Icon = tab.icon;

            return (
              <IOSPressable
                key={tab.id}
                style={[
                  styles.tabPill,
                  isSelected && {
                    backgroundColor: `${tab.color}25`,
                    borderColor: tab.color,
                  },
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeScale={0.93}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isSelected }}
              >
                <Icon size={14} color={isSelected ? tab.color : '#9CA3AF'} />
                <Text
                  style={[
                    styles.tabPillText,
                    isSelected && { color: '#FFFFFF', fontFamily: fonts.headingSemi },
                  ]}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.countBadge,
                      isSelected && { backgroundColor: `${tab.color}40` },
                    ]}
                  >
                    <Text style={styles.countBadgeText}>{count}</Text>
                  </View>
                )}
              </IOSPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Content Section */}
      <View style={styles.contentSection}>{renderContent()}</View>

      {/* Modals */}
      <AvatarModal
        visible={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />

      <ProfileEditModal
        visible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onOpenAvatarStudio={() => setIsAvatarModalOpen(true)}
      />

      {user && (
        <FollowModal
          visible={isFollowModalOpen}
          onClose={() => setIsFollowModalOpen(false)}
          userId={user.id}
          initialTab={followModalTab}
        />
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  profileHeader: {
    padding: spacing.lg,
    paddingTop: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarButton: {
    position: 'relative',
    marginRight: 16,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F0F12',
  },
  userInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  displayName: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  memberBadgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
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
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  followChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
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
  profileActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  avatarStudioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarStudioText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  editProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  editProfileText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#000000',
  },
  bentoScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  bentoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bentoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoNumber: {
    fontFamily: fonts.headingBlack,
    fontSize: 16,
    color: '#FFFFFF',
  },
  bentoLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
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
  gridContainer: {
    paddingHorizontal: spacing.lg,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInfo: {
    padding: 10,
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFC107',
  },
  yearText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  removeBtn: {
    padding: 4,
    minHeight: 28,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  loader: {
    marginTop: 40,
  },
  emptyWrap: {
    alignItems: 'center',
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
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actionNavBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginTop: 10,
  },
  actionNavBtnText: {
    fontFamily: fonts.bodySemi,
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
    minHeight: 60,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  postGroup: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.primary,
    marginBottom: 4,
  },
  postContent: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
});
