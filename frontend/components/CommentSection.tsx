'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Comment } from '@/lib/types';
import Link from 'next/link';

interface Props {
  movieId: number;
  mediaType?: 'movie' | 'tv';
}

export default function CommentSection({ movieId, mediaType = 'movie' }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchComments();
  }, [movieId, user, mediaType]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments?movie_id=${movieId}&media_type=${mediaType}&limit=50`);
      setComments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = '/login'; return; }
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post('/comments', { 
        movie_id: movieId, 
        media_type: mediaType, 
        content: text,
        contains_spoiler: isSpoiler
      });
      setComments([res.data, ...comments]);
      setText('');
      setIsSpoiler(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (commentId: number, isLike: boolean) => {
    if (!user) { window.location.href = '/login'; return; }
    
    setComments((prev) => prev.map((c) => {
      if (c.id === commentId) {
        const liked = c.like_info.user_vote === true;
        const disliked = c.like_info.user_vote === false;
        
        let newLikes = c.like_info.likes;
        let newDislikes = c.like_info.dislikes;
        let newVote: boolean | null = null;

        if (isLike) {
          if (liked) { newLikes--; newVote = null; }
          else { newLikes++; if (disliked) newDislikes--; newVote = true; }
        } else {
          if (disliked) { newDislikes--; newVote = null; }
          else { newDislikes++; if (liked) newLikes--; newVote = false; }
        }

        return { ...c, like_info: { likes: newLikes, dislikes: newDislikes, user_vote: newVote } };
      }
      return c;
    }));

    try {
      await api.post(`/comments/${commentId}/like?is_like=${isLike}`);
    } catch (e) {
      fetchComments();
    }
  };

  const toggleSpoilerReveal = (commentId: number) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 32, border: '1px solid var(--border)' }}>
      <h2 style={{ fontSize: 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        💬 Reviews 
        <span style={{ fontSize: 13, background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 99, color: 'var(--text-muted)', fontWeight: 600 }}>
          {comments.length}
        </span>
      </h2>

      {user ? (
        <form onSubmit={submitComment} style={{ marginBottom: 32, position: 'relative' }}>
          <textarea
            className="input-field"
            placeholder="What did you think of the movie?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ minHeight: 120, resize: 'vertical', background: 'var(--bg)' }}
            disabled={submitting}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            {/* Spoiler Toggle */}
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              padding: '8px 16px', borderRadius: 10, 
              background: isSpoiler ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isSpoiler ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                border: `2px solid ${isSpoiler ? '#ef4444' : 'var(--text-dim)'}`,
                background: isSpoiler ? '#ef4444' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}>
                {isSpoiler && <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              <input 
                type="checkbox" 
                checked={isSpoiler} 
                onChange={(e) => setIsSpoiler(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span style={{ 
                fontSize: 13, fontWeight: 600,
                color: isSpoiler ? '#ef4444' : 'var(--text-muted)'
              }}>
                🛡️ Contains Spoilers
              </span>
            </label>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !text.trim()}
              style={{ padding: '8px 20px', fontSize: 13 }}
            >
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ background: 'var(--bg)', padding: 24, borderRadius: 12, textAlign: 'center', marginBottom: 32, border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Log in to write a review</p>
          <Link href="/login" className="btn-primary" style={{ padding: '8px 24px', fontSize: 14 }}>
            Sign In
          </Link>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 100 }} />
          <div className="skeleton" style={{ height: 80 }} />
        </div>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', padding: '20px 0' }}>
          No reviews yet. Be the first!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {comments.map((comment) => {
            const isSpoilerComment = comment.contains_spoiler;
            const isRevealed = revealedSpoilers.has(comment.id);

            return (
              <div key={comment.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', 
                      background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 12, color: 'white'
                    }}>
                      {comment.author_name[0].toUpperCase()}
                    </div>
                    <strong style={{ fontSize: 15 }}>{comment.author_name}</strong>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    {isSpoilerComment && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        letterSpacing: '0.5px'
                      }}>
                        🛡️ Spoiler
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Spoiler-gated content */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <p style={{ 
                    fontSize: 15, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    filter: isSpoilerComment && !isRevealed ? 'blur(8px)' : 'none',
                    userSelect: isSpoilerComment && !isRevealed ? 'none' : 'auto',
                    transition: 'filter 0.4s ease'
                  }}>
                    {comment.content}
                  </p>
                  
                  {isSpoilerComment && !isRevealed && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 8
                    }}>
                      <button
                        onClick={() => toggleSpoilerReveal(comment.id)}
                        style={{
                          padding: '10px 24px', borderRadius: 10,
                          background: 'rgba(239, 68, 68, 0.2)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#ef4444', fontWeight: 700, fontSize: 13,
                          cursor: 'pointer', transition: 'all 0.2s ease',
                          display: 'flex', alignItems: 'center', gap: 8
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        🛡️ Reveal Spoiler
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <button 
                    onClick={() => toggleLike(comment.id, true)}
                    style={{ 
                      background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      color: comment.like_info.user_vote === true ? '#3b82f6' : 'var(--text-muted)',
                      fontSize: 13, fontWeight: 500, transition: 'color 0.2s'
                    }}
                  >
                    <span style={{ fontSize: 16 }}>👍</span> {comment.like_info.likes}
                  </button>
                  <button 
                    onClick={() => toggleLike(comment.id, false)}
                    style={{ 
                      background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      color: comment.like_info.user_vote === false ? '#ef4444' : 'var(--text-muted)',
                      fontSize: 13, fontWeight: 500, transition: 'color 0.2s'
                    }}
                  >
                    <span style={{ fontSize: 16 }}>👎</span> {comment.like_info.dislikes}
                  </button>
                  
                  {isSpoilerComment && isRevealed && (
                    <button
                      onClick={() => toggleSpoilerReveal(comment.id)}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--text-dim)', fontSize: 12, fontWeight: 500,
                        marginLeft: 'auto'
                      }}
                    >
                      Hide spoiler
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
