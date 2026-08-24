'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Film,
  Heart,
  Star,
  Eye,
  Clock,
  Share2,
  Check,
  Edit3,
  Calendar,
  Layers,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  UserCheck,
  Users,
  Loader2,
  BarChart2
} from 'lucide-react';
import FollowersModal from '@/components/FollowersModal';
import SarcasticPosterFallback from '@/components/SarcasticPosterFallback';

interface PublicUser {
  id: number;
  name: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface PublicFavorite {
  id: number;
  movie_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: string | null;
  vote_average: number | null;
  added_at: string | null;
}

interface PublicReview {
  id: number;
  movie_id: number;
  media_type: string;
  title: string | null;
  poster_path: string | null;
  label: string;
  review_text: string | null;
  created_at: string;
  likes_count: number;
}

interface PublicCollection {
  id: number;
  name: string;
  description: string | null;
  is_rank_list: boolean;
  item_count: number;
  cover_poster: string | null;
  created_at: string;
}

interface PublicWatchlistItem {
  id: number;
  movie_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  release_year: string | null;
  vote_average: number | null;
}

interface PublicProfileData {
  user: PublicUser;
  stats: {
    favorites_count: number;
    reviews_count: number;
    collections_count: number;
    watchlist_count: number;
    watched_count: number;
    followers_count: number;
    following_count: number;
  };
  is_following: boolean;
  movie_taste?: Record<string, number>;
  top_movies?: { title: string; poster_path: string | null }[];
  favorites: PublicFavorite[];
  reviews: PublicReview[];
  collections: PublicCollection[];
  watchlist: PublicWatchlistItem[];
  watched: PublicWatchlistItem[];
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

const VERDICT_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  perfection: { label: 'Perfection', color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.4)' },
  goforit: { label: 'Go For It', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' },
  timepass: { label: 'Timepass', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)' },
  skip: { label: 'Skip', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.4)' },
};

type TabType = 'reviews' | 'favorites' | 'collections' | 'watched' | 'watchlist';

export default function PublicUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params?.id as string;

  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  const [copied, setCopied] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'followers' | 'following'>('followers');
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = () => {
    if (!userId) return;
    const endpoint = isNaN(Number(userId))
      ? `/user/by-username/${userId}/public`
      : `/user/${userId}/public`;

    api
      .get<PublicProfileData>(endpoint)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError('User profile not found.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProfile();
  }, [userId, currentUser]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!data) return;

    setFollowLoading(true);
    const wasFollowing = data.is_following;
    // Optimistic UI
    setData((prev) =>
      prev
        ? {
            ...prev,
            is_following: !wasFollowing,
            stats: {
              ...prev.stats,
              followers_count: wasFollowing
                ? Math.max(0, prev.stats.followers_count - 1)
                : prev.stats.followers_count + 1,
            },
          }
        : prev
    );

    try {
      await api.post(`/user/${data.user.id}/follow`);
    } catch (err) {
      console.error(err);
      fetchProfile();
    } finally {
      setFollowLoading(false);
    }
  };

  const openFollowModal = (t: 'followers' | 'following') => {
    setModalTab(t);
    setModalOpen(true);
  };

