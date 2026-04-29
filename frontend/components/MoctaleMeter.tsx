'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Sparkles, Zap, Star, MessageSquare, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReviewComment {
  id: number;
  review_id: number;
  user_id: number;
  author_name: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
  likes_count: number;
  user_liked: boolean;
  replies?: ReviewComment[];
}

interface Review {
  id: number;
  user_id: number;
  author_name: string;
  label: string;
  review_text: string;
  created_at: string;
  likes_count: number;
  user_liked: boolean;
  comments_count: number;
  comments: ReviewComment[];
}

interface MoctaleStats {
  total: number;
  skip: number;
  timepass: number;
  goforit: number;
  perfection: number;
  skip_pct: number;
  timepass_pct: number;
  goforit_pct: number;
  perfection_pct: number;
  top_label: string;
  user_label: string | null;
  reviews: Review[];
}

const LABELS = [
  { id: 'skip', label: 'Skip', color: '#f43f5e', glow: 'rgba(244,63,94,0.3)', icon: Zap },
  { id: 'timepass', label: 'Timepass', color: '#fbbf24', glow: 'rgba(251,191,36,0.3)', icon: MessageSquare },
  { id: 'goforit', label: 'Go for it', color: '#10b981', glow: 'rgba(16,185,129,0.3)', icon: Star },
  { id: 'perfection', label: 'Perfection', color: '#a78bfa', glow: 'rgba(167,139,250,0.3)', icon: Sparkles },
] as const;

type LabelId = 'skip' | 'timepass' | 'goforit' | 'perfection';

function getLabelMeta(id: string) {
  return LABELS.find((l) => l.id === id) ?? LABELS[2];
}

