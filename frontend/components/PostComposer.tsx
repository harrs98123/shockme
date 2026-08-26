'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clapperboard, Eye, ThumbsUp, BarChart2, Image as ImageIcon,
  PlaySquare, Bookmark, X, Search, Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import api, { posterUrl } from '@/lib/api';
import Avatar from '@/components/Avatar';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

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

  // Movie search
  const [movieQuery, setMovieQuery] = useState('');
  const debouncedMovieQuery = useDebounce(movieQuery, 400);
  const [movieResults, setMovieResults] = useState<any[]>([]);
  const [searchingMovies, setSearchingMovies] = useState(false);
  const [movieDropdownOpen, setMovieDropdownOpen] = useState(false);

  const resetForm = () => {
    setActiveType(null);
    setContent('');
    setIsSpoiler(false);
    setSelectedMovie(null);
    setRating(0);
    setPollOptions(['', '']);
    setMediaUrl('');
    setMovieQuery('');
    setMovieResults([]);
    setMovieDropdownOpen(false);
  };

  useEffect(() => {
    const q = debouncedMovieQuery.trim();
    if (q.length < 2) {
      setMovieResults([]);
      return;
    }
    let cancelled = false;
    setSearchingMovies(true);
    api.get(`/movies/search?q=${encodeURIComponent(q)}`)
      .then((res) => {
        if (cancelled) return;
        const filtered = (res.data?.results || []).filter((m: any) => m.media_type !== 'person');
        setMovieResults(filtered);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setSearchingMovies(false);
      });
    return () => { cancelled = true; };
  }, [debouncedMovieQuery]);

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
            <Avatar
              src={user.avatar_url}
              seed={user.id || user.username || user.name}
              name={user.name}
              size={44}
              className="object-cover w-full h-full"
              decorative
            />
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
              {/* Movie Search */}
              {['review', 'watching', 'recommendation', 'scene'].includes(activeType) && (
                <div className="mb-4 relative">
                  {selectedMovie ? (
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl py-2 pl-2 pr-3">
                      {selectedMovie.poster && (
                        <img
                          src={posterUrl(selectedMovie.poster, 'w92')}
                          alt=""
                          className="w-8 h-12 object-cover rounded-md"
                        />
                      )}
                      <span className="flex-1 text-sm font-semibold text-white truncate">{selectedMovie.title}</span>
                      <button
                        type="button"
                        onClick={() => { setSelectedMovie(null); setMovieQuery(''); }}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-white/40" size={16} />
                      <input
                        type="text"
                        placeholder="Search for a movie or show..."
                        value={movieQuery}
                        onChange={(e) => {
                          setMovieQuery(e.target.value);
                          setMovieDropdownOpen(true);
                        }}
                        onFocus={() => setMovieDropdownOpen(true)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-9 text-sm text-white focus:outline-none focus:border-primary/50"
                      />
                      {searchingMovies && (
                        <Loader2 size={15} className="absolute right-3 top-3 text-white/40 animate-spin" />
                      )}
                    </div>
                  )}

                  {movieDropdownOpen && !selectedMovie && movieQuery.trim().length >= 2 && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setMovieDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#16161c] border border-white/15 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                        {movieResults.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-white/40 font-semibold">
                            {searchingMovies ? 'Searching...' : 'No results found'}
                          </div>
                        ) : (
                          movieResults.slice(0, 8).map((m) => {
                            const title = m.title || m.name;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMovie({ id: m.id, title, poster: m.poster_path });
                                  setMovieDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                              >
                                {m.poster_path ? (
                                  <img
                                    src={posterUrl(m.poster_path, 'w92')}
                                    alt=""
                                    className="w-7 h-10 object-cover rounded shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-10 rounded bg-white/10 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-white truncate">{title}</div>
                                  <div className="text-[11px] text-white/40">
                                    {m.media_type === 'tv' ? 'TV Show' : 'Movie'}
                                    {(m.release_date || m.first_air_date) ? ` • ${(m.release_date || m.first_air_date).slice(0, 4)}` : ''}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Specific Post Type Inputs */}
              {activeType === 'review' && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm font-semibold text-white/60">Rating:</span>
                  {[1, 2, 3, 4, 5].map(star => (
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
