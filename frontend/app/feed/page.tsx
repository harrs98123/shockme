'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Sparkles,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Loader2,
  ThumbsUp,
  UserPlus,
  UserCheck,
  MessageSquare,
  PlaySquare,
  BarChart2,
  Bookmark,
  Star,
  Heart,
  Share2
} from 'lucide-react';
import PostComposer from '@/components/PostComposer';
import { FollowUser } from '@/components/FollowersModal';

export interface SocialPost {
  id: number;
  post_type: 'review' | 'watching' | 'recommendation' | 'poll' | 'meme' | 'scene' | 'watchlist';
  content: string | null;
  movie_id: number | null;
  payload: any | null;
  is_spoiler: boolean;
  created_at: string;
  author: {
    id: number;
    name: string;
    username: string | null;
    avatar_url: string | null;
    is_following: boolean;
  };
  reactions: any[];
  comments_count: number;
  user_reaction: string | null;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

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
  const [feedTab, setFeedTab] = useState<'following' | 'discover'>('following');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [suggestions, setSuggestions] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoadingId, setFollowLoadingId] = useState<number | null>(null);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const endpoint = feedTab === 'following' ? '/posts/feed/following?limit=50' : '/posts/feed/for-you?limit=50';
      const [feedRes, sugRes] = await Promise.all([
        api.get<SocialPost[]>(endpoint),
        api.get<FollowUser[]>('/user/suggestions?limit=6'),
      ]);
      setPosts(feedRes.data);
      setSuggestions(sugRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [currentUser, feedTab]);

  const handleToggleFollow = async (targetUser: FollowUser | { id: number, is_following: boolean }) => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    setFollowLoadingId(targetUser.id);
    
    // Optimistic UI for suggestions
    setSuggestions((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: !u.is_following } : u))
    );
    
    // Optimistic UI for posts
    setPosts(prev => prev.map(p => {
      if (p.author.id === targetUser.id) {
        return { ...p, author: { ...p.author, is_following: !targetUser.is_following }};
      }
      return p;
    }));

    try {
      await api.post(`/user/${targetUser.id}/follow`);
    } catch (err) {
      console.error(err);
      fetchFeed(); // Revert on failure
    } finally {
      setFollowLoadingId(null);
    }
  };

  const handleReaction = async (postId: number, reactionType: string) => {
    if (!currentUser) return;
    
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isRemoving = p.user_reaction === reactionType;
        const newReaction = isRemoving ? null : reactionType;
        
        let newReactions = [...p.reactions];
        if (isRemoving) {
          newReactions = newReactions.filter(r => r.user_id !== currentUser.id);
        } else {
          // Remove old reaction if any
          newReactions = newReactions.filter(r => r.user_id !== currentUser.id);
          newReactions.push({ id: Date.now(), reaction_type: reactionType, user_id: currentUser.id, author_name: currentUser.name, author_avatar: currentUser.avatar_url });
        }
        
        return { ...p, user_reaction: newReaction, reactions: newReactions };
      }
      return p;
    }));

    try {
      await api.post(`/posts/posts/${postId}/react`, { reaction_type: reactionType });
    } catch (error) {
      console.error(error);
    }
  };

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
                  onClick={() => setFeedTab(t.id as any)}
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
            <PostComposer onPostCreated={fetchFeed} />

            {loading ? (
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
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                <div style={{ fontSize: 44, marginBottom: 14 }}>🎬</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>No Posts Yet</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, maxWidth: 420, margin: '0 auto 24px' }}>
                  Your feed is quiet. Follow more users or be the first to post!
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {posts.map((post, index) => {
                  const author = post.author;
                  const initials = author.name ? author.name.slice(0, 2).toUpperCase() : 'U';
                  const timeStr = new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
                      className="bg-[#0f0f14] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Link href={`/user/${author.id}`}>
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 flex items-center justify-center font-bold text-white text-sm">
                              {author.avatar_url ? (
                                <Image src={author.avatar_url} alt={author.name} width={44} height={44} className="object-cover w-full h-full" />
                              ) : initials}
                            </div>
                          </Link>
                          <div>
                            <Link href={`/user/${author.id}`} className="font-bold text-[15px] text-white hover:text-primary transition-colors flex items-center gap-2">
                              {author.name}
                            </Link>
                            <div className="text-xs text-white/40 font-semibold mt-0.5">
                              @{author.username} • {timeStr}
                            </div>
                          </div>
                        </div>

                        {/* Follow Button directly on Post if in 'For You' and not following */}
                        {feedTab === 'discover' && currentUser?.id !== author.id && !author.is_following && (
                          <button
                            onClick={() => handleToggleFollow(author)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 flex items-center gap-1.5 transition-colors"
                          >
                            <UserPlus size={12} /> Follow
                          </button>
                        )}
                      </div>

                      {/* Post Body (Spoiler Blur Wrapper) */}
                      <div className={`relative ${post.is_spoiler ? 'group' : ''}`}>
                        {post.is_spoiler && (
                          <div className="absolute inset-0 z-10 backdrop-blur-xl bg-black/40 flex items-center justify-center rounded-xl cursor-pointer group-hover:opacity-0 transition-opacity">
                            <span className="bg-red-500/20 text-red-400 font-bold px-4 py-2 rounded-full border border-red-500/30 text-sm flex items-center gap-2">
                              ⚠️ Spoiler: Tap to Reveal
                            </span>
                          </div>
                        )}

                        <div className={`mt-2 mb-4 text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap ${post.is_spoiler ? 'blur-sm group-hover:blur-0 transition-all' : ''}`}>
                          {post.content}
                        </div>

                        {/* Type specific UI */}
                        {post.post_type === 'poll' && post.payload?.options && (
                          <div className="flex flex-col gap-2 mt-3 mb-4">
                            {post.payload.options.map((opt: string, i: number) => (
                              <button key={i} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 px-4 text-left text-sm font-semibold transition-colors">
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {(post.post_type === 'meme' || post.post_type === 'scene') && post.payload?.media_url && (
                          <div className="rounded-xl overflow-hidden my-4 max-h-[400px] border border-white/10 relative">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={post.payload.media_url} alt="Post media" className="w-full object-cover" />
                             {post.post_type === 'scene' && (
                               <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/20 flex items-center gap-1.5">
                                 <PlaySquare size={12} /> Scene
                               </div>
                             )}
                          </div>
                        )}

                        {post.post_type === 'review' && post.payload?.rating && (
                          <div className="flex items-center gap-1 mb-4 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={16} fill={i < post.payload.rating ? "#fbbf24" : "transparent"} strokeWidth={i < post.payload.rating ? 0 : 1} stroke="currentColor" />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions (Reactions) */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          {[
                            { emoji: '❤️', id: 'loved' },
                            { emoji: '🔥', id: 'amazing' },
                            { emoji: '😂', id: 'funny' },
                            { emoji: '😱', id: 'mindblown' },
                            { emoji: '👎', id: 'disliked' }
                          ].map(reaction => {
                            const count = post.reactions.filter(r => r.reaction_type === reaction.id).length;
                            const isActive = post.user_reaction === reaction.id;
                            
                            if (count === 0 && !isActive) return null; // Only show active reactions for now, or build a picker
                            
                            return (
                              <button 
                                key={reaction.id}
                                onClick={() => handleReaction(post.id, reaction.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold border transition-colors ${
                                  isActive ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                }`}
                              >
                                <span>{reaction.emoji}</span> {count}
                              </button>
                            );
                          })}
                          
                          {/* Generic Like/React button to open picker */}
                          <button 
                            onClick={() => handleReaction(post.id, 'loved')} // Simplified for now
                            className="flex items-center gap-1.5 text-white/50 hover:text-white text-[13px] font-bold px-3 py-1 ml-2 transition-colors"
                          >
                            <Heart size={15} className={post.user_reaction === 'loved' ? 'fill-red-500 text-red-500' : ''} />
                            React
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4 text-white/50">
                          <button className="flex items-center gap-1.5 text-[13px] font-bold hover:text-white transition-colors">
                            <MessageSquare size={15} />
                            {post.comments_count}
                          </button>
                          <button className="hover:text-white transition-colors">
                            <Share2 size={15} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
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
                  const initials = u.name.slice(0, 2).toUpperCase();
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
                              fontWeight: 800,
                              fontSize: 12,
                              color: 'white',
                            }}
                          >
                            {u.avatar_url ? (
                              <Image src={u.avatar_url} alt={u.name} width={38} height={38} className="object-cover w-full h-full" />
                            ) : (
                              initials
                            )}
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
    </div>
  );
}
