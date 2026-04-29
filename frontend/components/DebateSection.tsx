'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Debate } from '@/lib/types';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, User, Flame, Snowflake, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  movieId: number;
  mediaType?: 'movie' | 'tv';
}

export default function DebateSection({ movieId, mediaType = 'movie' }: Props) {
  const { user } = useAuth();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [stance, setStance] = useState<'agree' | 'disagree' | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDebates();
  }, [movieId, user, mediaType]);

  const fetchDebates = async () => {
    try {
      const res = await api.get(`/debates?movie_id=${movieId}&media_type=${mediaType}`);
      setDebates(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = '/login'; return; }
    if (!stance || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post('/debates', {
        movie_id: movieId,
        media_type: mediaType,
        stance,
        content
      });
      setDebates([res.data, ...debates]);
      setContent('');
      setStance(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const voteDebate = async (debateId: number, vote: 'up' | 'down') => {
    if (!user) { window.location.href = '/login'; return; }

    setDebates((prev) => prev.map((d) => {
      if (d.id === debateId) {
        const upvoted = d.user_vote === 'up';
        const downvoted = d.user_vote === 'down';
        
        let newUp = d.upvotes;
        let newDown = d.downvotes;
        let newVote: 'up' | 'down' | null = null;

        if (vote === 'up') {
          if (upvoted) { newUp--; newVote = null; }
          else { newUp++; if (downvoted) newDown--; newVote = 'up'; }
        } else {
          if (downvoted) { newDown--; newVote = null; }
          else { newDown++; if (upvoted) newUp--; newVote = 'down'; }
        }

        return { ...d, upvotes: newUp, downvotes: newDown, user_vote: newVote };
      }
      return d;
    }));

    try {
      await api.post(`/debates/${debateId}/vote`, { vote });
    } catch (e) {
      fetchDebates();
    }
  };

  return (
    <section style={{ padding: '60px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <div style={{ width: '4px', height: '24px', borderRadius: '4px', background: '#ef4444' }} />
        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, fontFamily: 'Poppins' }}>Battle Grounds</h2>
      </div>

      <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
        {/* Left: Input Form */}
        <div style={{ flex: '1 1 350px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '32px', 
            padding: '32px',
            position: 'sticky',
            top: '100px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', fontFamily: 'Poppins' }}>Join the Debate</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '24px' }}>
              Is this a masterpiece or overrated? Pick a side.
            </p>

            {user ? (
              <form onSubmit={submitDebate}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setStance('agree')}
                    style={{
                      flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid',
                      borderColor: stance === 'agree' ? '#10b981' : 'rgba(255,255,255,0.05)',
                      background: stance === 'agree' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                      color: stance === 'agree' ? '#10b981' : 'rgba(255,255,255,0.5)',
                      fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '13px'
                    }}
                  >
                    <CheckCircle2 size={20} /> AGREE
                  </button>
                  <button
                    type="button"
                    onClick={() => setStance('disagree')}
                    style={{
                      flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid',
                      borderColor: stance === 'disagree' ? '#ef4444' : 'rgba(255,255,255,0.05)',
                      background: stance === 'disagree' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.02)',
                      color: stance === 'disagree' ? '#ef4444' : 'rgba(255,255,255,0.5)',
                      fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '13px'
                    }}
                  >
                    <XCircle size={20} /> DISAGREE
                  </button>
                </div>
                
                <textarea
                  placeholder={stance ? `Explain why you ${stance}...` : "Select a stance to start..."}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={!stance || submitting}
                  style={{ 
                    width: '100%', minHeight: '120px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px', padding: '20px', color: 'white', fontSize: '15px', marginBottom: '16px',
                    outline: 'none', resize: 'none'
                  }}
                />
                
                <button
                  type="submit"
                  disabled={!stance || !content.trim() || submitting}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: '16px', background: 'white', color: 'black',
                    fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                  }}
                >
                  <Send size={18} /> {submitting ? 'POSTING...' : 'START DEBATE'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>Log in to participate in battles</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Arguments List */}
        <div style={{ flex: '1.5 1 450px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               {[1, 2, 3].map(i => <div key={i} style={{ height: '140px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }} className="skeleton" />)}
            </div>
          ) : debates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.2)' }}>
               <MessageSquare size={48} style={{ marginBottom: '16px' }} />
               <p style={{ fontSize: '16px', fontWeight: 600 }}>The arena is empty. Be the first to strike.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {debates.map((debate) => (
                <motion.div 
                  key={debate.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '24px', 
                    padding: '24px', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: `6px solid ${debate.stance === 'agree' ? '#10b981' : '#ef4444'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {debate.author_name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>{debate.author_name}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{new Date(debate.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ 
                      padding: '4px 12px', borderRadius: '99px', fontWeight: 800, fontSize: '10px', letterSpacing: '0.5px',
                      background: debate.stance === 'agree' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: debate.stance === 'agree' ? '#10b981' : '#ef4444',
                      border: `1px solid ${debate.stance === 'agree' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                    }}>
                      {debate.stance.toUpperCase()}
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: '20px', margin: '0 0 20px 0' }}>
                    {debate.content}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <button 
                      onClick={() => voteDebate(debate.id, 'up')}
                      style={{ 
                        background: debate.user_vote === 'up' ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: '1px solid', borderColor: debate.user_vote === 'up' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        color: debate.user_vote === 'up' ? '#ff4500' : 'rgba(255,255,255,0.6)', 
                        fontSize: '13px', fontWeight: 700, transition: 'all 0.2s'
                      }}
                    >
                      <Flame size={16} fill={debate.user_vote === 'up' ? 'currentColor' : 'none'} /> {debate.upvotes}
                    </button>
                    <button 
                      onClick={() => voteDebate(debate.id, 'down')}
                      style={{ 
                        background: debate.user_vote === 'down' ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: '1px solid', borderColor: debate.user_vote === 'down' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        color: debate.user_vote === 'down' ? '#00bfff' : 'rgba(255,255,255,0.6)', 
                        fontSize: '13px', fontWeight: 700, transition: 'all 0.2s'
                      }}
                    >
                      <Snowflake size={16} /> {debate.downvotes}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
