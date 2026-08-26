'use client';

import { memo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserPlus,
  MessageSquare,
  Star,
  Heart,
  Share2,
  AlertTriangle,
  Smile,
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import ScenePlayer from '@/components/ScenePlayer';
import PollCard from '@/components/PollCard';
import CommentThread from '@/components/CommentThread';
import { SharePostData } from '@/components/ShareModal';

export interface SocialPost {
  id: number;
  post_type: 'review' | 'watching' | 'recommendation' | 'poll' | 'meme' | 'scene' | 'watchlist';
  content: string | null;
  movie_id: number | null;
  movie_title?: string | null;
  movie?: any;
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

const REACTIONS = [
  { emoji: '❤️', id: 'loved', label: 'Loved' },
  { emoji: '🔥', id: 'amazing', label: 'Amazing' },
  { emoji: '😂', id: 'funny', label: 'Funny' },
  { emoji: '😱', id: 'mindblown', label: 'Mindblown' },
  { emoji: '👎', id: 'disliked', label: 'Disliked' },
];

interface FeedPostCardProps {
  post: SocialPost;
  index: number;
  currentUserId?: number;
  showFollowButton: boolean;
  onReact: (postId: number, reactionType: string) => void;
  onToggleFollow: (author: { id: number; is_following: boolean }) => void;
  onShare: (data: SharePostData) => void;
  onPollVoteSuccess: (postId: number, updatedPayload: any) => void;
  onCommentAdded: (postId: number) => void;
}

function FeedPostCard({
  post,
  index,
  currentUserId,
  showFollowButton,
  onReact,
  onToggleFollow,
  onShare,
  onPollVoteSuccess,
  onCommentAdded,
}: FeedPostCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const author = post.author;
  const timeStr = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isSpoilerPost = post.is_spoiler;
  const isBlurred = isSpoilerPost && !isRevealed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      className="bg-[#0f0f14] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/user/${author.id}`}>
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
              <Avatar
                src={author.avatar_url}
                seed={author.id || author.username || author.name}
                name={author.name}
                size={44}
                className="object-cover w-full h-full"
                decorative
              />
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

        {showFollowButton && currentUserId !== author.id && !author.is_following && (
          <button
            onClick={() => onToggleFollow(author)}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 flex items-center gap-1.5 transition-colors"
          >
            <UserPlus size={12} /> Follow
          </button>
        )}
      </div>

      {/* Post Body with Tap-to-Reveal Spoiler */}
      <div className="relative my-2">
        {isBlurred && (
          <div
            onClick={() => setIsRevealed(true)}
            className="absolute inset-0 z-20 backdrop-blur-md bg-black/60 rounded-xl flex items-center justify-center p-4 cursor-pointer select-none border border-white/5"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsRevealed(true);
              }}
              className="px-4 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-red-400 border border-red-500/30 text-xs font-bold transition-colors shadow-lg flex items-center gap-2"
            >
              <AlertTriangle size={13} className="text-red-400" />
              <span>Spoiler Warning • Tap to Reveal</span>
            </button>
          </div>
        )}

        {isSpoilerPost && isRevealed && (
          <div className="flex items-center justify-between mb-2 text-xs text-red-400/80">
            <span className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle size={12} /> Spoiler Warning
            </span>
            <button
              type="button"
              onClick={() => setIsRevealed(false)}
              className="text-[11px] text-white/40 hover:text-white/80 transition-colors cursor-pointer"
            >
              Hide
            </button>
          </div>
        )}

        <div
          style={{
            filter: isBlurred ? 'blur(8px)' : 'none',
            opacity: isBlurred ? 0.3 : 1,
            pointerEvents: isBlurred ? 'none' : 'auto',
            userSelect: isBlurred ? 'none' : 'auto',
            transition: 'filter 0.2s ease, opacity 0.2s ease',
          }}
        >
          <div className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap mb-3">
            {post.content}
          </div>

          {post.post_type === 'poll' && (
            <PollCard
              postId={post.id}
              payload={post.payload}
              onVoteSuccess={(updated) => onPollVoteSuccess(post.id, updated)}
            />
          )}

          {post.post_type === 'scene' ? (
            <ScenePlayer
              mediaUrl={post.payload?.media_url}
              videoUrl={post.payload?.video_url}
              youtubeId={post.payload?.youtube_id}
              movieTitle={post.movie_title || post.movie?.title}
              movieId={post.movie_id}
              sceneTitle={post.payload?.scene_title}
              caption={post.content || undefined}
            />
          ) : post.post_type === 'meme' && post.payload?.media_url ? (
            <div className="rounded-xl overflow-hidden my-4 max-h-[400px] border border-white/10 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.payload.media_url} alt="Post media" className="w-full object-cover" />
            </div>
          ) : null}

          {post.post_type === 'review' && post.payload?.rating && (
            <div className="flex items-center gap-1 mb-4 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill={i < post.payload.rating ? "#fbbf24" : "transparent"} strokeWidth={i < post.payload.rating ? 0 : 1} stroke="currentColor" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 relative">
          {REACTIONS.map(reaction => {
            const count = post.reactions.filter(r => r.reaction_type === reaction.id).length;
            const isActive = post.user_reaction === reaction.id;

            if (count === 0 && !isActive) return null;

            return (
              <button
                key={reaction.id}
                onClick={() => onReact(post.id, reaction.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold border transition-colors ${isActive ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
              >
                <span>{reaction.emoji}</span> {count}
              </button>
            );
          })}

          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="flex items-center gap-1.5 text-white/50 hover:text-white text-[13px] font-bold px-3 py-1 ml-2 transition-colors"
            >
              {post.user_reaction ? (
                <Heart size={15} className="fill-red-500 text-red-500" />
              ) : (
                <Smile size={15} />
              )}
              React
            </button>

            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPickerOpen(false)} />
                <div className="absolute bottom-full left-0 mb-2 z-40 flex items-center gap-1 bg-[#16161c] border border-white/15 rounded-full px-2 py-1.5 shadow-xl">
                  {REACTIONS.map((reaction) => (
                    <button
                      key={reaction.id}
                      onClick={() => {
                        onReact(post.id, reaction.id);
                        setPickerOpen(false);
                      }}
                      title={reaction.label}
                      className={`text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 hover:scale-125 transition-transform ${post.user_reaction === reaction.id ? 'bg-primary/20' : ''}`}
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-white/50">
          <button
            onClick={() => setCommentsOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-[13px] font-bold hover:text-white transition-colors ${commentsOpen ? 'text-white' : ''}`}
          >
            <MessageSquare size={15} />
            {post.comments_count}
          </button>
          <button
            type="button"
            onClick={() => onShare({
              id: post.id,
              content: post.content,
              authorName: author.name,
              authorUsername: author.username || undefined,
              authorAvatar: author.avatar_url,
              postType: post.post_type,
              movieTitle: post.movie_title || post.movie?.title,
            })}
            className="hover:text-white transition-colors cursor-pointer"
            title="Share post"
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      {commentsOpen && (
        <CommentThread postId={post.id} onCommentAdded={() => onCommentAdded(post.id)} />
      )}
    </motion.div>
  );
}

export default memo(FeedPostCard);
