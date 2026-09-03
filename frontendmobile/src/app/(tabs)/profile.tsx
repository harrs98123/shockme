import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Eye,
  Clock,
  Star,
  LayoutGrid,
  Users,
  UserCheck,
  TrendingUp,
  LogOut,
  Edit,
  Camera,
  Trash2,
  ChevronRight,
  ChevronDown,
  Plus,
  Menu,
  Grid3X3,
  Archive,
  Bookmark,
  Share2,
  Film,
  MessageCircle,
  X,
  Compass,
  Flame,
  Tv,
} from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import {
  favoritesApi,
  watchlistApi,
  watchedApi,
  reviewsApi,
  userCollectionsApi,
  tierlistsApi,
  userPostsApi,
} from '@/api/lists';
import { socialApi, type SocialPost } from '@/api/social';
import { storiesApi, type Story, type UserStoryGroup } from '@/api/stories';
import { api, request } from '@/api/client';
import { colors, fonts, radius, spacing } from '@/theme';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { AuthGate } from '@/components/auth/AuthGate';
import { Avatar } from '@/components/avatar/Avatar';
import { AvatarModal } from '@/components/avatar/AvatarModal';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { FollowModal } from '@/components/profile/FollowModal';
import { FeedPostCard } from '@/components/social/FeedPostCard';
import { CineStoryViewerModal } from '@/components/social/CineStoryViewerModal';
import { CreateStoryModal } from '@/components/social/CreateStoryModal';
import { PostComposerModal } from '@/components/social/PostComposerModal';
import { posterUrl, backdropUrl } from '@/lib/images';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);

const INSTA_STORY_GRADIENT = ['#CA1D7E', '#E052A0', '#F15C45', '#FBAA47'];

type ProfileTab =
  | 'posts'
  | 'favorites'
  | 'watchlist'
  | 'watched'
  | 'reviews'
  | 'collections'
  | 'tierlists'
  | 'groups';

export default function ProfileScreen() {
  return (
    <AuthGate>
      <ProfileView />
    </AuthGate>
  );
}

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
      style={styles.movieCard}
      onPress={() => router.push(`/${mediaType}/${item.movie_id}` as never)}
      activeScale={0.96}
      activeOpacity={0.9}
    >
      <PosterImage
        path={item.poster_path}
        title={item.title}
        movieId={item.movie_id}
        width={CARD_WIDTH}
        height={POSTER_HEIGHT}
        borderRadius={radius.md}
      />
      <View style={styles.movieCardInfo}>
        <Text style={styles.movieTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.movieCardMeta}>
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
            >
              <Trash2 size={13} color="#EF4444" />
            </IOSPressable>
          )}
        </View>
      </View>
    </IOSPressable>
  );
}

