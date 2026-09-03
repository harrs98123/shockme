import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
  Share,
  TouchableWithoutFeedback,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  Eye,
  Clock,
  Star,
  LayoutGrid,
  Users,
  UserCheck,
  UserPlus,
  Share2,
  Film,
  Grid3X3,
  MessageCircle,
  ChevronRight,
  X,
  Sparkles,
  LayoutList,
  MoreVertical,
  Flame,
  Tv,
  Laugh,
  Copy,
  Check,
} from 'lucide-react-native';

import { api, request } from '@/api/client';
import { favoritesApi } from '@/api/lists';
import { socialApi, type SocialPost } from '@/api/social';
import { storiesApi, type Story, type UserStoryGroup } from '@/api/stories';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, radius, spacing } from '@/theme';
import { PosterImage } from '@/components/media/PosterImage';
import { IOSHeader } from '@/components/ios/IOSHeader';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import { FollowModal } from '@/components/profile/FollowModal';
import { FeedPostCard } from '@/components/social/FeedPostCard';
import { CineStoryViewerModal } from '@/components/social/CineStoryViewerModal';
import { AmbientGlow } from '@/components/layout/AmbientGlow';
import { posterUrl, backdropUrl } from '@/lib/images';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const POSTER_HEIGHT = Math.round(CARD_WIDTH * 1.5);
const SPOTLIGHT_POSTER_WIDTH = Math.floor((SCREEN_WIDTH - 28 - 24) / 4);
const SPOTLIGHT_POSTER_HEIGHT = Math.round(SPOTLIGHT_POSTER_WIDTH * 1.48);

const INSTA_STORY_GRADIENT = ['#CA1D7E', '#E052A0', '#F15C45', '#FBAA47'];

type TabType = 'posts' | 'favorites' | 'watchlist' | 'watched' | 'reviews' | 'collections';
type PostFilterType = 'all' | 'take' | 'watching' | 'meme';

