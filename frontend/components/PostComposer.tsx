'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clapperboard, Eye, ThumbsUp, BarChart2, Image as ImageIcon, 
  PlaySquare, Bookmark, X, Search, ChevronDown, Check
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const POST_TYPES = [
  { id: 'review', label: 'Movie Review', icon: ThumbsUp, color: '#c084fc', desc: 'Rate and review a movie' },
  { id: 'watching', label: 'Watching', icon: Eye, color: '#38bdf8', desc: 'What are you watching right now?' },
  { id: 'recommendation', label: 'Recommend', icon: Clapperboard, color: '#f43f5e', desc: 'Suggest a movie to a friend' },
  { id: 'poll', label: 'Movie Poll', icon: BarChart2, color: '#fbbf24', desc: 'Ask your followers a question' },
  { id: 'meme', label: 'Meme/Image', icon: ImageIcon, color: '#a3e635', desc: 'Share a funny movie meme' },
  { id: 'scene', label: 'Scene', icon: PlaySquare, color: '#f472b6', desc: 'Post a memorable scene' },
  { id: 'watchlist', label: 'Watchlist', icon: Bookmark, color: '#818cf8', desc: 'Share your weekend watchlist' }
];

export default function PostComposer({ onPostCreated }: { onPostCreated: () => void }) {
  const { user } = useAuth();
  const [activeType, setActiveType] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);

  // Payload specific states
  const [selectedMovie, setSelectedMovie] = useState<{ id: number; title: string; poster?: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [mediaUrl, setMediaUrl] = useState('');

  const resetForm = () => {
    setActiveType(null);
    setContent('');
    setIsSpoiler(false);
    setSelectedMovie(null);
    setRating(0);
    setPollOptions(['', '']);
    setMediaUrl('');
  };

  const handleSubmit = async () => {
    if (!activeType) return;
    if (!content.trim() && activeType !== 'poll') return;

    setIsSubmitting(true);
    try {
      const payload: any = {};
      
      if (activeType === 'review') {
        payload.rating = rating;
      } else if (activeType === 'poll') {
        payload.options = pollOptions.filter(o => o.trim());
      } else if (activeType === 'meme' || activeType === 'scene') {
        payload.media_url = mediaUrl;
      }

      await api.post('/posts/', {
        post_type: activeType,
        content: content,
        movie_id: selectedMovie?.id,
        is_spoiler: isSpoiler,
        payload: Object.keys(payload).length > 0 ? payload : null
      });

      resetForm();
      onPostCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const initials = user.name?.slice(0, 2).toUpperCase();

  return (
    <div style={{
      background: '#0f0f14',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20,
      padding: '20px',
      marginBottom: '24px'
    }}>
      {!activeType ? (
        // Closed State - Just input and buttons
        <div className="flex items-center gap-4">
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#222', flexShrink: 0, overflow: 'hidden' }}>
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt="" width={44} height={44} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs">{initials}</div>
            )}
          </div>
          <input
            type="text"
            placeholder="What's your hot take today?"
            readOnly
            onClick={() => setActiveType('review')}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '12px 20px',
              borderRadius: 99,
              color: 'white',
              fontSize: 15,
              cursor: 'pointer'
            }}
            className="hover:bg-white/5 transition-colors"
          />
        </div>
      ) : (
        // Open State - Full Composer
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                Create Post
              </h3>
              <button onClick={resetForm} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Post Type Selector */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {POST_TYPES.map(pt => {
                const isActive = activeType === pt.id;
                return (
                  <button
                    key={pt.id}
                    onClick={() => setActiveType(pt.id)}
                    style={{
                      background: isActive ? `${pt.color}15` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? `${pt.color}40` : 'rgba(255,255,255,0.05)'}`,
                      color: isActive ? pt.color : 'rgba(255,255,255,0.5)'
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                  >
                    <pt.icon size={14} /> {pt.label}
                  </button>
                )
              })}
            </div>

            {/* Dynamic Input Area */}
            <div className="mt-4">
              {/* Optional Movie Search (Mocked for UI) */}
              {['review', 'watching', 'recommendation', 'scene'].includes(activeType) && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-white/40" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search movie (mocked, using Interstellar ID: 157336)" 
                      value={selectedMovie ? selectedMovie.title : ''}
                      onChange={(e) => {
                        // In real app, fetch search results. Here we just hardcode Interstellar for demo
                        if (e.target.value.length > 2) {
                          setSelectedMovie({ id: 157336, title: 'Interstellar', poster: '/np.png' })
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* Specific Post Type Inputs */}
              {activeType === 'review' && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm font-semibold text-white/60">Rating:</span>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setRating(star)} className="text-xl hover:scale-110 transition-transform">
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              )}

              {activeType === 'poll' && (
                <div className="flex flex-col gap-2 mb-4">
                  {pollOptions.map((opt, idx) => (
                    <input 
                      key={idx}
                      type="text" 
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    />
                  ))}
                  {pollOptions.length < 4 && (
                    <button 
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-xs text-primary font-bold self-start mt-1 hover:underline"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              )}

              {(activeType === 'meme' || activeType === 'scene') && (
                <div className="mb-4">
                  <input 
                    type="text" 
                    placeholder="Paste Image/GIF URL"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  />
                  {mediaUrl && (
                    <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden bg-black/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              <textarea
                placeholder={activeType === 'poll' ? "Ask a question..." : "Write your thoughts..."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-transparent border-none text-white text-[15px] resize-none focus:outline-none min-h-[80px]"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <label className="flex items-center gap-2 text-xs font-bold text-white/50 cursor-pointer hover:text-white/80 transition-colors">
                <input 
                  type="checkbox" 
                  checked={isSpoiler} 
                  onChange={(e) => setIsSpoiler(e.target.checked)}
                  className="accent-red-500 w-4 h-4"
                />
                ⚠️ Contains Spoilers
              </label>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && activeType !== 'poll')}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 24px',
                  borderRadius: 99,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: (!content.trim() && activeType !== 'poll') ? 0.5 : 1
                }}
                className="hover:scale-105 transition-transform"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
