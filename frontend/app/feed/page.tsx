'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  Compass,
  TrendingUp,
  Loader2,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import PostComposer from '@/components/PostComposer';
import { FollowUser } from '@/components/FollowersModal';
import Avatar from '@/components/Avatar';
import dynamic from 'next/dynamic';
import type { SharePostData } from '@/components/ShareModal';

// Gated behind `isShareModalOpen &&` at its render site below, so this stays
// out of the feed's initial JS until someone actually shares a post.
const ShareModal = dynamic(() => import('@/components/ShareModal'), { ssr: false });
import FeedPostCard, { SocialPost } from '@/components/FeedPostCard';

const PAGE_SIZE = 12;

type FeedTab = 'following' | 'discover';

interface TabState {
  posts: SocialPost[];
  offset: number;
  hasMore: boolean;
  initialLoaded: boolean;
}

const emptyTabState = (): TabState => ({ posts: [], offset: 0, hasMore: true, initialLoaded: false });

const StackedBarsIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Block 1 */}
    <g>
      <path d="M3 4L15 9L19 7L7 2Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 4V6L15 11V9Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M15 9V11L19 9V7Z" fill="currentColor" fillOpacity="0.8" />
    </g>
    {/* Block 2 */}
    <g>
      <path d="M3 10L15 15L19 13L7 8Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 10V12L15 17V15Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M15 15V17L19 15V13Z" fill="currentColor" fillOpacity="0.8" />
    </g>
    {/* Block 3 */}
    <g>
      <path d="M3 16L15 21L19 19L7 14Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 16V18L15 23V21Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M15 21V23L19 21V19Z" fill="currentColor" fillOpacity="0.8" />
    </g>
  </svg>
);

