'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { SocialPost } from '@/components/FeedPostCard';
import {
  MessageSquare,
  Heart,
  Star,
  PlaySquare,
  UserPlus,
  Share2,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import Avatar from '@/components/Avatar';
// Only rendered for posts of the matching `post_type` — most post feeds are
// plain text, so neither chunk is worth including until one is actually needed.
const ScenePlayer = dynamic(() => import('@/components/ScenePlayer'));
const PollCard = dynamic(() => import('@/components/PollCard'));
import type { SharePostData } from '@/components/ShareModal';

// Gated behind `isShareModalOpen &&` at its render site below. This component
// is imported eagerly by every /movie and /tv page, so keeping the modal's
// chunk out of that path until someone actually clicks share matters here.
const ShareModal = dynamic(() => import('@/components/ShareModal'), { ssr: false });

export default function CommunityPosts({ movieId }: { movieId: number }) {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<number>>(new Set());
  const [shareTargetPost, setShareTargetPost] = useState<SharePostData | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const toggleSpoiler = (postId: number) => {
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get<SocialPost[]>(`/posts/movie/${movieId}`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [movieId]);

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

  if (loading) {
    return <div className="h-40 animate-pulse bg-white/5 rounded-2xl"></div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 border border-white/10 rounded-3xl">
        <MessageSquare size={32} className="mx-auto text-white/20 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">No Community Posts Yet</h3>
        <p className="text-sm text-white/50">Be the first to share your thoughts, memes, or review for this movie!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-2xl font-black text-white flex items-center gap-3">
        Community Hub
        <span className="bg-primary/20 text-primary text-xs px-2.5 py-1 rounded-full border border-primary/30">
          {posts.length} Posts
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {posts.map((post, index) => {
            const author = post.author;
            const initials = author.name ? author.name.slice(0, 2).toUpperCase() : 'U';

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
                className="bg-[#0f0f14] border border-white/10 rounded-3xl p-5 hover:border-white/20 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <Link href={`/user/${author.id}`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                      <Avatar
                        src={author.avatar_url}
                        seed={author.id || author.username || author.name}
                        name={author.name}
                        size={40}
                        className="object-cover w-full h-full"
                        decorative
                      />
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-white group-hover:text-primary transition-colors">
                        {author.name}
                      </div>
                      <div className="text-[11px] text-white/40 font-semibold">
                        @{author.username}
                      </div>
                    </div>
                  </Link>

                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/30 bg-white/5 px-2 py-1 rounded">
                    {post.post_type}
                  </span>
                </div>

                {/* Content with Tap-to-Reveal Spoiler */}
                {(() => {
                  const isSpoilerPost = post.is_spoiler;
                  const isRevealed = revealedSpoilers.has(post.id);
                  const isBlurred = isSpoilerPost && !isRevealed;

                  return (
                    <div className="relative my-2">
                      {/* Minimal Spoiler Overlay */}
                      {isBlurred && (
                        <div
                          onClick={() => toggleSpoiler(post.id)}
                          className="absolute inset-0 z-20 backdrop-blur-md bg-black/60 rounded-xl flex items-center justify-center p-4 cursor-pointer select-none border border-white/5"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSpoiler(post.id);
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-red-400 border border-red-500/30 text-xs font-bold transition-colors shadow-lg flex items-center gap-2"
                          >
                            <AlertTriangle size={13} className="text-red-400" />
                            <span>Spoiler Warning • Tap to Reveal</span>
                          </button>
                        </div>
                      )}

                      {/* Header badge if revealed */}
                      {isSpoilerPost && isRevealed && (
                        <div className="flex items-center justify-between mb-2 text-xs text-red-400/80">
                          <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                            <AlertTriangle size={12} /> Spoiler Warning
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSpoiler(post.id)}
                            className="text-[11px] text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                          >
                            Hide
                          </button>
                        </div>
                      )}

                      {/* Content Body */}
                      <div
                        style={{
                          filter: isBlurred ? 'blur(8px)' : 'none',
                          opacity: isBlurred ? 0.3 : 1,
                          pointerEvents: isBlurred ? 'none' : 'auto',
                          userSelect: isBlurred ? 'none' : 'auto',
                          transition: 'filter 0.2s ease, opacity 0.2s ease',
                        }}
                      >
                        <p className="text-white/80 text-[14px] leading-relaxed mb-3">
                          {post.content}
                        </p>

                        {post.post_type === 'poll' && (
                          <PollCard
                            postId={post.id}
                            payload={post.payload}
                            onVoteSuccess={(updated) => {
                              setPosts((prev) =>
                                prev.map((p) =>
                                  p.id === post.id ? { ...p, payload: updated } : p
                                )
                              );
                            }}
                          />
                        )}

                        {post.post_type === 'scene' ? (
                          <ScenePlayer
                            mediaUrl={post.payload?.media_url}
                            videoUrl={post.payload?.video_url}
                            youtubeId={post.payload?.youtube_id}
                            movieTitle={post.movie_title || post.movie?.title}
                            movieId={post.movie_id || movieId}
                            sceneTitle={post.payload?.scene_title}
                            caption={post.content || undefined}
                          />
                        ) : post.post_type === 'meme' && post.payload?.media_url ? (
                          <div className="rounded-xl overflow-hidden mb-4 relative max-h-[250px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.payload.media_url} alt="Media" className="w-full object-cover" />
                          </div>
                        ) : null}

                        {post.post_type === 'review' && post.payload?.rating && (
                          <div className="flex items-center gap-1 mb-4 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < post.payload.rating ? "#fbbf24" : "transparent"} strokeWidth={i < post.payload.rating ? 0 : 1} stroke="currentColor" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReaction(post.id, 'loved')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${post.user_reaction ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      ❤️ {post.reactions.length}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-white/40">
                    <button className="flex items-center gap-1 hover:text-white text-xs font-bold transition-colors">
                      <MessageSquare size={14} /> {post.comments_count}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShareTargetPost({
                          id: post.id,
                          content: post.content,
                          authorName: author.name,
                          authorUsername: author.username || undefined,
                          authorAvatar: author.avatar_url,
                          postType: post.post_type,
                          movieTitle: post.movie_title || post.movie?.title,
                        });
                        setIsShareModalOpen(true);
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                      title="Share post"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
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
