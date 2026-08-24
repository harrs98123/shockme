'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { SocialPost } from '@/app/feed/page';
import {
  MessageSquare,
  Heart,
  Star,
  PlaySquare,
  UserPlus,
  Share2
} from 'lucide-react';

export default function CommunityPosts({ movieId }: { movieId: number }) {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

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
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center font-bold text-white text-xs">
                      {author.avatar_url ? (
                        <Image src={author.avatar_url} alt={author.name} width={40} height={40} className="object-cover w-full h-full" />
                      ) : initials}
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

                {/* Content */}
                <div className={`relative ${post.is_spoiler ? 'group' : ''}`}>
                  {post.is_spoiler && (
                    <div className="absolute inset-0 z-10 backdrop-blur-xl bg-black/40 flex items-center justify-center rounded-xl cursor-pointer group-hover:opacity-0 transition-opacity">
                      <span className="bg-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-full border border-red-500/30 text-xs">
                        ⚠️ Spoiler
                      </span>
                    </div>
                  )}

                  <p className={`text-white/80 text-[14px] leading-relaxed mb-4 ${post.is_spoiler ? 'blur-sm group-hover:blur-0 transition-all' : ''}`}>
                    {post.content}
                  </p>

                  {post.post_type === 'poll' && post.payload?.options && (
                    <div className="flex flex-col gap-2 mb-4">
                      {post.payload.options.map((opt: string, i: number) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm font-semibold">
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {(post.post_type === 'meme' || post.post_type === 'scene') && post.payload?.media_url && (
                    <div className="rounded-xl overflow-hidden mb-4 relative max-h-[250px]">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={post.payload.media_url} alt="Media" className="w-full object-cover" />
                    </div>
                  )}
                  
                  {post.post_type === 'review' && post.payload?.rating && (
                    <div className="flex items-center gap-1 mb-4 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < post.payload.rating ? "#fbbf24" : "transparent"} strokeWidth={i < post.payload.rating ? 0 : 1} stroke="currentColor" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleReaction(post.id, 'loved')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        post.user_reaction ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      ❤️ {post.reactions.length}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 text-white/40">
                    <button className="flex items-center gap-1 hover:text-white text-xs font-bold transition-colors">
                      <MessageSquare size={14} /> {post.comments_count}
                    </button>
                    <button className="hover:text-white transition-colors">
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