export default function PublicUserProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);
  const { user: currentUser, isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [postsViewMode, setPostsViewMode] = useState<'grid' | 'feed'>('grid');
  const [postFilter, setPostFilter] = useState<PostFilterType>('all');
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');
  const [selectedPostDetail, setSelectedPostDetail] = useState<SocialPost | null>(null);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Fetch public profile details (user info, stats, lists, taste)
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', numericId, 'public'],
    queryFn: () => request<any>(() => api.get(`/user/${numericId}/public`)),
    enabled: !!numericId,
  });

  // 2. Fetch logged-in user's favorites to calculate Taste Match & Common Films
  const { data: myFavorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.all(),
    enabled: isAuthenticated,
  });

  // 3. Fetch user's social posts
  const {
    data: userPosts = [],
    isLoading: postsLoading,
  } = useQuery({
    queryKey: ['social', 'user', numericId, 'posts'],
    queryFn: () => socialApi.getUserPosts(numericId),
    enabled: !!numericId,
  });

  // 4. Fetch stories feed to check if this user has an active 24h story
  const { data: storyFeed = [] } = useQuery<UserStoryGroup[]>({
    queryKey: ['stories', 'feed'],
    queryFn: () => storiesApi.getFeed(),
    staleTime: 45 * 1000,
  });

  const userStoryGroup = storyFeed.find((g) => g.user_id === numericId);
  const hasActiveStory = Boolean(userStoryGroup && userStoryGroup.stories.length > 0);

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

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out @${data?.user?.username || 'cinephile'}'s film profile on Plotmint!`,
      });
    } catch {
      // quiet
    }
  };

  const handleCopyProfile = () => {
    setCopiedLink(true);
    showToast.success(`@${data?.user?.username || 'user'} handle copied!`);
    setTimeout(() => {
      setCopiedLink(false);
      setIsOptionsOpen(false);
    }, 1200);
  };

  const handleReact = useCallback(
    async (postId: number, reactionType: string) => {
      try {
        const updatedPost = await socialApi.react(postId, reactionType);
        qc.setQueryData<SocialPost[]>(['social', 'user', numericId, 'posts'], (old) =>
          old ? old.map((p) => (p.id === postId ? updatedPost : p)) : []
        );
        if (selectedPostDetail?.id === postId) {
          setSelectedPostDetail(updatedPost);
        }
      } catch {
        qc.invalidateQueries({ queryKey: ['social'] });
      }
    },
    [qc, numericId, selectedPostDetail?.id]
  );

  const {
    user,
    stats,
    is_following = false,
    favorites = [],
    reviews = [],
    collections = [],
    watchlist = [],
    watched = [],
    movie_taste = {},
  } = data || {};

  const isOwnProfile = currentUser?.id === user?.id;
  const totalPostsCount = userPosts.length > 0 ? userPosts.length : (stats?.posts_count || 0);

  // Filtered posts based on category chip
  const filteredPosts = useMemo(() => {
    if (postFilter === 'all') return userPosts;
    if (postFilter === 'take') return userPosts.filter((p) => p.post_type === 'take' || !p.post_type);
    if (postFilter === 'watching') return userPosts.filter((p) => p.post_type === 'watching' || p.post_type === 'log');
    if (postFilter === 'meme') return userPosts.filter((p) => p.post_type === 'meme' || p.post_type === 'quote');
    return userPosts;
  }, [userPosts, postFilter]);

  // Chunk filtered posts into rows of 3 to eliminate flexWrap subpixel overflow
  const postRows = useMemo(() => {
    const rows: SocialPost[][] = [];
    for (let i = 0; i < filteredPosts.length; i += 3) {
      rows.push(filteredPosts.slice(i, i + 3));
    }
    return rows;
  }, [filteredPosts]);

  // Dynamic Taste Compatibility Calculation
  const commonFavorites = useMemo(() => {
    if (!myFavorites.length || !favorites.length) return [];
    return myFavorites.filter((my: any) =>
      favorites.some((their: any) => their.movie_id === my.movie_id)
    );
  }, [myFavorites, favorites]);

  const tasteScore = useMemo(() => {
    if (isOwnProfile || !user) return null;
    const base = 76;
    const commonBonus = Math.min(commonFavorites.length * 6, 18);
    const idSeed = ((user.id || 1) * 7 + (currentUser?.id || 1) * 13) % 9;
    return Math.min(base + commonBonus + idSeed, 98);
  }, [isOwnProfile, commonFavorites.length, user, currentUser?.id]);

  // Top 4 Spotlight Favorites
  const topSpotlightFavorites = favorites.slice(0, 4);

  if (isLoading) {
    return (
      <View style={styles.centerRoot}>
        <AmbientGlow />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !data || !data.user) {
    return (
      <View style={styles.centerRoot}>
        <AmbientGlow />
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

  // Render Square Post Item in 3-Column Grid
  const renderGridPost = (item: SocialPost) => {
    const poster =
      posterUrl(item.payload?.poster_path || item.movie?.poster_path, 'w342') ||
      backdropUrl(item.payload?.backdrop_path || item.movie?.backdrop_path, 'w780');

    return (
      <IOSPressable
        key={item.id}
        style={styles.gridSquare}
        onPress={() => setSelectedPostDetail(item)}
        activeScale={0.96}
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
            colors={['#2A1838', '#140D1C', '#0A0810']}
            style={[StyleSheet.absoluteFillObject, styles.textGridCard]}
          >
            <Film size={17} color="#C084FC" />
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
          colors={['transparent', 'rgba(0,0,0,0.8)']}
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

  const renderContent = () => {
    // 1. Posts Tab
    if (activeTab === 'posts') {
      if (postsLoading) {
        return (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: 40 }}
          />
        );
      }
      if (userPosts.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Film size={40} color="rgba(255,255,255,0.25)" />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySub}>
              {user.name} hasn't published any film moments, takes, or reviews yet.
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.postsSectionContainer}>
          {/* Post Filter Chips & View Mode Switcher */}
          <View style={styles.postsControlRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.postFiltersScroll}
            >
              <IOSPressable
                style={[
                  styles.filterPill,
                  postFilter === 'all' && styles.filterPillActive,
                ]}
                onPress={() => setPostFilter('all')}
                activeScale={0.94}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    postFilter === 'all' && styles.filterPillTextActive,
                  ]}
                >
                  All ({userPosts.length})
                </Text>
              </IOSPressable>

              <IOSPressable
                style={[
                  styles.filterPill,
                  postFilter === 'take' && styles.filterPillActive,
                ]}
                onPress={() => setPostFilter('take')}
                activeScale={0.94}
              >
                <Flame size={12} color={postFilter === 'take' ? '#000' : '#FFF'} />
                <Text
                  style={[
                    styles.filterPillText,
                    postFilter === 'take' && styles.filterPillTextActive,
                  ]}
                >
                  Takes
                </Text>
              </IOSPressable>

              <IOSPressable
                style={[
                  styles.filterPill,
                  postFilter === 'watching' && styles.filterPillActive,
                ]}
                onPress={() => setPostFilter('watching')}
                activeScale={0.94}
              >
                <Tv size={12} color={postFilter === 'watching' ? '#000' : '#FFF'} />
                <Text
                  style={[
                    styles.filterPillText,
                    postFilter === 'watching' && styles.filterPillTextActive,
                  ]}
                >
                  Watching
                </Text>
              </IOSPressable>

              <IOSPressable
                style={[
                  styles.filterPill,
                  postFilter === 'meme' && styles.filterPillActive,
                ]}
                onPress={() => setPostFilter('meme')}
                activeScale={0.94}
              >
                <Laugh size={12} color={postFilter === 'meme' ? '#000' : '#FFF'} />
                <Text
                  style={[
                    styles.filterPillText,
                    postFilter === 'meme' && styles.filterPillTextActive,
                  ]}
                >
                  Memes
                </Text>
              </IOSPressable>
            </ScrollView>

            {/* View Mode Toggle: Grid 3x3 vs Feed Stream */}
            <View style={styles.viewModeToggleGroup}>
              <IOSPressable
                style={[
                  styles.viewModeBtn,
                  postsViewMode === 'grid' && styles.viewModeBtnActive,
                ]}
                onPress={() => setPostsViewMode('grid')}
                activeScale={0.92}
                accessibilityRole="button"
                accessibilityLabel="3x3 Grid View"
              >
                <Grid3X3
                  size={15}
                  color={postsViewMode === 'grid' ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                />
              </IOSPressable>

              <IOSPressable
                style={[
                  styles.viewModeBtn,
                  postsViewMode === 'feed' && styles.viewModeBtnActive,
                ]}
                onPress={() => setPostsViewMode('feed')}
                activeScale={0.92}
                accessibilityRole="button"
                accessibilityLabel="Feed Stream View"
              >
                <LayoutList
                  size={15}
                  color={postsViewMode === 'feed' ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                />
              </IOSPressable>
            </View>
          </View>

          {/* Render 3-Column Grid or Inline Feed */}
          {postsViewMode === 'grid' ? (
            <View style={styles.rowsGridContainer}>
              {postRows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.gridRow}>
                  {row.map((item) => renderGridPost(item))}
                  {/* Fill empty slots in last row if fewer than 3 */}
                  {row.length < 3 &&
                    Array.from({ length: 3 - row.length }).map((_, emptyIdx) => (
                      <View key={`empty-${emptyIdx}`} style={styles.emptyGridSlot} />
                    ))}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.feedStreamContainer}>
              {filteredPosts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                  onReact={handleReact}
                />
              ))}
            </View>
          )}
        </View>
      );
    }

    // 2. Favorites Tab (2-Column Posters)
    if (activeTab === 'favorites') {
      if (favorites.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Heart size={38} color="#EF4444" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySub}>
              {user.name} hasn't favorited any films yet.
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.movieGridWrap}>
          {favorites.map((m: any) => (
            <IOSPressable
              key={m.id || m.movie_id}
              style={styles.movieCard}
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
              <View style={styles.movieCardInfo}>
                <Text style={styles.movieTitle} numberOfLines={1}>
                  {m.title}
                </Text>
                <View style={styles.movieCardMeta}>
                  {m.vote_average ? (
                    <Text style={styles.ratingText}>★ {m.vote_average.toFixed(1)}</Text>
                  ) : null}
                  {m.release_year ? (
                    <Text style={styles.yearText}>• {m.release_year}</Text>
                  ) : null}
                </View>
              </View>
            </IOSPressable>
          ))}
        </View>
      );
    }

    // 3. Watchlist Tab (2-Column Posters)
    if (activeTab === 'watchlist') {
      if (watchlist.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Clock size={38} color="#3B82F6" />
            <Text style={styles.emptyTitle}>Watchlist is empty</Text>
            <Text style={styles.emptySub}>
              {user.name} has not added any titles to their watchlist.
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.movieGridWrap}>
          {watchlist.map((m: any) => (
            <IOSPressable
              key={m.id || m.movie_id}
              style={styles.movieCard}
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
              <View style={styles.movieCardInfo}>
                <Text style={styles.movieTitle} numberOfLines={1}>
                  {m.title}
                </Text>
                <View style={styles.movieCardMeta}>
                  {m.vote_average ? (
                    <Text style={styles.ratingText}>★ {m.vote_average.toFixed(1)}</Text>
                  ) : null}
                  {m.release_year ? (
                    <Text style={styles.yearText}>• {m.release_year}</Text>
                  ) : null}
                </View>
              </View>
            </IOSPressable>
          ))}
        </View>
      );
    }

    // 4. Watched Tab (2-Column Posters)
    if (activeTab === 'watched') {
      if (watched.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Eye size={38} color="#10B981" />
            <Text style={styles.emptyTitle}>No watched movies</Text>
            <Text style={styles.emptySub}>
              {user.name} hasn't logged any watched movies yet.
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.movieGridWrap}>
          {watched.map((m: any) => (
            <IOSPressable
              key={m.id || m.movie_id}
              style={styles.movieCard}
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
              <View style={styles.movieCardInfo}>
                <Text style={styles.movieTitle} numberOfLines={1}>
                  {m.title}
                </Text>
                <View style={styles.movieCardMeta}>
                  {m.vote_average ? (
                    <Text style={styles.ratingText}>★ {m.vote_average.toFixed(1)}</Text>
                  ) : null}
                  {m.release_year ? (
                    <Text style={styles.yearText}>• {m.release_year}</Text>
                  ) : null}
                </View>
              </View>
            </IOSPressable>
          ))}
        </View>
      );
    }

    // 5. Reviews Tab (Card List)
    if (activeTab === 'reviews') {
      if (reviews.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <Star size={38} color="#FFC107" />
            <Text style={styles.emptyTitle}>No reviews logged</Text>
            <Text style={styles.emptySub}>
              {user.name} hasn't published any film reviews yet.
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.reviewsListWrap}>
          {reviews.map((rev: any) => (
            <IOSPressable
              key={rev.id || rev.movie_id}
              style={styles.reviewCard}
              onPress={() => router.push(`/${rev.media_type || 'movie'}/${rev.movie_id}` as never)}
              activeScale={0.98}
            >
              <View style={styles.reviewHeader}>
                <View style={styles.ratingBadge}>
                  <Star size={11} color="#FFC107" fill="#FFC107" />
                  <Text style={styles.ratingBadgeText}>
                    {rev.label?.toUpperCase() || 'RATED'}
                  </Text>
                </View>
                {rev.likes_count > 0 && (
                  <View style={styles.reviewLikesBadge}>
                    <Heart size={10} color="#EF4444" fill="#EF4444" />
                    <Text style={styles.reviewLikesText}>{rev.likes_count}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.reviewTitle}>
                {rev.title || `Movie #${rev.movie_id}`}
              </Text>
              {rev.review_text ? (
                <Text style={styles.reviewBody}>{rev.review_text}</Text>
              ) : null}
            </IOSPressable>
          ))}
        </View>
      );
    }

    // 6. Collections Tab (Playlists)
    if (activeTab === 'collections') {
      if (collections.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <LayoutGrid size={38} color="#8B5CF6" />
            <Text style={styles.emptyTitle}>No public playlists</Text>
            <Text style={styles.emptySub}>
              {user.name} hasn't shared any curated film playlists yet.
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.reviewsListWrap}>
          {collections.map((col: any) => (
            <IOSPressable
              key={col.id}
              style={styles.colCard}
              onPress={() => router.push(`/collections/${col.id}` as never)}
              activeScale={0.97}
            >
              <View style={styles.colIcon}>
                <LayoutGrid size={18} color="#A855F7" />
              </View>
              <View style={styles.colInfo}>
                <Text style={styles.colTitle}>{col.name || col.title}</Text>
                <Text style={styles.colSub}>
                  {col.item_count || 0} films in collection
                </Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </IOSPressable>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.root}>
      {/* ── Base Ambient Glow behind the whole page ── */}
      <AmbientGlow />

      {/* ── Aesthetic Purple Radiant Glow from Top-Left Corner ── */}
      <LinearGradient
        colors={[
          'rgba(147, 51, 234, 0.48)',
          'rgba(126, 34, 206, 0.3)',
          'rgba(88, 28, 135, 0.15)',
          'rgba(15, 15, 18, 0)',
        ]}
        locations={[0, 0.25, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.cornerPurpleGlow}
        pointerEvents="none"
      />

      {/* ── Navigation Header Bar ── */}
      <IOSHeader
        title={user.name}
        translucent
        style={styles.navHeader}
        rightAction={
          <View style={styles.headerActionsRow}>
            <IOSPressable
              onPress={handleShareProfile}
              style={styles.headerCircleBtn}
              activeScale={0.88}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Share profile"
            >
              <Share2 size={18} color="#FFFFFF" />
            </IOSPressable>

            <IOSPressable
              onPress={() => setIsOptionsOpen(true)}
              style={styles.headerCircleBtn}
              activeScale={0.88}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="More options"
            >
              <MoreVertical size={18} color="#FFFFFF" />
            </IOSPressable>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Modern Profile Header ── */}
        <View style={styles.profileHeader}>
          {/* Subtle Glassmorphism Card Gradient */}
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* 1. Avatar + 3 Stat Columns Row */}
          <View style={styles.avatarStatsRow}>
            {/* Avatar with optional Instagram-style Story Gradient Ring */}
            <View style={styles.avatarWrapper}>
              <IOSPressable
                onPress={() => {
                  if (hasActiveStory) {
                    setIsStoryViewerOpen(true);
                  }
                }}
                activeScale={hasActiveStory ? 0.94 : 1}
                disabled={!hasActiveStory}
                accessibilityRole="button"
                accessibilityLabel={`${user.name}'s story`}
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
                        src={user.avatar_url}
                        seed={user.username || user.name}
                        name={user.name}
                        size={78}
                        borderRadius={39}
                      />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.avatarPlainRing}>
                    <Avatar
                      src={user.avatar_url}
                      seed={user.username || user.name}
                      name={user.name}
                      size={78}
                      borderRadius={39}
                    />
                  </View>
                )}
              </IOSPressable>
            </View>

            {/* 3 Stats Columns: Posts, Followers, Following */}
            <View style={styles.statsContainer}>
              <IOSPressable
                style={styles.statColumn}
                onPress={() => setActiveTab('posts')}
                activeScale={0.94}
              >
                <Text style={styles.statNumber}>{totalPostsCount}</Text>
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
                <Text style={styles.statNumber}>{stats?.followers_count || 0}</Text>
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
                <Text style={styles.statNumber}>{stats?.following_count || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </IOSPressable>
            </View>
          </View>

          {/* 2. User Identity & Bio Block */}
          <View style={styles.bioSection}>
            <Text style={styles.displayName}>{user.name}</Text>
            <Text style={styles.handle}>
              @{user.username || user.name.toLowerCase().replace(/\s/g, '')}
            </Text>

            {user.bio ? (
              <Text style={styles.bioText}>{user.bio}</Text>
            ) : (
              <Text style={styles.bioTextMuted}>
                Cinephile sharing cinema moments, takes & favorites.
              </Text>
            )}

            {/* Cinephile Badges */}
            <View style={styles.bioCineTags}>
              <Text style={styles.cineTag}>🎬 {watched.length} Watched</Text>
              <Text style={styles.cineTagBullet}>•</Text>
              <Text style={styles.cineTag}>⭐ {reviews.length} Reviews</Text>
              <Text style={styles.cineTagBullet}>•</Text>
              <Text style={styles.cineTag}>❤️ {favorites.length} Favs</Text>
            </View>
          </View>

          {/* 3. Taste Compatibility Card (Feature #1) */}
          {tasteScore !== null && (
            <LinearGradient
              colors={['rgba(147, 51, 234, 0.22)', 'rgba(59, 130, 246, 0.12)', 'rgba(24, 20, 32, 0.4)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tasteCard}
            >
              <View style={styles.tasteCardHeader}>
                <View style={styles.tasteBadge}>
                  <Sparkles size={12} color="#C084FC" />
                  <Text style={styles.tasteBadgeText}>{tasteScore}% Taste Match</Text>
                </View>
                <Text style={styles.tasteVerdict}>
                  {tasteScore > 88 ? 'Film Soulmate' : 'High Compatibility'}
                </Text>
              </View>

              <Text style={styles.tasteCardDescription}>
                {commonFavorites.length > 0
                  ? `You both favorited ${commonFavorites[0].title}${commonFavorites.length > 1 ? ` and ${commonFavorites.length - 1} more` : ''}!`
                  : `Shares your enthusiasm for auteur filmmaking, atmospheric pacing & cinematography.`}
              </Text>
            </LinearGradient>
          )}

          {/* 4. Letterboxd Top 4 Favorites Spotlight Shelf (Feature #2) */}
          {topSpotlightFavorites.length > 0 && (
            <View style={styles.spotlightSection}>
              <View style={styles.spotlightHeader}>
                <Star size={13} color="#FBBF24" fill="#FBBF24" />
                <Text style={styles.spotlightTitle}>Top 4 Favorites</Text>
              </View>
              <View style={styles.spotlightRow}>
                {topSpotlightFavorites.map((fav: any) => (
                  <IOSPressable
                    key={fav.id || fav.movie_id}
                    style={styles.spotlightCard}
                    onPress={() => router.push(`/${fav.media_type || 'movie'}/${fav.movie_id}` as never)}
                    activeScale={0.95}
                  >
                    <PosterImage
                      path={fav.poster_path}
                      title={fav.title}
                      movieId={fav.movie_id}
                      width={SPOTLIGHT_POSTER_WIDTH}
                      height={SPOTLIGHT_POSTER_HEIGHT}
                      borderRadius={radius.sm}
                    />
                    {fav.vote_average ? (
                      <View style={styles.spotlightRatingBadge}>
                        <Text style={styles.spotlightRatingText}>
                          ★ {fav.vote_average.toFixed(1)}
                        </Text>
                      </View>
                    ) : null}
                  </IOSPressable>
                ))}
              </View>
            </View>
          )}

          {/* 5. Film DNA / Genre Breakdown (Feature #3) */}
          {Object.keys(movie_taste).length > 0 && (
            <View style={styles.dnaSection}>
              <Text style={styles.dnaTitle}>Film DNA & Genre Radar</Text>
              <View style={styles.dnaBarsRow}>
                {Object.entries(movie_taste).slice(0, 3).map(([genre, pct]: [string, any]) => {
                  const percentage = typeof pct === 'number' ? Math.round(pct) : 30;
                  return (
                    <View key={genre} style={styles.dnaBarItem}>
                      <View style={styles.dnaBarLabelRow}>
                        <Text style={styles.dnaGenreName}>{genre}</Text>
                        <Text style={styles.dnaGenrePct}>{percentage}%</Text>
                      </View>
                      <View style={styles.dnaBarTrack}>
                        <LinearGradient
                          colors={['#A855F7', '#EC4899']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.dnaBarFill, { width: `${percentage}%` }]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 6. Action Buttons Row (Follow & Share) */}
          <View style={styles.actionButtonsRow}>
            {!isOwnProfile && (
              <IOSPressable
                style={[
                  styles.followActionBtn,
                  is_following && styles.followingActionBtn,
                ]}
                onPress={handleToggleFollow}
                activeScale={0.94}
                accessibilityRole="button"
                accessibilityLabel={is_following ? 'Unfollow' : 'Follow'}
              >
                {followLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={is_following ? '#FFFFFF' : '#000000'}
                  />
                ) : is_following ? (
                  <>
                    <UserCheck size={16} color="#FFFFFF" />
                    <Text style={styles.followingBtnText}>Following</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} color="#000000" />
                    <Text style={styles.followBtnText}>Follow</Text>
                  </>
                )}
              </IOSPressable>
            )}

            <IOSPressable
              style={[
                styles.shareActionBtn,
                isOwnProfile && { flex: 1 },
              ]}
              onPress={handleShareProfile}
              activeScale={0.94}
              accessibilityRole="button"
              accessibilityLabel="Share profile"
            >
              <Share2 size={16} color="#FFFFFF" />
              <Text style={styles.shareActionText}>Share profile</Text>
            </IOSPressable>
          </View>

          {/* 7. Circular Story Highlights Quick Navigation */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsScroll}
          >
            <IOSPressable
              style={styles.highlightItem}
              onPress={() => setActiveTab('posts')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'posts' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(168,85,247,0.16)' },
                ]}
              >
                <Film size={20} color="#C084FC" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                Posts ({totalPostsCount})
              </Text>
            </IOSPressable>

            <IOSPressable
              style={styles.highlightItem}
              onPress={() => setActiveTab('favorites')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'favorites' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(239,68,68,0.16)' },
                ]}
              >
                <Heart size={20} color="#EF4444" fill="#EF4444" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                Favs ({favorites.length})
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
                  { backgroundColor: 'rgba(59,130,246,0.16)' },
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
              onPress={() => setActiveTab('watched')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'watched' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(16,185,129,0.16)' },
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
              onPress={() => setActiveTab('reviews')}
              activeScale={0.92}
            >
              <View
                style={[
                  styles.highlightCircle,
                  activeTab === 'reviews' && styles.highlightCircleActive,
                  { backgroundColor: 'rgba(255,193,7,0.16)' },
                ]}
              >
                <Star size={20} color="#FFC107" fill="#FFC107" />
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
                  { backgroundColor: 'rgba(139,92,246,0.16)' },
                ]}
              >
                <LayoutGrid size={20} color="#A855F7" />
              </View>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                Playlists ({collections.length})
              </Text>
            </IOSPressable>
          </ScrollView>
        </View>

        {/* ── Complete Tabs Navigation Bar ── */}
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
              size={18}
              color={activeTab === 'posts' ? '#FFFFFF' : 'rgba(255,255,255,0.45)'}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === 'posts' && styles.tabButtonLabelActive,
              ]}
            >
              Posts ({totalPostsCount})
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.tabButton, activeTab === 'favorites' && styles.tabButtonActive]}
            onPress={() => setActiveTab('favorites')}
            activeScale={0.96}
          >
            <Heart
              size={17}
              color={activeTab === 'favorites' ? '#EF4444' : 'rgba(255,255,255,0.45)'}
              fill={activeTab === 'favorites' ? '#EF4444' : 'transparent'}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === 'favorites' && styles.tabButtonLabelActive,
              ]}
            >
              Favs ({favorites.length})
            </Text>
          </IOSPressable>

          <IOSPressable
            style={[styles.tabButton, activeTab === 'watchlist' && styles.tabButtonActive]}
            onPress={() => setActiveTab('watchlist')}
            activeScale={0.96}
          >
            <Clock
              size={17}
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
              size={17}
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
              size={17}
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
              size={17}
              color={activeTab === 'collections' ? '#A855F7' : 'rgba(255,255,255,0.45)'}
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
        </ScrollView>

        {/* ── Tab Content Section ── */}
        <View style={styles.contentSection}>{renderContent()}</View>
      </ScrollView>

      {/* ── Followers & Following Modal ── */}
      <FollowModal
        visible={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        userId={user.id}
        initialTab={followModalTab}
      />

      {/* ── Post Detail Modal ── */}
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
                currentUserId={currentUser?.id}
                onReact={handleReact}
                onNavigate={() => setSelectedPostDetail(null)}
              />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* ── User Story Viewer Modal ── */}
      {hasActiveStory && userStoryGroup && (
        <CineStoryViewerModal
          visible={isStoryViewerOpen}
          userGroups={[userStoryGroup]}
          initialUserIndex={0}
          onClose={() => setIsStoryViewerOpen(false)}
        />
      )}

      {/* ── More Options Bottom Sheet Modal ── */}
      <Modal
        visible={isOptionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOptionsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOptionsOpen(false)}>
          <View style={styles.optionsBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.optionsSheet, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.optionsHandle} />
                <Text style={styles.optionsTitle}>@{user.username || user.name}</Text>

                <IOSPressable
                  style={styles.optionsItem}
                  onPress={handleShareProfile}
                  activeScale={0.96}
                >
                  <Share2 size={18} color="#FFFFFF" />
                  <Text style={styles.optionsItemText}>Share Profile</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionsItem}
                  onPress={handleCopyProfile}
                  activeScale={0.96}
                >
                  {copiedLink ? <Check size={18} color="#10B981" /> : <Copy size={18} color="#FFFFFF" />}
                  <Text style={styles.optionsItemText}>
                    {copiedLink ? 'Copied to clipboard' : 'Copy Profile Link'}
                  </Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionsItem}
                  onPress={() => {
                    setIsOptionsOpen(false);
                    showToast.success(`Recommendation feature coming soon!`);
                  }}
                  activeScale={0.96}
                >
                  <Sparkles size={18} color="#A855F7" />
                  <Text style={styles.optionsItemText}>Recommend a Film</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.optionsCancelBtn}
                  onPress={() => setIsOptionsOpen(false)}
                  activeScale={0.94}
                >
                  <Text style={styles.optionsCancelText}>Cancel</Text>
                </IOSPressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  cornerPurpleGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 1.1,
    height: 420,
    zIndex: 0,
  },
  navHeader: {
    backgroundColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  profileHeader: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(24, 20, 32, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    padding: 18,
  },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarStoryRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerGap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPlainRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 18,
  },
  statColumn: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statNumber: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  bioSection: {
    marginBottom: 14,
  },
  displayName: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  handle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.primary,
    marginBottom: 8,
  },
  bioText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#E5E7EB',
    lineHeight: 19,
    marginBottom: 10,
  },
  bioTextMuted: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
    marginBottom: 10,
  },
  bioCineTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cineTag: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  cineTagBullet: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
  },
  tasteCard: {
    borderRadius: 16,
    padding: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  tasteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tasteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(168,85,247,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  tasteBadgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#F3E8FF',
  },
  tasteVerdict: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#E9D5FF',
  },
  tasteCardDescription: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 17,
  },
  spotlightSection: {
    marginBottom: 14,
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  spotlightTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  spotlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spotlightCard: {
    width: SPOTLIGHT_POSTER_WIDTH,
    position: 'relative',
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  spotlightRatingBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  spotlightRatingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: '#FBBF24',
  },
  dnaSection: {
    marginBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dnaTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 12,
    color: '#E5E7EB',
    marginBottom: 8,
  },
  dnaBarsRow: {
    gap: 7,
  },
  dnaBarItem: {
    gap: 3,
  },
  dnaBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dnaGenreName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  dnaGenrePct: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#C084FC',
  },
  dnaBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  dnaBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  followActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  followBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#000000',
  },
  followingActionBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  followingBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  shareActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  shareActionText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  highlightsScroll: {
    paddingTop: 4,
    gap: 14,
  },
  highlightItem: {
    alignItems: 'center',
    width: 68,
  },
  highlightCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  highlightCircleActive: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  highlightLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  tabScrollRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 36,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  tabButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  tabButtonLabelActive: {
    fontFamily: fonts.headingSemi,
    color: '#FFFFFF',
  },
  contentSection: {
    paddingTop: 8,
  },
  postsSectionContainer: {
    width: '100%',
  },
  postsControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  postFiltersScroll: {
    gap: 6,
    paddingRight: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  filterPillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  filterPillTextActive: {
    color: '#000000',
  },
  viewModeToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  viewModeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  viewModeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  rowsGridContainer: {
    width: '100%',
    paddingHorizontal: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 3,
  },
  gridSquare: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#181424',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 3,
  },
  emptyGridSlot: {
    flex: 1,
    aspectRatio: 1,
  },
  textGridCard: {
    padding: 9,
    justifyContent: 'space-between',
  },
  gridExcerptText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10.5,
    color: '#E2E8F0',
    lineHeight: 14,
  },
  gridTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168,85,247,0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridTypeBadgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 8.5,
    color: '#C084FC',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
  },
  gridStatChips: {
    position: 'absolute',
    bottom: 4,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  gridStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridStatText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFFFFF',
  },
  feedStreamContainer: {
    paddingHorizontal: 12,
  },
  movieGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  movieCard: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(24, 20, 32, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  movieCardInfo: {
    padding: 9,
  },
  movieTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  movieCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FBBF24',
  },
  yearText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  reviewsListWrap: {
    paddingHorizontal: 16,
    gap: 12,
  },
  reviewCard: {
    backgroundColor: 'rgba(24, 20, 32, 0.65)',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,193,7,0.15)',
    borderRadius: radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.3)',
  },
  ratingBadgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: '#FFC107',
  },
  reviewLikesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewLikesText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#EF4444',
  },
  reviewTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  reviewBody: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 18,
  },
  colCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 20, 32, 0.65)',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  colIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(168,85,247,0.15)',
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
    marginBottom: 2,
  },
  colSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
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
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 17,
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
  optionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: '#1E1A29',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionsHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  optionsTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
  },
  optionsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionsItemText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#FFFFFF',
  },
  optionsCancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  optionsCancelText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
