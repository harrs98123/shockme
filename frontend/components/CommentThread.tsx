'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Send } from 'lucide-react';
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
  author: CommentAuthor;
}

interface CommentThreadProps {
  postId: number;
  onCommentAdded?: () => void;
}

export default function CommentThread({ postId, onCommentAdded }: CommentThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

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

  return (
    <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-3">
      {loading ? (
        <div className="flex items-center gap-2 text-white/40 text-xs font-semibold py-2">
          <Loader2 size={13} className="animate-spin" /> Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-white/30 text-xs font-semibold py-1">No comments yet. Be the first to say something.</div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Link href={`/user/${c.author.id}`} className="shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                  <Avatar
                    src={c.author.avatar_url}
                    seed={c.author.id || c.author.username || c.author.name}
                    name={c.author.name}
                    size={32}
                    className="object-cover w-full h-full"
                    decorative
                  />
                </div>
              </Link>
              <div className="flex-1 min-w-0 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Link href={`/user/${c.author.id}`} className="text-xs font-bold text-white hover:text-primary transition-colors">
                    {c.author.name}
                  </Link>
                  <span className="text-[10px] text-white/30">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="text-[13px] text-white/80 whitespace-pre-wrap break-words">{c.content}</div>
              </div>
            </div>
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
