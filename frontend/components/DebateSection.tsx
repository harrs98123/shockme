'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Avatar from '@/components/Avatar';
import { Debate } from '@/lib/types';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  CornerDownRight,
  Minus,
  Plus,
} from 'lucide-react';

interface Props {
  movieId: number;
  mediaType?: 'movie' | 'tv';
}

const INDENT_PX = 22;

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}

export default function DebateSection({ movieId, mediaType = 'movie' }: Props) {
  const { user } = useAuth();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<'top' | 'new'>('top');

  const [stance, setStance] = useState<'agree' | 'disagree' | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchDebates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, mediaType]);

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

  // One flat fetch; the tree is built client-side so replies-to-replies
  // (arbitrary depth, Reddit-style) don't need N lazy round trips.
  const childrenMap = useMemo(() => {
    const map = new Map<number, Debate[]>();
    for (const d of debates) {
      if (d.parent_id != null) {
        if (!map.has(d.parent_id)) map.set(d.parent_id, []);
        map.get(d.parent_id)!.push(d);
      }
    }
    return map;
  }, [debates]);

  const roots = useMemo(() => {
    const list = debates.filter((d) => d.parent_id == null);
    if (sortMode === 'top') {
      return [...list].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    }
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [debates, sortMode]);

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
        content: content.trim(),
      });
      setDebates((prev) => [...prev, res.data]);
      setContent('');
      setStance(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentId: number, text: string) => {
    if (!user) { window.location.href = '/login'; return; }
    const res = await api.post('/debates', {
      movie_id: movieId,
      media_type: mediaType,
      content: text,
      parent_id: parentId,
    });
    setDebates((prev) => [...prev, res.data]);
    // Make sure the new reply's thread is visible.
    setCollapsedIds((prev) => {
      if (!prev.has(parentId)) return prev;
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
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
    } catch {
      fetchDebates();
    }
  };

  const toggleCollapse = (id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section style={{ padding: '60px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '24px', borderRadius: '4px', background: '#ef4444' }} />
          <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, fontFamily: 'Poppins' }}>Battle Grounds</h2>
        </div>

        {roots.length > 1 && (
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '99px', padding: '4px' }}>
            {(['top', 'new'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                style={{
                  padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase',
                  background: sortMode === mode ? 'white' : 'transparent',
                  color: sortMode === mode ? 'black' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.15s',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
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

        {/* Right: Threaded Arguments */}
        <div style={{ flex: '1.5 1 450px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: '140px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }} className="skeleton" />)}
            </div>
          ) : roots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.2)' }}>
              <MessageSquare size={48} style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '16px', fontWeight: 600 }}>The arena is empty. Be the first to strike.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {roots.map((debate) => (
                <DebateThread
                  key={debate.id}
                  debate={debate}
                  depth={0}
                  childrenMap={childrenMap}
                  currentUserId={user?.id ?? null}
                  collapsedIds={collapsedIds}
                  onToggleCollapse={toggleCollapse}
                  onVote={voteDebate}
                  onReply={submitReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface DebateThreadProps {
  debate: Debate;
  depth: number;
  childrenMap: Map<number, Debate[]>;
  currentUserId: number | null;
  collapsedIds: Set<number>;
  onToggleCollapse: (id: number) => void;
  onVote: (id: number, vote: 'up' | 'down') => void;
  onReply: (parentId: number, text: string) => Promise<void>;
}

function DebateThread({
  debate,
  depth,
  childrenMap,
  currentUserId,
  collapsedIds,
  onToggleCollapse,
  onVote,
  onReply,
}: DebateThreadProps) {
  const kids = childrenMap.get(debate.id) ?? [];
  const isCollapsed = collapsedIds.has(debate.id);
  const isReply = debate.stance === 'neutral';
  const isAgree = debate.stance === 'agree';

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyText.trim() || posting) return;
    setPosting(true);
    try {
      await onReply(debate.id, replyText.trim());
      setReplyText('');
      setReplyOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div
      style={{
        marginLeft: depth > 0 ? INDENT_PX : 0,
        paddingLeft: depth > 0 ? 16 : 0,
        borderLeft: depth > 0 ? '2px solid rgba(255,255,255,0.07)' : 'none',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: depth === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.015)',
          borderRadius: '20px',
          padding: depth === 0 ? '24px' : '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          borderLeft: depth === 0 ? `6px solid ${isAgree ? '#10b981' : '#ef4444'}` : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <Link href={`/user/${debate.user_id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} className="group">
            <div style={{ width: depth === 0 ? 36 : 28, height: depth === 0 ? 36 : 28, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} className="group-hover:border-primary/50 transition-colors">
              <Avatar
                src={debate.author_avatar}
                seed={debate.user_id || debate.author_username || debate.author_name}
                name={debate.author_name}
                size={depth === 0 ? 36 : 28}
                className="object-cover w-full h-full"
                decorative
              />
            </div>
            <div>
              <div style={{ fontSize: depth === 0 ? '14px' : '12.5px', fontWeight: 700, color: 'white' }} className="group-hover:text-primary group-hover:underline">{debate.author_name}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{timeAgo(debate.created_at)}</div>
            </div>
          </Link>
          {!isReply && (
            <div style={{
              padding: '4px 12px', borderRadius: '99px', fontWeight: 800, fontSize: '10px', letterSpacing: '0.5px',
              background: isAgree ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: isAgree ? '#10b981' : '#ef4444',
              border: `1px solid ${isAgree ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
            }}>
              {debate.stance.toUpperCase()}
            </div>
          )}
        </div>

        <p style={{ fontSize: depth === 0 ? '15px' : '13.5px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
          {debate.content}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {kids.length > 0 && (
            <button
              onClick={() => onToggleCollapse(debate.id)}
              title={isCollapsed ? 'Expand thread' : 'Collapse thread'}
              style={{
                width: 26, height: 26, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isCollapsed ? <Plus size={13} /> : <Minus size={13} />}
            </button>
          )}

          {/* Reddit-style vote pill: chevron / net score / chevron */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
            <button
              onClick={() => onVote(debate.id, 'up')}
              style={{ padding: '6px 8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: debate.user_vote === 'up' ? '#ff4500' : 'rgba(255,255,255,0.5)' }}
            >
              <ChevronUp size={16} strokeWidth={2.5} />
            </button>
            <span style={{ fontSize: '12.5px', fontWeight: 800, minWidth: '18px', textAlign: 'center', color: 'white' }}>
              {debate.upvotes - debate.downvotes}
            </span>
            <button
              onClick={() => onVote(debate.id, 'down')}
              style={{ padding: '6px 8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: debate.user_vote === 'down' ? '#00bfff' : 'rgba(255,255,255,0.5)' }}
            >
              <ChevronDown size={16} strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={() => setReplyOpen((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: replyOpen ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '12.5px', fontWeight: 700, padding: '6px 10px',
            }}
          >
            <CornerDownRight size={14} /> Reply
          </button>

          {kids.length > 0 && (
            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginLeft: '2px' }}>
              {kids.length} {kids.length === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>

        <AnimatePresence>
          {replyOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${debate.author_name}...`}
                  style={{
                    flex: 1, minHeight: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px', padding: '12px 14px', color: 'white', fontSize: '13px', outline: 'none', resize: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => { setReplyOpen(false); setReplyText(''); }}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '8px 12px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || posting}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', background: 'white', color: 'black',
                    border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                    padding: '8px 16px', opacity: !replyText.trim() || posting ? 0.5 : 1,
                  }}
                >
                  <Send size={13} /> {posting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {!isCollapsed && kids.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {kids.map((child) => (
            <DebateThread
              key={child.id}
              debate={child}
              depth={depth + 1}
              childrenMap={childrenMap}
              currentUserId={currentUserId}
              collapsedIds={collapsedIds}
              onToggleCollapse={onToggleCollapse}
              onVote={onVote}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
