'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Send, ChevronUp, ChevronDown, CornerDownRight, Minus, Plus } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Avatar from '@/components/Avatar';

interface CommentAuthor {
  id: number;
  name: string;
  username: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: number;
  content: string;
  contains_spoiler: boolean;
  media_url: string | null;
  created_at: string;
  parent_id: number | null;
  upvotes: number;
  downvotes: number;
  user_vote: 'up' | 'down' | null;
  author: CommentAuthor;
}

interface CommentThreadProps {
  postId: number;
  onCommentAdded?: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommentThread({ postId, onCommentAdded }: CommentThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  const load = async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const res = await api.get<Comment[]>(`/posts/${postId}/comments?limit=50`);
      setComments(res.data);
      setLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount of this (already-expanded) subtree.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flat list -> tree, built client-side so replies-to-replies (arbitrary
  // depth, Reddit-style) don't need N lazy round trips.
  const childrenMap = useMemo(() => {
    const map = new Map<number, Comment[]>();
    for (const c of comments) {
      if (c.parent_id != null) {
        if (!map.has(c.parent_id)) map.set(c.parent_id, []);
        map.get(c.parent_id)!.push(c);
      }
    }
    return map;
  }, [comments]);

  const roots = useMemo(() => comments.filter((c) => c.parent_id == null), [comments]);

  const handleSubmit = async () => {
    const content = text.trim();
    if (!content || posting || !user) return;

    setPosting(true);
    try {
      const res = await api.post<Comment>(`/posts/${postId}/comment`, { content });
      setComments((prev) => [...prev, res.data]);
      setText('');
      onCommentAdded?.();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (parentId: number, replyText: string) => {
    const res = await api.post<Comment>(`/posts/${postId}/comment`, {
      content: replyText,
      parent_id: parentId,
    });
    setComments((prev) => [...prev, res.data]);
    onCommentAdded?.();
    setCollapsedIds((prev) => {
      if (!prev.has(parentId)) return prev;
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
  };

  const handleVote = async (commentId: number, vote: 'up' | 'down') => {
    if (!user) return;

    setComments((prev) => prev.map((c) => {
      if (c.id !== commentId) return c;
      const upvoted = c.user_vote === 'up';
      const downvoted = c.user_vote === 'down';
      let newUp = c.upvotes;
      let newDown = c.downvotes;
      let newVote: 'up' | 'down' | null = null;

      if (vote === 'up') {
        if (upvoted) { newUp--; newVote = null; }
        else { newUp++; if (downvoted) newDown--; newVote = 'up'; }
      } else {
        if (downvoted) { newDown--; newVote = null; }
        else { newDown++; if (upvoted) newUp--; newVote = 'down'; }
      }

      return { ...c, upvotes: newUp, downvotes: newDown, user_vote: newVote };
    }));

    try {
      await api.post(`/posts/comments/${commentId}/vote`, { vote });
    } catch {
      load();
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
    <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-3">
      {loading ? (
        <div className="flex items-center gap-2 text-white/40 text-xs font-semibold py-2">
          <Loader2 size={13} className="animate-spin" /> Loading comments...
        </div>
      ) : roots.length === 0 ? (
        <div className="text-white/30 text-xs font-semibold py-1">No comments yet. Be the first to say something.</div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
          {roots.map((c) => (
            <CommentNode
              key={c.id}
              comment={c}
              depth={0}
              childrenMap={childrenMap}
              collapsedIds={collapsedIds}
              onToggleCollapse={toggleCollapse}
              onVote={handleVote}
              onReply={handleReply}
              canInteract={!!user}
            />
          ))}
        </div>
      )}

      {user && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
            <Avatar
              src={user.avatar_url}
              seed={user.id || user.username || user.name}
              name={user.name}
              size={32}
              className="object-cover w-full h-full"
              decorative
            />
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Write a comment..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full py-2 px-4 text-[13px] text-white focus:outline-none focus:border-primary/50"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={posting || !text.trim()}
            className="w-8 h-8 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center text-white shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}

interface CommentNodeProps {
  comment: Comment;
  depth: number;
  childrenMap: Map<number, Comment[]>;
  collapsedIds: Set<number>;
  onToggleCollapse: (id: number) => void;
  onVote: (id: number, vote: 'up' | 'down') => void;
  onReply: (parentId: number, text: string) => Promise<void>;
  canInteract: boolean;
}

function CommentNode({
  comment,
  depth,
  childrenMap,
  collapsedIds,
  onToggleCollapse,
  onVote,
  onReply,
  canInteract,
}: CommentNodeProps) {
  const kids = childrenMap.get(comment.id) ?? [];
  const isCollapsed = collapsedIds.has(comment.id);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyText.trim() || posting) return;
    setPosting(true);
    try {
      await onReply(comment.id, replyText.trim());
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
      style={depth > 0 ? {
        marginLeft: 18,
        paddingLeft: 12,
        borderLeft: '2px solid rgba(255,255,255,0.07)',
      } : undefined}
    >
      <div className="flex items-start gap-2.5">
        <Link href={`/user/${comment.author.id}`} className="shrink-0">
          <div className="rounded-full overflow-hidden bg-white/10" style={{ width: depth === 0 ? 32 : 24, height: depth === 0 ? 32 : 24 }}>
            <Avatar
              src={comment.author.avatar_url}
              seed={comment.author.id || comment.author.username || comment.author.name}
              name={comment.author.name}
              size={depth === 0 ? 32 : 24}
              className="object-cover w-full h-full"
              decorative
            />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Link href={`/user/${comment.author.id}`} className="text-xs font-bold text-white hover:text-primary transition-colors">
                {comment.author.name}
              </Link>
              <span className="text-[10px] text-white/30">{timeAgo(comment.created_at)}</span>
            </div>
            <div className="text-[13px] text-white/80 whitespace-pre-wrap break-words">{comment.content}</div>
          </div>

          {/* Reddit-style action row */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {kids.length > 0 && (
              <button
                onClick={() => onToggleCollapse(comment.id)}
                title={isCollapsed ? 'Expand thread' : 'Collapse thread'}
                className="w-5 h-5 rounded-md border border-white/10 text-white/40 hover:text-white flex items-center justify-center transition-colors"
              >
                {isCollapsed ? <Plus size={11} /> : <Minus size={11} />}
              </button>
            )}

            <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-full overflow-hidden">
              <button
                onClick={() => onVote(comment.id, 'up')}
                className="px-1.5 py-1 transition-colors"
                style={{ color: comment.user_vote === 'up' ? '#ff4500' : 'rgba(255,255,255,0.45)' }}
              >
                <ChevronUp size={14} strokeWidth={2.5} />
              </button>
              <span className="text-[11px] font-extrabold text-white min-w-[16px] text-center">
                {comment.upvotes - comment.downvotes}
              </span>
              <button
                onClick={() => onVote(comment.id, 'down')}
                className="px-1.5 py-1 transition-colors"
                style={{ color: comment.user_vote === 'down' ? '#00bfff' : 'rgba(255,255,255,0.45)' }}
              >
                <ChevronDown size={14} strokeWidth={2.5} />
              </button>
            </div>

            {canInteract && (
              <button
                onClick={() => setReplyOpen((v) => !v)}
                className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-1 transition-colors ${replyOpen ? 'text-white' : 'text-white/45 hover:text-white'}`}
              >
                <CornerDownRight size={12} /> Reply
              </button>
            )}

            {kids.length > 0 && (
              <span className="text-[10.5px] text-white/30 font-semibold">
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
                <div className="flex items-center gap-2 mt-2">
                  <input
                    autoFocus
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReplySubmit();
                      }
                    }}
                    placeholder={`Reply to ${comment.author.name}...`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full py-1.5 px-3 text-[12px] text-white focus:outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={handleReplySubmit}
                    disabled={!replyText.trim() || posting}
                    className="w-7 h-7 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center text-white shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!isCollapsed && kids.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-2.5">
          {kids.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              childrenMap={childrenMap}
              collapsedIds={collapsedIds}
              onToggleCollapse={onToggleCollapse}
              onVote={onVote}
              onReply={onReply}
              canInteract={canInteract}
            />
          ))}
        </div>
      )}
    </div>
  );
}