// ── Gauge Implementation ─────────────────────────────────────────────
function Gauge({ stats, hoveredSegment, setHoveredSegment }: { 
  stats: MoctaleStats;
  hoveredSegment: string | null;
  setHoveredSegment: (id: string | null) => void;
}) {
  const topLabel = hoveredSegment ? getLabelMeta(hoveredSegment) : getLabelMeta(stats.top_label);
  const topPct = hoveredSegment === 'skip' ? stats.skip_pct
               : hoveredSegment === 'timepass' ? stats.timepass_pct
               : hoveredSegment === 'goforit' ? stats.goforit_pct
               : hoveredSegment === 'perfection' ? stats.perfection_pct
               : (
                    stats.top_label === 'skip' ? stats.skip_pct
                  : stats.top_label === 'timepass' ? stats.timepass_pct
                  : stats.top_label === 'goforit' ? stats.goforit_pct
                  : stats.perfection_pct
                 );

  const R = 80;
  const cx = 140;
  const cy = 100;
  const strokeW = 16;
  const gapAngle = 4; // Gap between segments in degrees

  const segments = [
    { key: 'skip', pct: stats.skip_pct, color: '#f43f5e' },
    { key: 'timepass', pct: stats.timepass_pct, color: '#fbbf24' },
    { key: 'goforit', pct: stats.goforit_pct, color: '#10b981' },
    { key: 'perfection', pct: stats.perfection_pct, color: '#a78bfa' },
  ].filter(s => s.pct > 0);

  const totalPct = segments.reduce((s, seg) => s + seg.pct, 0) || 100;

  const polarToX = (angle: number) => cx + R * Math.cos((Math.PI * angle) / 180);
  const polarToY = (angle: number) => cy - R * Math.sin((Math.PI * angle) / 180);

  const arcs: { d: string; color: string; key: string }[] = [];
  let current = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    let sweep = (seg.pct / totalPct) * 180;
    
    // Adjust for gap
    if (segments.length > 1) {
       sweep -= gapAngle;
    }
    
    if (sweep < 1) sweep = 1; // Min visual size

    const startAngle = 180 - current;
    const endAngle = 180 - (current + sweep);
    const x1 = polarToX(startAngle);
    const y1 = polarToY(startAngle);
    const x2 = polarToX(endAngle);
    const y2 = polarToY(endAngle);
    const largeArc = sweep > 90 ? 1 : 0;
    arcs.push({
      d: `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`,
      color: seg.color,
      key: seg.key
    });
    
    current += sweep + gapAngle;
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={280} height={120} viewBox="0 0 280 120" style={{ overflow: 'visible' }}>
        <path
          d={`M ${polarToX(180)} ${polarToY(180)} A ${R} ${R} 0 0 1 ${polarToX(0)} ${polarToY(0)}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {arcs.map((arc) => {
          const isHovered = hoveredSegment === arc.key;
          const fadeOut = hoveredSegment !== null && hoveredSegment !== arc.key;
          return (
            <motion.path
              key={arc.key}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, opacity: fadeOut ? 0.3 : 1 }}
              transition={{ duration: 1, ease: 'easeOut', opacity: { duration: 0.2 } }}
              d={arc.d}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeW}
              strokeLinecap="round"
              onMouseEnter={() => setHoveredSegment(arc.key)}
              onMouseLeave={() => setHoveredSegment(null)}
              style={{ cursor: 'pointer', outline: 'none' }}
              whileHover={{ strokeWidth: strokeW + 4 }}
            />
          );
        })}
        <foreignObject x={cx - 70} y={cy - 50} width="140" height="90">
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <span style={{ fontSize: '36px', fontWeight: 500, color: topLabel.color, letterSpacing: '-1px', fontFamily: 'Inter' }}>
                {topPct.toFixed(0)}%
              </span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                {stats.total.toLocaleString()} Votes
              </span>
           </div>
        </foreignObject>
      </svg>

      {/* Legends Inline under Gauge */}
      <div className="flex items-center gap-6 mt-8 flex-wrap justify-center">
        {LABELS.map((l) => {
          const pct = l.id === 'skip' ? stats.skip_pct
                    : l.id === 'timepass' ? stats.timepass_pct
                    : l.id === 'goforit' ? stats.goforit_pct
                    : stats.perfection_pct;
          const count = l.id === 'skip' ? stats.skip
                      : l.id === 'timepass' ? stats.timepass
                      : l.id === 'goforit' ? stats.goforit
                      : stats.perfection;
          const isHovered = hoveredSegment === l.id;
          const fadeOut = hoveredSegment !== null && hoveredSegment !== l.id;
          return (
            <div 
              key={l.id} 
              className="flex items-center gap-2 cursor-pointer transition-opacity"
              style={{ opacity: fadeOut ? 0.3 : 1 }}
              onMouseEnter={() => setHoveredSegment(l.id)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: l.color }} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 600 }}>{l.label}</span>
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>{pct.toFixed(0)}%</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const addReplyInTree = (comments: ReviewComment[], parentId: number, newComment: ReviewComment): ReviewComment[] => {
  return comments.map(c => {
    if (c.id === parentId) {
      return { ...c, replies: [...(c.replies || []), newComment] };
    }
    if (c.replies?.length) {
      return { ...c, replies: addReplyInTree(c.replies, parentId, newComment) };
    }
    return c;
  });
};

const updateCommentLikeInTree = (comments: ReviewComment[], commentId: number): ReviewComment[] => {
  return comments.map(c => {
    if (c.id === commentId) {
      return { ...c, user_liked: !c.user_liked, likes_count: c.user_liked ? c.likes_count - 1 : c.likes_count + 1 };
    }
    if (c.replies?.length) {
      return { ...c, replies: updateCommentLikeInTree(c.replies, commentId) };
    }
    return c;
  });
};

const deleteCommentInTree = (comments: ReviewComment[], commentId: number): ReviewComment[] => {
  return comments.filter(c => c.id !== commentId).map(c => {
    if (c.replies?.length) {
      return { ...c, replies: deleteCommentInTree(c.replies, commentId) };
    }
    return c;
  });
};

function CommentNode({ comment, currentUser, onReply, onLike, onDelete }: {
  comment: ReviewComment;
  currentUser: any;
  onReply: (commentId: number, username: string) => void;
  onLike: (commentId: number) => void;
  onDelete: (commentId: number) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const repliesCount = comment.replies?.length || 0;

  return (
    <div className="flex flex-col gap-1 w-full relative">
      <div className="flex gap-3 mt-1">
        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold shrink-0 mt-1 border border-white/5">
          {comment.author_name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col max-w-[85%]">
          <div className="flex flex-col bg-white/5 rounded-2xl rounded-tl-none px-4 py-2 border border-white/5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-white/60 mb-0.5">{comment.author_name}</span>
            <span className="text-[13px] text-white/90 leading-snug">{comment.content}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 px-2 text-[10px] font-bold text-white/40">
            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
            <button 
              onClick={() => onLike(comment.id)} 
              className={`hover:text-white transition-colors ${comment.user_liked ? 'text-red-500' : ''}`}
            >
              {comment.likes_count > 0 ? `${comment.likes_count} likes` : 'Like'}
            </button>
            <button onClick={() => onReply(comment.id, comment.author_name)} className="hover:text-white transition-colors">Reply</button>
            {(currentUser?.id === comment.user_id || currentUser?.is_admin) && (
              <button onClick={() => onDelete(comment.id)} className="hover:text-red-400 transition-colors">Delete</button>
            )}
          </div>
        </div>
      </div>
      
      {/* Replies Toggle */}
      {repliesCount > 0 && (
        <div className="ml-10 mt-1 mb-1">
          <button 
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 text-[11px] font-bold text-white/40 hover:text-white/80 transition-colors"
          >
            <div className="w-6 h-[1px] bg-white/20"></div>
            {showReplies ? `Hide replies` : `View ${repliesCount} ${repliesCount === 1 ? 'reply' : 'replies'}`}
          </button>
        </div>
      )}

      {/* Replies List */}
      {showReplies && repliesCount > 0 && (
        <div className="ml-9 flex flex-col gap-1 pl-3 border-l-[1.5px] border-white/10 mt-1">
          {comment.replies!.map(reply => (
            <CommentNode 
              key={reply.id} 
              comment={reply} 
              currentUser={currentUser} 
              onReply={onReply} 
              onLike={onLike} 
              onDelete={onDelete} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── MoctaleMeter Main Component ───────────────────────────────────────
export default function MoctaleMeter({ movieId, mediaType = 'movie' }: { movieId: number, mediaType?: 'movie' | 'tv' }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<MoctaleStats | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<LabelId | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<number, number | null>>({});
  const [postingComment, setPostingComment] = useState<number | null>(null);

  const [filterSpoilers, setFilterSpoilers] = useState(false);
  const [filterFollowing, setFilterFollowing] = useState(false);
  const [sortBy, setSortBy] = useState('Most Liked');

  const toggleComments = (reviewId: number) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };

  const handleToggleLike = async (reviewId: number) => {
    if (!user) { setToastMsg('Login to like this review'); setTimeout(() => setToastMsg(''), 3000); return; }
    try {
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map(r => {
            if (r.id === reviewId) {
              return { ...r, likes_count: r.user_liked ? r.likes_count - 1 : r.likes_count + 1, user_liked: !r.user_liked };
            }
            return r;
          })
        };
      });
      await api.post(`/moctale/reviews/${reviewId}/like`);
    } catch {
      loadStats();
    }
  };

  const handlePostComment = async (reviewId: number) => {
    let text = commentTexts[reviewId]?.trim();
    if (!text) return;
    if (!user) { setToastMsg('Login to comment'); setTimeout(() => setToastMsg(''), 3000); return; }
    
    // If replying to someone, maybe text starts with @username. The backend doesn't care, it just saves what's in content.
    const parentId = replyingTo[reviewId] || null;

    setPostingComment(reviewId);
    try {
      const res = await api.post(`/moctale/reviews/${reviewId}/comments`, { content: text, parent_id: parentId });
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map(r => {
            if (r.id === reviewId) {
              return { 
                ...r, 
                comments_count: r.comments_count + 1, 
                comments: parentId ? addReplyInTree(r.comments, parentId, res.data) : [...r.comments, res.data] 
              };
            }
            return r;
          })
        };
      });
      setCommentTexts(prev => ({ ...prev, [reviewId]: '' }));
      setReplyingTo(prev => ({ ...prev, [reviewId]: null }));
    } catch {
      setToastMsg('Failed to post comment');
      setTimeout(() => setToastMsg(''), 3000);
    }
    setPostingComment(null);
  };

  const handleToggleCommentLike = async (reviewId: number, commentId: number) => {
    if (!user) { setToastMsg('Login to like this comment'); setTimeout(() => setToastMsg(''), 3000); return; }
    try {
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map(r => {
            if (r.id === reviewId) {
              return { ...r, comments: updateCommentLikeInTree(r.comments, commentId) };
            }
            return r;
          })
        };
      });
      await api.post(`/moctale/comments/${commentId}/like`);
    } catch {
      loadStats();
    }
  };

  const handleDeleteComment = async (reviewId: number, commentId: number) => {
    try {
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map(r => {
            if (r.id === reviewId) {
              return { ...r, comments_count: Math.max(0, r.comments_count - 1), comments: deleteCommentInTree(r.comments, commentId) };
            }
            return r;
          })
        };
      });
      await api.delete(`/moctale/comments/${commentId}`);
    } catch {
      loadStats();
      setToastMsg('Failed to delete comment');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get(`/moctale/${movieId}?media_type=${mediaType}`);
      setStats(res.data);
      if (res.data.user_label) setSelectedLabel(res.data.user_label as LabelId);
    } catch {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/moctale/${movieId}?media_type=${mediaType}`);
        if (res.ok) setStats(await res.json());
      } catch { /* ignore */ }
    }
  }, [movieId, mediaType]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleLabelClick = (id: LabelId) => {
    const isSelected = selectedLabel === id;
    setSelectedLabel(isSelected ? null : id);
    
    // Confetti Effect for Perfection
    if (id === 'perfection' && !isSelected) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a78bfa', '#8b5cf6', '#d946ef', '#ffffff']
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedLabel) return;
    if (!user) { setToastMsg('Login to rate this movie'); setTimeout(() => setToastMsg(''), 3000); return; }
    setSubmitting(true);
    try {
      await api.post(`/moctale/${movieId}`, {
        label: selectedLabel,
        media_type: mediaType,
        review_text: reviewText.trim() || null,
      });
      setToastMsg('Rating submitted! 🎉');
      setTimeout(() => setToastMsg(''), 3000);
      setReviewText('');
      await loadStats();
    } catch {
      setToastMsg('Failed to submit. Try again.');
      setTimeout(() => setToastMsg(''), 3000);
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full text-white mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[22px] font-bold">Moctale Meter</h2>
        <button className="text-white/60 hover:text-white transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      {/* GAUGE SECTION */}
      <div className="mb-12">
        {stats && stats.total > 0 ? (
          <Gauge stats={stats} hoveredSegment={hoveredSegment} setHoveredSegment={setHoveredSegment} />
        ) : (
          <div className="text-center py-10 bg-white/5 rounded-[24px] border border-white/10">
            <Zap size={32} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-[15px]">No votes yet. Be the first!</p>
          </div>
        )}
      </div>

      {/* DIVIDER */}
      <div className="h-[1px] w-full bg-white/10 mb-8" />

      {/* REVIEWS HEADER & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-[20px] font-bold">Reviews</h3>
        
        <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <div className="relative shrink-0">
             <select 
               value={sortBy} 
               onChange={(e)=>setSortBy(e.target.value)}
               className="appearance-none bg-transparent border border-white/20 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/80 outline-none pr-7 cursor-pointer hover:bg-white/5 transition-colors"
             >
               <option className="bg-[#121212] text-white">↓↑ Most Liked</option>
               <option className="bg-[#121212] text-white">↓↑ Recent</option>
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/60">
               <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
             </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer shrink-0 border border-white/20 rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors">
            <input 
              type="checkbox" 
              checked={filterSpoilers} 
              onChange={(e) => setFilterSpoilers(e.target.checked)}
              className="accent-purple-500 rounded bg-transparent border-white/30"
              style={{ width: 14, height: 14 }}
            />
            <span className="text-xs font-semibold text-white/80">Show Spoilers</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer shrink-0 border border-white/20 rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors">
            <input 
              type="checkbox" 
              checked={filterFollowing} 
              onChange={(e) => setFilterFollowing(e.target.checked)}
              className="accent-purple-500 rounded bg-transparent border-white/30"
              style={{ width: 14, height: 14 }}
            />
            <span className="text-xs font-semibold text-white/80">Following Only</span>
          </label>
        </div>
      </div>

      {/* INPUT SECTION */}
      <div className="bg-[#1c1c1c] rounded-2xl p-4 sm:p-5 mb-8 border border-white/10">
         <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            {/* User Profile */}
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {user && user.username ? user.username.slice(0,2).toUpperCase() : (user && user.email ? user.email.slice(0,2).toUpperCase() : '❓')}
               </div>
               <span className="font-bold text-[14px]">
                 {user && user.username ? `@${user.username}` : (user && user.email ? user.email : 'Guest')}
               </span>
            </div>

            {/* Rating Buttons */}
            <div className="flex items-center gap-2 sm:ml-auto overflow-x-auto hide-scrollbar border border-white/10 rounded-full p-1 bg-[#121212]">
                {LABELS.map((l) => {
                  const isSelected = selectedLabel === l.id;
                  const count = stats ? (l.id === 'skip' ? stats.skip : l.id === 'timepass' ? stats.timepass : l.id === 'goforit' ? stats.goforit : stats.perfection) : 0;
                  return (
                    <button
                      key={l.id}
                      onClick={() => handleLabelClick(l.id as LabelId)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap`}
                      style={{
                        background: isSelected ? l.color : 'transparent',
                        color: isSelected ? '#000' : 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <span>{l.label}</span>
                      <span style={{ opacity: isSelected ? 0.6 : 0.4, fontSize: '10px' }}>{count}</span>
                    </button>
                  );
                })}
            </div>
         </div>

         {/* Review Text Area */}
         <div className="relative">
           <textarea
             placeholder="Write your review here..."
             value={reviewText}
             onChange={(e) => setReviewText(e.target.value)}
             className="w-full min-h-[60px] bg-transparent text-sm text-white resize-none outline-none placeholder:text-white/40"
           />
           <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-2">
              <span className="text-[10px] text-white/40">{reviewText.length}/1000</span>
              <button 
                onClick={handleSubmit}
                disabled={submitting || !selectedLabel}
                className="bg-white text-black px-6 py-1.5 rounded-full text-xs font-bold hover:bg-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '...' : 'Post'}
              </button>
           </div>
         </div>
      </div>

      {/* REVIEWS LIST */}
      {stats && stats.reviews.length > 0 && (
         <div className="flex flex-col gap-6">
            {stats.reviews.map((review) => {
               const meta = getLabelMeta(review.label);
               const initials = review.author_name.slice(0, 2).toUpperCase();
               const isHoveredChart = hoveredSegment === review.label;
               const isExpanded = expandedComments.has(review.id);

               return (
                 <div
                   key={review.id}
                   className="flex flex-col gap-3 pb-6 border-b border-white/10 last:border-0 transition-opacity"
                   style={{ opacity: hoveredSegment && !isHoveredChart ? 0.3 : 1 }}
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center shrink-0"
                            style={{ borderColor: meta.color, background: `${meta.color}20`, color: meta.color, fontSize: 13, fontWeight: 'bold' }}
                          >
                             {initials}
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="font-bold text-[14px]">{review.author_name}</div>
                             <div className="w-[14px] h-[14px] bg-blue-500 rounded-full flex items-center justify-center text-[10px]">✓</div>
                          </div>
                       </div>
                       
                       {/* Rating Badge */}
                       <div 
                         className="px-3 py-1 rounded-full text-[11px] font-bold flex items-center justify-center"
                         style={{ background: meta.color, color: '#000' }}
                       >
                         {meta.label}
                       </div>
                    </div>

                    <div className="text-[14px] text-white/80 leading-relaxed pl-[52px]">
                      {review.review_text ? (
                        <>
                          <span className="line-clamp-3">{review.review_text}</span>
                          {review.review_text.length > 150 && (
                            <span className="text-white/40 text-xs ml-1 cursor-pointer">... more</span>
                          )}
                        </>
                      ) : (
                        <span className="text-white/40 italic">No written review provided.</span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 mt-1 pl-[52px]">
                       <button 
                         onClick={() => handleToggleLike(review.id)}
                         className={`flex items-center gap-2 transition-colors ${review.user_liked ? 'text-red-500' : 'text-white/40 hover:text-white'}`}
                       >
                          <Heart size={16} fill={review.user_liked ? 'currentColor' : 'none'} />
                          <span className="text-xs font-bold">{review.likes_count}</span>
                       </button>
                       <button 
                         onClick={() => toggleComments(review.id)}
                         className={`flex items-center gap-2 transition-colors ${isExpanded ? 'text-white' : 'text-white/40 hover:text-white'}`}
                       >
                          <MessageCircle size={16} fill={isExpanded ? 'currentColor' : 'none'} fillOpacity={isExpanded ? 0.2 : 0} />
                          <span className="text-xs font-bold">{review.comments_count}</span>
                       </button>
                       <button className="ml-auto text-white/40 hover:text-white transition-colors">
                          <MoreHorizontal size={18} />
                       </button>
                    </div>

                    {/* Comments Section */}
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pl-[52px] flex flex-col gap-4 overflow-hidden"
                      >
                         <div className="flex flex-col gap-2">
                           {review.comments.map(comment => (
                             <CommentNode 
                               key={comment.id}
                               comment={comment}
                               currentUser={user}
                               onReply={(cId, cName) => {
                                 setReplyingTo(prev => ({...prev, [review.id]: cId}));
                                 setCommentTexts(prev => ({...prev, [review.id]: `@${cName} `}));
                               }}
                               onLike={(cId) => handleToggleCommentLike(review.id, cId)}
                               onDelete={(cId) => handleDeleteComment(review.id, cId)}
                             />
                           ))}
                         </div>
                         
                         {/* Comment Input */}
                         <div className="flex gap-3 items-end mt-2">
                            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0 mb-1 border border-white/10">
                              {user ? ((user.username || user.name || 'Guest').slice(0,2).toUpperCase()) : '❓'}
                            </div>
                            <div className="relative flex-1 group">
                              <textarea
                                value={commentTexts[review.id] || ''}
                                onChange={(e) => {
                                  setCommentTexts(prev => ({...prev, [review.id]: e.target.value}));
                                  if (e.target.value === '') setReplyingTo(prev => ({...prev, [review.id]: null}));
                                }}
                                placeholder={replyingTo[review.id] ? "Write a reply..." : "Add a comment..."}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white resize-none outline-none focus:border-white/30 transition-colors min-h-[40px] max-h-[100px]"
                                rows={1}
                              />
                              <button 
                                onClick={() => handlePostComment(review.id)}
                                disabled={!commentTexts[review.id]?.trim() || postingComment === review.id}
                                className="absolute right-2 bottom-2 text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold px-3 py-1 bg-blue-500/10 rounded-lg group-focus-within:bg-blue-500/20 transition-colors"
                              >
                                {postingComment === review.id ? '...' : 'Post'}
                              </button>
                            </div>
                         </div>
                      </motion.div>
                    )}
                 </div>
               );
             })}
         </div>
      )}

      {/* Toast Overlay */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed', bottom: '40px', right: '40px', zIndex: 1000,
              background: 'white', color: 'black', padding: '16px 24px', borderRadius: '16px',
              fontWeight: 700, fontSize: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