  const isOwnProfile = currentUser && data && currentUser.id === data.user.id;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80 }} className="container">
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-48 rounded-3xl bg-white/5 border border-white/10" />
          <div className="h-12 w-96 rounded-2xl bg-white/5" />
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 140, textAlign: 'center' }} className="container">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
        <p className="text-white/50 text-sm mb-6">The profile you are looking for does not exist or is unavailable.</p>
        <button
          onClick={() => router.back()}
          className="btn-primary px-6 py-2.5 rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const { user, stats, favorites, reviews, collections, watchlist, watched } = data;
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const joinedYear = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 90 }}>
      {/* Background ambient glow */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: '10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(229,9,20,0.07) 0%, rgba(192,132,252,0.04) 50%, transparent 70%)',
          filter: 'blur(140px)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      <div className="container">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back
        </button>

        {/* ─── Profile Header Card ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            padding: '32px',
            marginBottom: 36,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Avatar & Info */}
            <div className="flex items-start md:items-center gap-5">
              {/* Avatar */}
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e50914 0%, #a855f7 100%)',
                  padding: 2,
                  boxShadow: '0 8px 32px rgba(229,9,20,0.25)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: '#121216',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.name}
                      width={88}
                      height={88}
                      style={{ objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              {/* Names & Bio */}
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
                    {user.name}
                  </h1>
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    ✓ Verified Cinephile
                  </span>
                </div>

                {user.username && (
                  <p style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 700, margin: '2px 0 0' }}>
                    @{user.username}
                  </p>
                )}

                {user.bio && (
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8, maxWidth: 540, lineHeight: 1.5 }}>
                    {user.bio}
                  </p>
                )}

                {/* Follower / Following Quick Counters in Header */}
                <div className="flex items-center gap-5 text-sm mt-3.5">
                  <button
                    onClick={() => openFollowModal('followers')}
                    className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center gap-1.5"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    <strong className="text-white text-base font-extrabold">{stats.followers_count}</strong>
                    <span className="text-xs text-white/50">Followers</span>
                  </button>

                  <button
                    onClick={() => openFollowModal('following')}
                    className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center gap-1.5"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    <strong className="text-white text-base font-extrabold">{stats.following_count}</strong>
                    <span className="text-xs text-white/50">Following</span>
                  </button>

                  {joinedYear && (
                    <div className="flex items-center gap-1.5 text-white/40 text-xs pl-2 border-l border-white/10">
                      <Calendar size={13} />
                      <span>Joined {joinedYear}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Social Actions */}
            <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end flex-wrap">
              {!isOwnProfile ? (
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    transition: 'all 0.2s',
                    border: data.is_following ? '1px solid rgba(255,255,255,0.2)' : 'none',
                    background: data.is_following ? 'rgba(255,255,255,0.06)' : 'white',
                    color: data.is_following ? 'white' : 'black',
                    boxShadow: data.is_following ? 'none' : '0 4px 20px rgba(255,255,255,0.15)',
                  }}
                  className={data.is_following ? 'hover:border-red-500/50 hover:text-red-400' : 'hover:scale-[1.02]'}
                >
                  {followLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : data.is_following ? (
                    <>
                      <UserCheck size={15} /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} /> Follow
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/profile"
                  style={{
                    background: 'var(--primary)',
                    borderRadius: 14,
                    padding: '10px 20px',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <Edit3 size={15} /> Edit Profile
                </Link>
              )}

              <button
                onClick={handleShare}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  padding: '10px 16px',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
                {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>

          {/* Stat Pills Bar */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {[
              { label: 'Reviews', count: stats.reviews_count, icon: MessageSquare, tab: 'reviews' },
              { label: 'Favorites', count: stats.favorites_count, icon: Heart, tab: 'favorites' },
              { label: 'Collections', count: stats.collections_count, icon: Layers, tab: 'collections' },
              { label: 'Watched', count: stats.watched_count, icon: Eye, tab: 'watched' },
              { label: 'Watchlist', count: stats.watchlist_count, icon: Clock, tab: 'watchlist' },
            ].map((st) => (
              <button
                key={st.label}
                onClick={() => setActiveTab(st.tab as TabType)}
                style={{
                  background: activeTab === st.tab ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                  border: activeTab === st.tab ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: activeTab === st.tab ? 'white' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                }}
              >
                <st.icon size={14} style={{ color: activeTab === st.tab ? 'var(--primary)' : 'inherit' }} />
                <span style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>{st.count}</span>
                <span style={{ fontSize: 12 }}>{st.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ─── Movie Taste & Top Movies (New) ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Movie Taste */}
          {data.movie_taste && Object.keys(data.movie_taste).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0f0f14] border border-white/10 rounded-3xl p-6"
            >
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-primary" /> Movie Taste
              </h3>
              <div className="flex flex-col gap-3">
                {Object.entries(data.movie_taste).map(([genre, percent]) => (
                  <div key={genre}>
                    <div className="flex justify-between text-xs font-bold text-white/70 mb-1">
                      <span>{genre}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Movies */}
          {data.top_movies && data.top_movies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0f0f14] border border-white/10 rounded-3xl p-6"
            >
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Star size={18} className="text-amber-400" /> Top Movies
              </h3>
              <div className="flex gap-3">
                {data.top_movies.map((movie, idx) => (
                  <div key={idx} className="flex-1 relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
                    {movie.poster_path ? (
                      <Image
                        src={`${TMDB_IMG}${movie.poster_path}`}
                        alt={movie.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <SarcasticPosterFallback title={movie.title} seed={idx} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-[10px] font-bold text-white leading-tight line-clamp-2">{movie.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* ─── Tabs Navigation ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 1 }}>
          {[
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: MessageSquare },
            { id: 'favorites', label: `Favorites (${favorites.length})`, icon: Heart },
            { id: 'collections', label: `Collections (${collections.length})`, icon: Layers },
            { id: 'watched', label: `Watched (${watched.length})`, icon: Eye },
            { id: 'watchlist', label: `Watchlist (${watchlist.length})`, icon: Clock },
          ].map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as TabType)}
                style={{
                  padding: '12px 20px',
                  position: 'relative',
                  border: 'none',
                  background: 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'color 0.2s',
                }}
              >
                <t.icon size={14} />
                {t.label}
                {active && (
                  <motion.div
                    layoutId="profile-tab-active"
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'var(--primary)',
                      boxShadow: '0 0 10px var(--primary-glow)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Tab Content ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {/* 1. REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <motion.div
              key="tab-reviews"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
                  <MessageSquare size={36} className="mx-auto mb-3 opacity-40" />
                  <p>No written reviews or verdicts yet from this user.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((r) => {
                    const verdict = VERDICT_META[r.label.toLowerCase()] || VERDICT_META.goforit;
                    const posterSrc = r.poster_path ? `${TMDB_IMG}${r.poster_path}` : '/no-poster.png';
                    const dateStr = new Date(r.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={r.id}
                        style={{
                          background: '#111116',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 18,
                          padding: '16px',
                          display: 'flex',
                          gap: 16,
                          alignItems: 'flex-start',
                          transition: 'border-color 0.2s',
                        }}
                        className="hover:border-white/20"
                      >
                        {/* Poster */}
                        <Link href={`/movie/${r.movie_id}`} style={{ flexShrink: 0 }}>
                          <div style={{ position: 'relative', width: 68, height: 102, borderRadius: 10, overflow: 'hidden', background: '#222' }}>
                            <Image
                              src={posterSrc}
                              alt={r.title || 'Movie'}
                              fill
                              sizes="68px"
                              style={{ objectFit: 'cover' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/no-poster.png';
                              }}
                            />
                          </div>
                        </Link>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <Link
                              href={`/movie/${r.movie_id}`}
                              style={{ textDecoration: 'none', color: 'white' }}
                              className="hover:underline"
                            >
                              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.3 }} className="truncate">
                                {r.title || `Movie #${r.movie_id}`}
                              </h3>
                            </Link>

                            {/* Verdict Badge */}
                            <span
                              style={{
                                background: verdict.bg,
                                color: verdict.color,
                                border: `1px solid ${verdict.border}`,
                                borderRadius: 99,
                                padding: '2px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {verdict.label}
                            </span>
                          </div>

                          <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.45 }}>
                            {r.review_text || <em className="text-white/40 font-normal">No written review, just rated.</em>}
                          </p>

                          <div className="flex items-center justify-between text-white/40 text-[11px]">
                            <span>{dateStr}</span>
                            {r.likes_count > 0 && (
                              <span className="flex items-center gap-1 text-white/60 font-semibold">
                                <ThumbsUp size={11} /> {r.likes_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* 2. FAVORITES TAB */}
          {activeTab === 'favorites' && (
            <motion.div
              key="tab-favorites"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {favorites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
                  <Heart size={36} className="mx-auto mb-3 opacity-40" />
                  <p>No favorites added yet by this user.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 18 }}>
                  {favorites.map((m) => {
                    const posterSrc = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : '/no-poster.png';
                    return (
                      <Link
                        key={m.id}
                        href={`/movie/${m.movie_id}`}
                        style={{ textDecoration: 'none', display: 'block' }}
                        className="group"
                      >
                        <div
                          style={{
                            background: '#111116',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            overflow: 'hidden',
                            transition: 'transform 0.2s ease, border-color 0.2s ease',
                          }}
                          className="group-hover:border-white/20 group-hover:-translate-y-1"
                        >
                          <div style={{ position: 'relative', aspectRatio: '2/3', background: '#1a1a20' }}>
                            <Image
                              src={posterSrc}
                              alt={m.title}
                              fill
                              sizes="(max-width: 768px) 33vw, 16vw"
                              style={{ objectFit: 'cover' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/no-poster.png';
                              }}
                            />
                            {m.vote_average && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  background: 'rgba(0,0,0,0.75)',
                                  backdropFilter: 'blur(8px)',
                                  borderRadius: 99,
                                  padding: '2px 8px',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: '#fbbf24',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                              >
                                <Star size={10} fill="#fbbf24" />
                                {m.vote_average.toFixed(1)}
                              </div>
                            )}
                          </div>
                          <div style={{ padding: '10px 12px' }}>
                            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'white' }} className="truncate">
                              {m.title}
                            </h4>
                            {m.release_year && (
                              <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                {m.release_year}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* 3. COLLECTIONS TAB */}
          {activeTab === 'collections' && (
            <motion.div
              key="tab-collections"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {collections.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
                  <Layers size={36} className="mx-auto mb-3 opacity-40" />
                  <p>No public collections created yet by this user.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 20 }}>
                  {collections.map((col) => {
                    return (
                      <Link
                        key={col.id}
                        href={`/collections/${col.id}`}
                        style={{ textDecoration: 'none', display: 'block' }}
                        className="group"
                      >
                        <div
                          style={{
                            background: '#0e0e12',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            overflow: 'hidden',
                            transition: 'transform 0.2s ease, border-color 0.2s ease',
                          }}
                          className="group-hover:border-white/20 group-hover:-translate-y-1"
                        >
                          <div style={{ position: 'relative', aspectRatio: '2/3', background: '#111', overflow: 'hidden' }}>
                            {col.cover_poster ? (
                              <>
                                <Image
                                  src={`${TMDB_IMG}${col.cover_poster}`}
                                  alt={col.name}
                                  fill
                                  sizes="(max-width: 768px) 50vw, 20vw"
                                  style={{ objectFit: 'cover' }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)',
                                  }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: 10,
                                    left: 10,
                                    background: 'rgba(0,0,0,0.8)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: 99,
                                    padding: '3px 10px',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: 'white',
                                  }}
                                >
                                  {col.item_count} {col.item_count === 1 ? 'film' : 'films'}
                                </div>
                              </>
                            ) : (
                              <SarcasticPosterFallback title={col.name} itemCount={col.item_count} seed={col.id} />
                            )}
                          </div>
                          <div style={{ padding: '12px 14px 14px' }}>
                            <h4
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 700,
                                color: 'white',
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {col.name}
                            </h4>
                            {col.description && (
                              <p
                                style={{
                                  margin: '4px 0 0',
                                  fontSize: 11,
                                  color: 'rgba(255,255,255,0.4)',
                                  lineHeight: 1.4,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {col.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* 4. WATCHED & 5. WATCHLIST TABS */}
          {(activeTab === 'watched' || activeTab === 'watchlist') && (
            <motion.div
              key={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {(() => {
                const list = activeTab === 'watched' ? watched : watchlist;
                if (list.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
                      {activeTab === 'watched' ? <Eye size={36} className="mx-auto mb-3 opacity-40" /> : <Clock size={36} className="mx-auto mb-3 opacity-40" />}
                      <p>No films in {activeTab} yet.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 18 }}>
                    {list.map((m) => {
                      const posterSrc = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : '/no-poster.png';
                      return (
                        <Link
                          key={m.id}
                          href={`/movie/${m.movie_id}`}
                          style={{ textDecoration: 'none', display: 'block' }}
                          className="group"
                        >
                          <div
                            style={{
                              background: '#111116',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: 16,
                              overflow: 'hidden',
                              transition: 'transform 0.2s ease, border-color 0.2s ease',
                            }}
                            className="group-hover:border-white/20 group-hover:-translate-y-1"
                          >
                            <div style={{ position: 'relative', aspectRatio: '2/3', background: '#1a1a20' }}>
                              <Image
                                src={posterSrc}
                                alt={m.title}
                                fill
                                sizes="(max-width: 768px) 33vw, 16vw"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/no-poster.png';
                                }}
                              />
                            </div>
                            <div style={{ padding: '10px 12px' }}>
                              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'white' }} className="truncate">
                                {m.title}
                              </h4>
                              {m.release_year && (
                                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                  {m.release_year}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Followers / Following Modal */}
      {data && (
        <FollowersModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          userId={data.user.id}
          userName={data.user.name}
          initialTab={modalTab}
          onFollowChange={fetchProfile}
        />
      )}
    </div>
  );
}