function ProfileView() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const qc = useQueryClient();

  // Navigation & Tab State
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [postsFilter, setPostsFilter] = useState<'all' | 'take' | 'watching' | 'archived'>('all');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState<SocialPost | null>(null);

  // 1. User's 24h Active Stories (for Instagram Gradient Ring)
  const { data: myStories = [], refetch: refetchMyStories } = useQuery<Story[]>({
    queryKey: ['stories', 'my'],
    queryFn: () => storiesApi.getMy(),
    staleTime: 30 * 1000,
  });

  const hasActiveStory = myStories.length > 0;

  const myStoryGroup: UserStoryGroup[] =
    user && hasActiveStory
      ? [
          {
            user_id: user.id,
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
            stories: myStories,
            latest_created_at: myStories[myStories.length - 1]?.created_at || '',
          },
        ]
      : [];

  // 2. User's Own Social Posts (including archived)
  const {
    data: mySocialPosts = [],
    isLoading: myPostsLoading,
    refetch: refetchMyPosts,
  } = useQuery({
    queryKey: ['social', 'my', 'posts'],
    queryFn: () => socialApi.getMyPosts(true),
    staleTime: 30 * 1000,
  });

  const activeMyPosts = mySocialPosts.filter((p) => !p.is_archived);
  const archivedMyPosts = mySocialPosts.filter((p) => !!p.is_archived);

  // Determine what to show in the 3-column posts grid (strictly the user's own posts)
  let displayedPosts: SocialPost[] = [];
  if (postsFilter === 'archived') {
    displayedPosts = archivedMyPosts;
  } else if (postsFilter === 'take') {
    displayedPosts = activeMyPosts.filter((p) => p.post_type === 'take' || !p.post_type);
  } else if (postsFilter === 'watching') {
    displayedPosts = activeMyPosts.filter((p) => p.post_type === 'watching' || p.post_type === 'log');
  } else {
    // 'all': all active posts created by the user
    displayedPosts = activeMyPosts;
  }

  // Chunk displayed posts into rows of 3 to eliminate flexWrap subpixel overflow
  const postRows = useMemo(() => {
    const rows: SocialPost[][] = [];
    for (let i = 0; i < displayedPosts.length; i += 3) {
      rows.push(displayedPosts.slice(i, i + 3));
    }
    return rows;
  }, [displayedPosts]);

  // 4. All Other User Things (Favorites, Watchlist, Watched, Reviews, Collections, Tierlists, Groups)
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

  const { data: tierLists = [], isLoading: tierlistsLoading } = useQuery({
    queryKey: ['tierlists', 'all'],
    queryFn: () => tierlistsApi.all(),
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => request<any[]>(() => api.get('/groups')),
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

  // Handlers for deleting/removing items
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

  const handlePostDeleted = useCallback(
    (postId: number) => {
      qc.setQueryData<SocialPost[]>(['social', 'my', 'posts'], (old) =>
        old ? old.filter((p) => p.id !== postId) : []
      );
      qc.invalidateQueries({ queryKey: ['social'] });
      if (selectedPostDetail?.id === postId) {
        setSelectedPostDetail(null);
      }
    },
    [qc, selectedPostDetail?.id]
  );

  const handlePostArchived = useCallback(
    (postId: number, isArchivedState: boolean) => {
      qc.setQueryData<SocialPost[]>(['social', 'my', 'posts'], (old) =>
        old
          ? old.map((p) =>
              p.id === postId ? { ...p, is_archived: isArchivedState } : p
            )
          : []
      );
      qc.invalidateQueries({ queryKey: ['social'] });
      if (selectedPostDetail?.id === postId) {
        setSelectedPostDetail((prev) =>
          prev ? { ...prev, is_archived: isArchivedState } : null
        );
      }
    },
    [qc, selectedPostDetail?.id]
  );

  const handleReact = useCallback(
    async (postId: number, reactionType: string) => {
      try {
        const updatedPost = await socialApi.react(postId, reactionType);
        qc.setQueryData<SocialPost[]>(['social', 'my', 'posts'], (old) =>
          old ? old.map((p) => (p.id === postId ? updatedPost : p)) : []
        );
        qc.setQueryData<SocialPost[]>(['social', 'feed', 'discover'], (old) =>
          old ? old.map((p) => (p.id === postId ? updatedPost : p)) : []
        );
        if (selectedPostDetail?.id === postId) {
          setSelectedPostDetail(updatedPost);
        }
      } catch {
        qc.invalidateQueries({ queryKey: ['social'] });
      }
    },
    [qc, selectedPostDetail?.id]
  );

  const confirmLogout = () => {
    setIsMenuSheetOpen(false);
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Plotmint?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out @${user?.username || 'cinephile'}'s film profile on Plotmint!`,
      });
    } catch {
      // quiet
    }
  };

  // Render Post Grid Item (Instagram 3-column square)
  const renderGridPost = (item: SocialPost) => {
    const poster =
      posterUrl(item.payload?.poster_path || item.movie?.poster_path, 'w342') ||
      backdropUrl(item.payload?.backdrop_path || item.movie?.backdrop_path, 'w780');

    return (
      <IOSPressable
        key={item.id}
        style={styles.gridSquare}
        onPress={() => setSelectedPostDetail(item)}
        activeScale={0.97}
      >
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <LinearGradient
            colors={['#252532', '#14141C']}
            style={[StyleSheet.absoluteFillObject, styles.textGridCard]}
          >
            <Film size={18} color={colors.primary} />
            <Text style={styles.gridExcerptText} numberOfLines={3}>
              {item.content || item.movie_title || 'Film Moment'}
            </Text>
            <View style={styles.gridTypeBadge}>
              <Text style={styles.gridTypeBadgeText}>
                {item.post_type?.toUpperCase() || 'TAKE'}
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Bottom Overlay Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gridOverlay}
        />

        <View style={styles.gridStatChips}>
          <View style={styles.gridStatItem}>
            <Heart size={10} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.gridStatText}>{item.reactions?.length || 0}</Text>
          </View>
          {item.comments_count > 0 && (
            <View style={styles.gridStatItem}>
              <MessageCircle size={10} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.gridStatText}>{item.comments_count}</Text>
            </View>
          )}
        </View>
      </IOSPressable>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── 1. Top Bar: Username Dropdown, '+' Create, '☰' Menu ── */}
      <View style={styles.topBar}>
        <IOSPressable style={styles.usernameDropdownBtn} activeScale={0.96}>
          <Text style={styles.topUsername} numberOfLines={1}>
            {user?.username || user?.name || 'profile'}
          </Text>
          <ChevronDown size={15} color="#FFFFFF" strokeWidth={2.5} />
        </IOSPressable>

        <View style={styles.topBarActions}>
          <IOSPressable
            style={styles.iconButton}
            onPress={() => setIsCreateSheetOpen(true)}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel="Create"
          >
            <Plus size={22} color="#FFFFFF" strokeWidth={2.4} />
          </IOSPressable>

          <IOSPressable
            style={styles.iconButton}
            onPress={() => setIsMenuSheetOpen(true)}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel="Menu"
          >
            <Menu size={22} color="#FFFFFF" strokeWidth={2.2} />
          </IOSPressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 2. Profile Header: Avatar with Story Ring & 3 Stats ── */}
        <View style={styles.headerSection}>
          <View style={styles.avatarStatsRow}>
            {/* Avatar with Instagram Story Gradient Ring */}
            <View style={styles.avatarWrapper}>
              <IOSPressable
                onPress={() => {
                  if (hasActiveStory) {
                    setIsStoryViewerOpen(true);
                  } else {
                    setIsCreateStoryOpen(true);
                  }
                }}
                activeScale={0.93}
                accessibilityRole="button"
                accessibilityLabel="Profile Story"
              >
                {hasActiveStory ? (
                  <LinearGradient
                    colors={INSTA_STORY_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarStoryRing}
                  >
                    <View style={styles.avatarInnerGap}>
                      <Avatar
                        src={user?.avatar_url}
                        seed={user?.username || user?.name}
                        name={user?.name}
                        size={78}
                        borderRadius={39}
                      />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.avatarPlainRing}>
                    <Avatar
                      src={user?.avatar_url}
                      seed={user?.username || user?.name}
                      name={user?.name}
                      size={78}
                      borderRadius={39}
                    />
                  </View>
                )}
              </IOSPressable>

              {/* Blue Plus Badge to add a story */}
              <IOSPressable
                style={styles.avatarPlusBadge}
                onPress={() => setIsCreateStoryOpen(true)}
                hitSlop={6}
                activeScale={0.88}
                accessibilityRole="button"
                accessibilityLabel="Add Story"
              >
                <Plus size={12} color="#FFFFFF" strokeWidth={3} />
              </IOSPressable>
            </View>

            {/* 3 Stats Columns: Posts, Followers, Following */}
            <View style={styles.statsContainer}>
              <IOSPressable
                style={styles.statColumn}
                onPress={() => setActiveTab('posts')}
                activeScale={0.94}
              >
                <Text style={styles.statNumber}>
                  {activeMyPosts.length}
                </Text>
                <Text style={styles.statLabel}>Posts</Text>
              </IOSPressable>

              <IOSPressable
                style={styles.statColumn}
                onPress={() => {
                  setFollowModalTab('followers');
                  setIsFollowModalOpen(true);
                }}
                activeScale={0.94}
              >
                <Text style={styles.statNumber}>{followers.length}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </IOSPressable>

              <IOSPressable
                style={styles.statColumn}
                onPress={() => {
                  setFollowModalTab('following');
                  setIsFollowModalOpen(true);
                }}
                activeScale={0.94}
              >
                <Text style={styles.statNumber}>{following.length}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </IOSPressable>
            </View>
          </View>

          {/* ── 3. Bio Block ── */}
          <View style={styles.bioSection}>
            <Text style={styles.displayName}>{user?.name || 'Cinephile'}</Text>
            <Text style={styles.userHandle}>
              @{user?.username || user?.name.toLowerCase().replace(/\s/g, '')}
            </Text>

            {user?.bio ? (
              <Text style={styles.bioText}>{user.bio}</Text>
            ) : (
              <Text style={styles.bioTextMuted}>
                Curating film favorites, hot takes, and cinema moments.
              </Text>
            )}

            <View style={styles.bioCineTags}>
              <Text style={styles.cineTag}>🎬 {watched.length} Watched</Text>
              <Text style={styles.cineTagBullet}>•</Text>
              <Text style={styles.cineTag}>⭐ {reviews.length} Reviews</Text>
              <Text style={styles.cineTagBullet}>•</Text>
              <Text style={styles.cineTag}>❤️ {favs.length} Favs</Text>
            </View>
          </View>

          {/* ── 4. Action Buttons ── */}
          <View style={styles.actionButtonsRow}>
            <IOSPressable
              style={styles.primaryActionButton}
              onPress={() => setIsEditModalOpen(true)}
              activeScale={0.94}
            >
              <Text style={styles.actionButtonText}>Edit profile</Text>
            </IOSPressable>

            <IOSPressable
              style={styles.primaryActionButton}
              onPress={handleShareProfile}
              activeScale={0.94}
            >
              <Text style={styles.actionButtonText}>Share profile</Text>
            </IOSPressable>

            <IOSPressable
              style={styles.avatarStudioSmallBtn}
              onPress={() => setIsAvatarModalOpen(true)}
              activeScale={0.92}
              accessibilityRole="button"
              accessibilityLabel="Avatar Studio"
            >
              <Camera size={16} color="#FFFFFF" />
            </IOSPressable>
          </View>

          {/* ── 5. Story Highlights (Circular Bubbles) ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsScroll}
          >
            <IOSPressable
              style={styles.highlightItem}
              onPress={() => setActiveTab('favorites')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'favorites' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(239,68,68,0.15)' },
                ]}
              >
                <Heart size={20} color="#EF4444" fill="#EF4444" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                Favs ({favs.length})
              </Text>
            </IOSPressable>

            <IOSPressable
              style={styles.highlightItem}
              onPress={() => setActiveTab('watched')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'watched' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(16,185,129,0.15)' },
                ]}
              >
                <Eye size={20} color="#10B981" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                Watched ({watched.length})
              </Text>
            </IOSPressable>

            <IOSPressable
              style={styles.highlightItem}
              onPress={() => setActiveTab('watchlist')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'watchlist' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(59,130,246,0.15)' },
                ]}
              >
                <Clock size={20} color="#3B82F6" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                Watchlist ({watchlist.length})
              </Text>
            </IOSPressable>

            <IOSPressable
              style={styles.highlightItem}
              onPress={() => setActiveTab('reviews')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'reviews' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(255,193,7,0.15)' },
                ]}
              >
                <Star size={20} color="#FFC107" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                Reviews ({reviews.length})
              </Text>
            </IOSPressable>

            <IOSPressable
              style={styles.highlightItem}
              onPress={() => setActiveTab('collections')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'collections' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(139,92,246,0.15)' },
                ]}
              >
                <LayoutGrid size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                Playlists ({collections.length})
              </Text>
            </IOSPressable>

            <IOSPressable
              style={styles.highlightItem}
              onPress={() => setActiveTab('tierlists')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'tierlists' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(249,115,22,0.15)' },
                ]}
              >
                <TrendingUp size={20} color="#F97316" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                Rankings
              </Text>
            </IOSPressable>

            <IOSPressable
              style={styles.highlightItem}
              onPress={() => setActiveTab('groups')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'groups' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(236,72,153,0.15)' },
                ]}
              >
                <Users size={20} color="#EC4899" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                Clubs ({groups.length})
              </Text>
            </IOSPressable>

            <IOSPressable
              style={styles.highlightItem}
              onPress={() => setIsCreateStoryOpen(true)}
              activeScale={0.92}
            >
              <View style={[styles.highlightCircle, styles.newHighlightCircle]}>
                <Plus size={22} color="rgba(255,255,255,0.7)" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                New Take
              </Text>
            </IOSPressable>
          </ScrollView>
        </View>

        {/* ── 6. Instagram Content Tabs Bar ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollRow}
        >
          <IOSPressable
            style={[styles.tabButton, activeTab === 'posts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('posts')}
            activeScale={0.96}
          >
            <Grid3X3
              size={20}
              color={activeTab === 'posts' ? '#FFFFFF' : 'rgba(255,255,255,0.45)'}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === 'posts' && styles.tabButtonLabelActive,
              ]}
            >
              Posts ({activeMyPosts.length})
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.tabButton, activeTab === 'favorites' && styles.tabButtonActive]}
            onPress={() => setActiveTab('favorites')}
            activeScale={0.96}
          >
            <Heart
              size={18}
              color={activeTab === 'favorites' ? '#EF4444' : 'rgba(255,255,255,0.45)'}
              fill={activeTab === 'favorites' ? '#EF4444' : 'transparent'}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === 'favorites' && styles.tabButtonLabelActive,
              ]}
            >
              Favs ({favs.length})
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.tabButton, activeTab === 'watchlist' && styles.tabButtonActive]}
            onPress={() => setActiveTab('watchlist')}
            activeScale={0.96}
          >
            <Clock
              size={18}
              color={activeTab === 'watchlist' ? '#3B82F6' : 'rgba(255,255,255,0.45)'}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === 'watchlist' && styles.tabButtonLabelActive,
              ]}
            >
              Watchlist ({watchlist.length})
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.tabButton, activeTab === 'watched' && styles.tabButtonActive]}
            onPress={() => setActiveTab('watched')}
            activeScale={0.96}
          >
            <Eye
              size={18}
              color={activeTab === 'watched' ? '#10B981' : 'rgba(255,255,255,0.45)'}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === 'watched' && styles.tabButtonLabelActive,
              ]}
            >
              Watched ({watched.length})
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.tabButton, activeTab === 'reviews' && styles.tabButtonActive]}
            onPress={() => setActiveTab('reviews')}
            activeScale={0.96}
          >
            <Star
              size={18}
              color={activeTab === 'reviews' ? '#FFC107' : 'rgba(255,255,255,0.45)'}
              fill={activeTab === 'reviews' ? '#FFC107' : 'transparent'}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === 'reviews' && styles.tabButtonLabelActive,
              ]}
            >
              Reviews ({reviews.length})
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.tabButton, activeTab === 'collections' && styles.tabButtonActive]}
            onPress={() => setActiveTab('collections')}
            activeScale={0.96}
          >
            <LayoutGrid
              size={18}
              color={activeTab === 'collections' ? '#8B5CF6' : 'rgba(255,255,255,0.45)'}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === 'collections' && styles.tabButtonLabelActive,
              ]}
            >
              Playlists ({collections.length})
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.tabButton, activeTab === 'tierlists' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tierlists')}
            activeScale={0.96}
          >
            <TrendingUp
              size={18}
              color={activeTab === 'tierlists' ? '#F97316' : 'rgba(255,255,255,0.45)'}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === 'tierlists' && styles.tabButtonLabelActive,
              ]}
            >
              Tier Lists
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.tabButton, activeTab === 'groups' && styles.tabButtonActive]}
            onPress={() => setActiveTab('groups')}
            activeScale={0.96}
          >
            <Users
              size={18}
              color={activeTab === 'groups' ? '#EC4899' : 'rgba(255,255,255,0.45)'}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === 'groups' && styles.tabButtonLabelActive,
              ]}
            >
              Groups ({groups.length})
            </Text>
          </IOSPressable>
        </ScrollView>

        {/* ── 7. Tab Contents ── */}

        {/* Tab: POSTS (3-Column Square Grid) */}
        {activeTab === 'posts' && (
          <View style={styles.gridContainer}>
            {/* Filter Pills: All Posts | Takes | Watching | Archive */}
            <View style={styles.postsFilterRow}>
              <IOSPressable
                style={[
                  styles.postsFilterPill,
                  postsFilter === 'all' && styles.postsFilterPillActive,
                ]}
                onPress={() => setPostsFilter('all')}
                activeScale={0.94}
              >
                <Grid3X3 size={12} color={postsFilter === 'all' ? '#000' : '#FFF'} />
                <Text
                  style={[
                    styles.postsFilterText,
                    postsFilter === 'all' && styles.postsFilterTextActive,
                  ]}
                >
                  All Posts ({activeMyPosts.length})
                </Text>
              </IOSPressable>

              <IOSPressable
                style={[
                  styles.postsFilterPill,
                  postsFilter === 'take' && styles.postsFilterPillActive,
                ]}
                onPress={() => setPostsFilter('take')}
                activeScale={0.94}
              >
                <Flame size={12} color={postsFilter === 'take' ? '#000' : '#FFF'} />
                <Text
                  style={[
                    styles.postsFilterText,
                    postsFilter === 'take' && styles.postsFilterTextActive,
                  ]}
                >
                  Takes
                </Text>
              </IOSPressable>

              <IOSPressable
                style={[
                  styles.postsFilterPill,
                  postsFilter === 'watching' && styles.postsFilterPillActive,
                ]}
                onPress={() => setPostsFilter('watching')}
                activeScale={0.94}
              >
                <Tv size={12} color={postsFilter === 'watching' ? '#000' : '#FFF'} />
                <Text
                  style={[
                    styles.postsFilterText,
                    postsFilter === 'watching' && styles.postsFilterTextActive,
                  ]}
                >
                  Watching
                </Text>
              </IOSPressable>

              <IOSPressable
                style={[
                  styles.postsFilterPill,
                  postsFilter === 'archived' && styles.postsFilterPillActive,
                ]}
                onPress={() => setPostsFilter('archived')}
                activeScale={0.94}
              >
                <Archive size={12} color={postsFilter === 'archived' ? '#000' : '#FFF'} />
                <Text
                  style={[
                    styles.postsFilterText,
                    postsFilter === 'archived' && styles.postsFilterTextActive,
                  ]}
                >
                  Archive ({archivedMyPosts.length})
                </Text>
              </IOSPressable>
            </View>

            {myPostsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : displayedPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Film size={40} color="rgba(255,255,255,0.25)" />
                <Text style={styles.emptyTitle}>
                  {postsFilter === 'archived' ? 'Archive is empty' : 'No posts yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {postsFilter === 'archived'
                    ? 'Posts you archive are stored here safely.'
                    : 'Share a movie hot take, scene moment, or review!'}
                </Text>
                {postsFilter !== 'archived' && (
                  <IOSPressable
                    style={styles.emptyActionBtn}
                    onPress={() => setIsComposerOpen(true)}
                    activeScale={0.92}
                  >
                    <Text style={styles.emptyActionBtnText}>Share a Hot Take</Text>
                  </IOSPressable>
                )}
              </View>
            ) : (
              <View style={styles.rowsGridContainer}>
                {postRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.gridRow}>
                    {row.map(renderGridPost)}
                    {row.length < 3 &&
                      Array.from({ length: 3 - row.length }).map((_, emptyIdx) => (
                        <View key={`empty-${emptyIdx}`} style={styles.emptyGridSlot} />
                      ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab: FAVORITES */}
        {activeTab === 'favorites' && (
          <View style={styles.tabContentContainer}>
            {favsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : favs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Heart size={40} color="#EF4444" />
                <Text style={styles.emptyTitle}>No favorite movies saved</Text>
                <Text style={styles.emptySub}>
                  Browse films and tap the heart icon to save your all-time favorites.
                </Text>
              </View>
            ) : (
              <View style={styles.cardsGridWrap}>
                {favs.map((item) => (
                  <ProfileMovieCard
                    key={item.movie_id}
                    item={item}
                    onRemove={handleRemoveFavorite}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab: WATCHLIST */}
        {activeTab === 'watchlist' && (
          <View style={styles.tabContentContainer}>
            {watchlistLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : watchlist.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Clock size={40} color="#3B82F6" />
                <Text style={styles.emptyTitle}>Watchlist is empty</Text>
                <Text style={styles.emptySub}>
                  Save films you plan to watch later on your movie watchlist.
                </Text>
              </View>
            ) : (
              <View style={styles.cardsGridWrap}>
                {watchlist.map((item) => (
                  <ProfileMovieCard
                    key={item.movie_id}
                    item={item}
                    onRemove={handleRemoveWatchlist}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab: WATCHED */}
        {activeTab === 'watched' && (
          <View style={styles.tabContentContainer}>
            {watchedLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : watched.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Eye size={40} color="#10B981" />
                <Text style={styles.emptyTitle}>No watched films logged</Text>
                <Text style={styles.emptySub}>
                  Keep track of movies you've completed by logging them as watched.
                </Text>
              </View>
            ) : (
              <View style={styles.cardsGridWrap}>
                {watched.map((item) => (
                  <ProfileMovieCard
                    key={item.movie_id}
                    item={item}
                    onRemove={handleRemoveWatched}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab: REVIEWS */}
        {activeTab === 'reviews' && (
          <View style={styles.tabContentContainer}>
            {reviewsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Star size={40} color="#FFC107" />
                <Text style={styles.emptyTitle}>No reviews logged yet</Text>
                <Text style={styles.emptySub}>
                  Rate and leave your verdicts on films you watch.
                </Text>
              </View>
            ) : (
              <View style={styles.listWrap}>
                {reviews.map((rev) => (
                  <View key={rev.id || rev.movie_id} style={styles.reviewCard}>
                    <View style={styles.reviewCardHeader}>
                      <Text style={styles.reviewMovieTitle} numberOfLines={1}>
                        {rev.title || `Movie #${rev.movie_id}`}
                      </Text>
                      <View style={styles.reviewStarBadge}>
                        <Star size={11} color="#FFC107" fill="#FFC107" />
                        <Text style={styles.reviewStarText}>{rev.label || 'Rated'}</Text>
                      </View>
                    </View>
                    {rev.review_text ? (
                      <Text style={styles.reviewContent}>{rev.review_text}</Text>
                    ) : null}
                    <IOSPressable
                      style={styles.reviewDeleteBtn}
                      onPress={() => handleDeleteReview(rev.movie_id)}
                      activeScale={0.9}
                    >
                      <Trash2 size={12} color="#EF4444" />
                      <Text style={styles.reviewDeleteText}>Delete</Text>
                    </IOSPressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab: COLLECTIONS */}
        {activeTab === 'collections' && (
          <View style={styles.tabContentContainer}>
            {collectionsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : collections.length === 0 ? (
              <View style={styles.emptyContainer}>
                <LayoutGrid size={40} color="#8B5CF6" />
                <Text style={styles.emptyTitle}>No playlists created</Text>
                <Text style={styles.emptySub}>
                  Build themed film collections and share them with the cinephile community.
                </Text>
              </View>
            ) : (
              <View style={styles.listWrap}>
                {collections.map((col) => (
                  <IOSPressable
                    key={col.id}
                    style={styles.colCard}
                    onPress={() => router.push(`/collections/${col.id}` as never)}
                    activeScale={0.97}
                  >
                    <View style={[styles.colIcon, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                      <LayoutGrid size={18} color="#8B5CF6" />
                    </View>
                    <View style={styles.colInfo}>
                      <Text style={styles.colTitle}>{col.name || col.title}</Text>
                      <Text style={styles.colSub}>{col.item_count || 12} films in playlist</Text>
                    </View>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </IOSPressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab: TIER LISTS */}
        {activeTab === 'tierlists' && (
          <View style={styles.tabContentContainer}>
            {tierlistsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : tierLists.length === 0 ? (
              <View style={styles.emptyContainer}>
                <TrendingUp size={40} color="#F97316" />
                <Text style={styles.emptyTitle}>No tier lists created</Text>
                <Text style={styles.emptySub}>Rank movies by creating S/A/B/C tier lists.</Text>
                <IOSPressable
                  style={styles.emptyActionBtn}
                  onPress={() => router.push('/tierlist' as never)}
                  activeScale={0.92}
                >
                  <Text style={styles.emptyActionBtnText}>Create Tier List</Text>
                </IOSPressable>
              </View>
            ) : (
              <View style={styles.listWrap}>
                {tierLists.map((tl, i) => (
                  <IOSPressable
                    key={tl.id || i}
                    style={styles.colCard}
                    onPress={() => router.push('/tierlist' as never)}
                    activeScale={0.97}
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
            )}
          </View>
        )}

        {/* Tab: GROUPS */}
        {activeTab === 'groups' && (
          <View style={styles.tabContentContainer}>
            {groupsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : groups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={40} color="#EC4899" />
                <Text style={styles.emptyTitle}>No groups joined</Text>
                <Text style={styles.emptySub}>
                  Join movie clubs and franchise debates across the platform.
                </Text>
              </View>
            ) : (
              <View style={styles.listWrap}>
                {groups.map((group) => (
                  <IOSPressable
                    key={group.id}
                    style={styles.colCard}
                    onPress={() => router.push('/groups' as never)}
                    activeScale={0.97}
                  >
                    <View style={[styles.colIcon, { backgroundColor: 'rgba(236,72,153,0.15)' }]}>
                      <Users size={18} color="#EC4899" />
                    </View>
                    <View style={styles.colInfo}>
                      <Text style={styles.colTitle}>{group.name}</Text>
                      <Text style={styles.colSub}>
                        {group.member_count || group.members_count || 120} cinephiles
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </IOSPressable>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── 8. Post Detail Modal with 3-Dots Menu (Archive & Delete) ── */}
      <Modal
        visible={selectedPostDetail !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPostDetail(null)}
      >
        <View style={[styles.detailModalRoot, { paddingTop: insets.top + 10 }]}>
          <View style={styles.detailModalHeader}>
            <Text style={styles.detailModalTitle}>Post</Text>
            <IOSPressable
              style={styles.modalCloseBtn}
              onPress={() => setSelectedPostDetail(null)}
              activeScale={0.88}
            >
              <X size={20} color="#FFFFFF" />
            </IOSPressable>
          </View>

          {selectedPostDetail && (
            <ScrollView
              contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
              keyboardShouldPersistTaps="handled"
            >
              <FeedPostCard
                post={selectedPostDetail}
                currentUserId={user?.id}
                onReact={handleReact}
                onPostDeleted={handlePostDeleted}
                onPostArchived={handlePostArchived}
              />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* ── 9. Quick Create Sheet ('+') ── */}
      <Modal
        visible={isCreateSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateSheetOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsCreateSheetOpen(false)}>
          <View style={styles.optionsBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.optionsSheet, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.optionsHandleBar} />
                <Text style={styles.sheetHeaderTitle}>Create</Text>

                <IOSPressable
                  style={styles.optionRow}
                  onPress={() => {
                    setIsCreateSheetOpen(false);
                    setIsComposerOpen(true);
                  }}
                  activeScale={0.96}
                >
                  <Film size={20} color="#FFFFFF" />
                  <Text style={styles.optionText}>New Post / Take</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionRow}
                  onPress={() => {
                    setIsCreateSheetOpen(false);
                    setIsCreateStoryOpen(true);
                  }}
                  activeScale={0.96}
                >
                  <Camera size={20} color="#FFFFFF" />
                  <Text style={styles.optionText}>Add Story (24h)</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionRow}
                  onPress={() => {
                    setIsCreateSheetOpen(false);
                    router.push('/tierlist' as never);
                  }}
                  activeScale={0.96}
                >
                  <TrendingUp size={20} color="#FFFFFF" />
                  <Text style={styles.optionText}>New Tier List</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionCancelBtn}
                  onPress={() => setIsCreateSheetOpen(false)}
                  activeScale={0.96}
                >
                  <Text style={styles.optionCancelText}>Cancel</Text>
                </IOSPressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── 10. Hamburger Menu Sheet ('☰') ── */}
      <Modal
        visible={isMenuSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuSheetOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuSheetOpen(false)}>
          <View style={styles.optionsBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.optionsSheet, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.optionsHandleBar} />
                <Text style={styles.sheetHeaderTitle}>Menu</Text>

                <IOSPressable
                  style={styles.optionRow}
                  onPress={() => {
                    setIsMenuSheetOpen(false);
                    setActiveTab('posts');
                    setPostsFilter('archived');
                  }}
                  activeScale={0.96}
                >
                  <Archive size={20} color="#FFFFFF" />
                  <Text style={styles.optionText}>Archive ({archivedMyPosts.length})</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionRow}
                  onPress={() => {
                    setIsMenuSheetOpen(false);
                    setIsAvatarModalOpen(true);
                  }}
                  activeScale={0.96}
                >
                  <Camera size={20} color="#FFFFFF" />
                  <Text style={styles.optionText}>Avatar Studio</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionRow}
                  onPress={() => {
                    setIsMenuSheetOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  activeScale={0.96}
                >
                  <Edit size={20} color="#FFFFFF" />
                  <Text style={styles.optionText}>Edit Profile</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionRowDestructive}
                  onPress={confirmLogout}
                  activeScale={0.96}
                >
                  <LogOut size={20} color="#EF4444" />
                  <Text style={styles.optionTextDestructive}>Sign Out</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionCancelBtn}
                  onPress={() => setIsMenuSheetOpen(false)}
                  activeScale={0.96}
                >
                  <Text style={styles.optionCancelText}>Cancel</Text>
                </IOSPressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── 11. Full-Screen CineStory Modal (Real Backend Data) ── */}
      <CineStoryViewerModal
        visible={isStoryViewerOpen}
        userGroups={myStoryGroup}
        initialUserIndex={0}
        onClose={() => {
          setIsStoryViewerOpen(false);
          refetchMyStories();
        }}
      />

      {/* ── 12. Create Story Modal ── */}
      <CreateStoryModal
        visible={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={() => {
          refetchMyStories();
          qc.invalidateQueries({ queryKey: ['stories'] });
        }}
      />

      {/* ── 13. Post Composer Modal ── */}
      <PostComposerModal
        visible={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onPostCreated={() => {
          refetchMyPosts();
          qc.invalidateQueries({ queryKey: ['social'] });
        }}
      />

      {/* ── 14. Edit Profile Modal ── */}
      <ProfileEditModal
        visible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* ── 15. Avatar Studio Modal ── */}
      <AvatarModal
        visible={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />

      {/* ── 16. Followers / Following Modal ── */}
      <FollowModal
        visible={isFollowModalOpen}
        userId={user?.id || 0}
        initialTab={followModalTab}
        onClose={() => setIsFollowModalOpen(false)}
      />

      {/* ── 17. Post Detail Modal ── */}
      <Modal
        visible={selectedPostDetail !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPostDetail(null)}
      >
        <View style={[styles.detailModalRoot, { paddingTop: insets.top + 10 }]}>
          <View style={styles.detailModalHeader}>
            <Text style={styles.detailModalTitle}>Post</Text>
            <IOSPressable
              style={styles.modalCloseBtn}
              onPress={() => setSelectedPostDetail(null)}
              activeScale={0.88}
              accessibilityRole="button"
              accessibilityLabel="Close post"
            >
              <X size={20} color="#FFFFFF" />
            </IOSPressable>
          </View>

          {selectedPostDetail && (
            <ScrollView
              contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
              keyboardShouldPersistTaps="handled"
            >
              <FeedPostCard
                post={selectedPostDetail}
                currentUserId={user?.id}
                onReact={handleReact}
                onNavigate={() => setSelectedPostDetail(null)}
              />
            </ScrollView>
          )}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  usernameDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
  },
  topUsername: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarWrapper: {
    position: 'relative',
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStoryRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlainRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerGap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0095F6',
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginLeft: 16,
  },
  statColumn: {
    alignItems: 'center',
    minWidth: 60,
  },
  statNumber: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  bioSection: {
    marginTop: 12,
  },
  displayName: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
  userHandle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  bioText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#E0E0E0',
    lineHeight: 18,
    marginTop: 6,
  },
  bioTextMuted: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 17,
    marginTop: 6,
  },
  bioCineTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  cineTag: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.primary,
  },
  cineTagBullet: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 7,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  avatarStudioSmallBtn: {
    width: 36,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightsScroll: {
    paddingVertical: 16,
    gap: 12,
    alignItems: 'center',
  },
  highlightItem: {
    alignItems: 'center',
    width: 68,
  },
  highlightCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  highlightCircleActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  newHighlightCircle: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
  },
  highlightLabel: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: '#E0E0E0',
    marginTop: 5,
    textAlign: 'center',
    maxWidth: 66,
  },
  tabScrollRow: {
    paddingHorizontal: 12,
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  tabButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  tabButtonLabelActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bodySemi,
  },
  gridContainer: {
    flex: 1,
  },
  postsFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  postsFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  postsFilterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  postsFilterText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFFFFF',
  },
  postsFilterTextActive: {
    color: '#000000',
  },
  rowsGridContainer: {
    width: '100%',
    paddingHorizontal: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  gridSquare: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#1C1C24',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 3,
  },
  emptyGridSlot: {
    flex: 1,
    aspectRatio: 1,
  },
  textGridCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 5,
  },
  gridExcerptText: {
    fontFamily: fonts.body,
    fontSize: 9.5,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 13,
  },
  gridTypeBadge: {
    backgroundColor: 'rgba(229,9,20,0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  gridTypeBadgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 7.5,
    color: colors.primary,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  gridStatChips: {
    position: 'absolute',
    bottom: 4,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridStatText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9.5,
    color: '#FFFFFF',
  },
  tabContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
  },
  cardsGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  movieCard: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  movieCardInfo: {
    padding: 10,
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  movieCardMeta: {
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
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  listWrap: {
    gap: 10,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewMovieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  reviewStarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,193,7,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  reviewStarText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFC107',
  },
  reviewContent: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 16,
  },
  reviewDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  reviewDeleteText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#EF4444',
  },
  colCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  colIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
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
  },
  emptyActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginTop: 10,
  },
  emptyActionBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  loader: {
    marginVertical: 40,
  },
  detailModalRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailModalTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: '#1E1E26',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  optionsHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeaderTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionRowDestructive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: '#FFFFFF',
  },
  optionTextDestructive: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: '#EF4444',
  },
  optionCancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  optionCancelText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: '#FFFFFF',
  },
  detailModalRoot: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailModalTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