export default function SocialFeedPage() {
  const { user: currentUser } = useAuth();
  const [feedTab, setFeedTab] = useState<FeedTab>('following');
  const [feedState, setFeedState] = useState<Record<FeedTab, TabState>>({
    following: emptyTabState(),
    discover: emptyTabState(),
  });
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestions, setSuggestions] = useState<FollowUser[]>([]);
  const [followLoadingId, setFollowLoadingId] = useState<number | null>(null);
  const [shareTargetPost, setShareTargetPost] = useState<SharePostData | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const feedStateRef = useRef(feedState);
  useEffect(() => { feedStateRef.current = feedState; }, [feedState]);

  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevUserIdRef = useRef<number | undefined>(currentUser?.id);

  const fetchPage = async (tab: FeedTab, offset: number): Promise<SocialPost[]> => {
    const endpoint = tab === 'following'
      ? `/posts/feed/following?limit=${PAGE_SIZE}&offset=${offset}`
      : `/posts/feed/for-you?limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await api.get<SocialPost[]>(endpoint);
    return res.data;
  };

  const loadInitial = useCallback(async (tab: FeedTab) => {
    setInitialLoading(true);
    try {
      const posts = await fetchPage(tab, 0);
      setFeedState((prev) => ({
        ...prev,
        [tab]: { posts, offset: posts.length, hasMore: posts.length === PAGE_SIZE, initialLoaded: true },
      }));
    } catch (err) {
      console.error(err);
      setFeedState((prev) => ({ ...prev, [tab]: { ...prev[tab], initialLoaded: true, hasMore: false } }));
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const loadMoreForTab = useCallback(async (tab: FeedTab) => {
    if (loadingMoreRef.current) return;
    const tabState = feedStateRef.current[tab];
    if (!tabState?.initialLoaded || !tabState.hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPosts = await fetchPage(tab, tabState.offset);
      setFeedState((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          posts: [...prev[tab].posts, ...nextPosts],
          offset: prev[tab].offset + nextPosts.length,
          hasMore: nextPosts.length === PAGE_SIZE,
        },
      }));
    } catch (err) {
      console.error(err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  // Reset cached feed data when auth state changes (login/logout changes what's visible).
  useEffect(() => {
    if (prevUserIdRef.current !== currentUser?.id) {
      prevUserIdRef.current = currentUser?.id;
      setFeedState({ following: emptyTabState(), discover: emptyTabState() });
    }
  }, [currentUser?.id]);

  // Load the active tab's first page the first time it's viewed.
  useEffect(() => {
    if (!feedState[feedTab].initialLoaded) {
      loadInitial(feedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedTab, feedState.following.initialLoaded, feedState.discover.initialLoaded, currentUser?.id]);

  // Infinite scroll sentinel.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreForTab(feedTab);
      },
      { rootMargin: '500px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [feedTab, loadMoreForTab]);

  useEffect(() => {
    api.get<FollowUser[]>('/user/suggestions?limit=6')
      .then((res) => setSuggestions(res.data))
      .catch((err) => console.error(err));
  }, [currentUser?.id]);

  const refreshAfterPost = useCallback(() => {
    setFeedState((prev) => ({
      ...prev,
      [feedTab]: emptyTabState(),
      // Mark the other tab stale too so it picks up the new post next visit.
      ...(feedTab === 'following' ? { discover: { ...prev.discover, initialLoaded: false } } : { following: { ...prev.following, initialLoaded: false } }),
    }));
  }, [feedTab]);

  const updateAllTabs = useCallback((updater: (posts: SocialPost[]) => SocialPost[]) => {
    setFeedState((prev) => ({
      following: { ...prev.following, posts: updater(prev.following.posts) },
      discover: { ...prev.discover, posts: updater(prev.discover.posts) },
    }));
  }, []);

  const handleToggleFollow = useCallback((targetUser: FollowUser | { id: number; is_following: boolean }) => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    setFollowLoadingId(targetUser.id);

    setSuggestions((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: !u.is_following } : u))
    );

    updateAllTabs((posts) => posts.map((p) => (
      p.author.id === targetUser.id
        ? { ...p, author: { ...p.author, is_following: !targetUser.is_following } }
        : p
    )));

    api.post(`/user/${targetUser.id}/follow`)
      .catch((err) => {
        console.error(err);
        setSuggestions((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: targetUser.is_following } : u))
        );
        updateAllTabs((posts) => posts.map((p) => (
          p.author.id === targetUser.id
            ? { ...p, author: { ...p.author, is_following: targetUser.is_following } }
            : p
        )));
      })
      .finally(() => setFollowLoadingId(null));
  }, [currentUser, updateAllTabs]);

  const handleReaction = useCallback((postId: number, reactionType: string) => {
    if (!currentUser) return;

    updateAllTabs((posts) => posts.map((p) => {
      if (p.id !== postId) return p;

      const isRemoving = p.user_reaction === reactionType;
      const newReaction = isRemoving ? null : reactionType;
      const optimisticId = -(currentUser.id * 1_000_000 + postId);

      let newReactions = p.reactions.filter((r) => r.user_id !== currentUser.id);
      if (!isRemoving) {
        newReactions = [...newReactions, {
          id: optimisticId,
          reaction_type: reactionType,
          user_id: currentUser.id,
          author_name: currentUser.name,
          author_avatar: currentUser.avatar_url,
        }];
      }

      return { ...p, user_reaction: newReaction, reactions: newReactions };
    }));

    api.post<SocialPost>(`/posts/posts/${postId}/react`, { reaction_type: reactionType })
      .then((res) => {
        // Replace the optimistic guess with the server's authoritative
        // reaction state — protects against races (rapid clicks, another
        // tab reacting) leaving the UI showing something that isn't real.
        const { user_reaction, reactions } = res.data;
        updateAllTabs((posts) => posts.map((p) => (
          p.id === postId ? { ...p, user_reaction, reactions } : p
        )));
      })
      .catch((err) => {
        console.error(err);
      });
  }, [currentUser, updateAllTabs]);

  const handlePollVoteSuccess = useCallback((postId: number, updatedPayload: any) => {
    updateAllTabs((posts) => posts.map((p) => (p.id === postId ? { ...p, payload: updatedPayload } : p)));
  }, [updateAllTabs]);

  const handleCommentAdded = useCallback((postId: number) => {
    updateAllTabs((posts) => posts.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)));
  }, [updateAllTabs]);

  const handleShare = useCallback((data: SharePostData) => {
    setShareTargetPost(data);
    setIsShareModalOpen(true);
  }, []);

  const activeTabState = feedState[feedTab];
  const showSkeleton = initialLoading && !activeTabState.initialLoaded;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 100 }}>
      {/* Glow Effects */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: '15%',
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, rgba(229,9,20,0.06) 0%, rgba(168,85,247,0.03) 50%, transparent 70%)',
          filter: 'blur(140px)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      <div className="container">
        {/* ─── Page Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 36, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                <StackedBarsIcon size={14} /> Live Social Pulse
              </span>
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1px', margin: 0, color: 'white' }}>
              Cinephile <span style={{ color: 'var(--primary)' }}>Feed</span>
            </h1>
          </div>

          {/* Tab Selector */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 4,
              display: 'flex',
              gap: 4,
            }}
          >
            {[
              { id: 'following', label: 'Following', icon: Users },
              { id: 'discover', label: 'For You', icon: Compass },
            ].map((t) => {
              const active = feedTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setFeedTab(t.id as FeedTab)}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: active ? 'white' : 'rgba(255,255,255,0.5)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    transition: 'all 0.2s',
                    boxShadow: active ? '0 2px 10px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  <t.icon size={15} style={{ color: active ? 'var(--primary)' : 'inherit' }} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Main Grid Layout ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Feed Activity (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">

            {/* Post Composer */}
            <PostComposer onPostCreated={refreshAfterPost} />

            {showSkeleton ? (
              <div className="flex flex-col gap-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 180,
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  />
                ))}
              </div>
            ) : activeTabState.posts.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                <div style={{ fontSize: 44, marginBottom: 14 }}>🎬</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>No Posts Yet</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, maxWidth: 420, margin: '0 auto 24px' }}>
                  Your feed is quiet. Follow more users or be the first to post!
                </p>
              </div>
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {activeTabState.posts.map((post, index) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      index={index}
                      currentUserId={currentUser?.id}
                      showFollowButton={feedTab === 'discover'}
                      onReact={handleReaction}
                      onToggleFollow={handleToggleFollow}
                      onShare={handleShare}
                      onPollVoteSuccess={handlePollVoteSuccess}
                      onCommentAdded={handleCommentAdded}
                    />
                  ))}
                </AnimatePresence>

                <div ref={sentinelRef} style={{ height: 1 }} />

                {loadingMore && (
                  <div className="flex items-center justify-center gap-2 text-white/40 text-sm font-semibold py-4">
                    <Loader2 size={16} className="animate-spin" /> Loading more...
                  </div>
                )}
                {!activeTabState.hasMore && activeTabState.posts.length > 0 && (
                  <div className="text-center text-white/25 text-xs font-semibold py-4">
                    You&rsquo;re all caught up
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Suggested Cinephiles to Follow (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5 sticky top-28">
            <div
              style={{
                background: '#0f0f14',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 24,
                padding: '24px',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={16} className="text-primary" /> Cinephiles to Follow
                </h3>
                <span className="text-xs text-white/40 font-semibold">Curators</span>
              </div>

              <div className="flex flex-col gap-3.5">
                {suggestions.map((u) => {
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 14,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <Link
                        href={`/user/${u.id}`}
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}
                        className="group"
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e50914 0%, #a855f7 100%)',
                            padding: 1.5,
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              background: '#16161c',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}
                          >
                            <Avatar
                              src={u.avatar_url}
                              seed={u.id || u.username || u.name}
                              name={u.name}
                              size={38}
                              className="object-cover w-full h-full"
                              decorative
                            />
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }} className="truncate block group-hover:text-primary transition-colors">
                            {u.name}
                          </span>
                          {u.username && (
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }} className="truncate block">
                              @{u.username}
                            </span>
                          )}
                        </div>
                      </Link>

                      <button
                        onClick={() => handleToggleFollow(u)}
                        disabled={followLoadingId === u.id}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 99,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginLeft: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.2s',
                          border: u.is_following ? '1px solid rgba(255,255,255,0.15)' : 'none',
                          background: u.is_following ? 'transparent' : 'white',
                          color: u.is_following ? 'white' : 'black',
                        }}
                        className={u.is_following ? 'hover:border-red-500/40 hover:text-red-400' : 'hover:bg-white/90'}
                      >
                        {followLoadingId === u.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : u.is_following ? (
                          <>
                            <UserCheck size={11} /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus size={11} /> Follow
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Post Modal */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          post={shareTargetPost}
        />
      )}
    </div>
  );
}
