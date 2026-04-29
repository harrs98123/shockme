'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Clock,
  ArrowLeft,
  MoreVertical,
  CornerDownRight,
  Loader2,
  AlertCircle,
  Settings,
  Edit,
  UserX,
  PlusCircle,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Group, GroupPost, GroupComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  // Admin States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', image_url: '' });
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

  // Post/Comment submission states
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [submittingCommentFor, setSubmittingCommentFor] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState<{ [key: number]: string }>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const groupRes = await api.get(`/groups/${id}`);
      setGroup(groupRes.data);
      setEditFormData({
        name: groupRes.data.name,
        description: groupRes.data.description || '',
        image_url: groupRes.data.image_url || ''
      });
      setLoading(false);

      setPostsLoading(true);
      const postsRes = await api.get(`/groups/${id}/posts`);
      setPosts(postsRes.data);
      setPostsLoading(false);
    } catch (err) {
      console.error('Failed to fetch group data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleJoin = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      await api.post(`/groups/${id}/join`);
      setGroup(prev => prev ? { ...prev, is_member: true, member_count: prev.member_count + 1 } : null);
    } catch (err) {
      console.error('Failed to join group', err);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingGroup(true);
    try {
      const res = await api.patch(`/groups/${id}`, editFormData);
      setGroup(res.data);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update group', err);
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const fetchMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await api.get(`/groups/${id}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error('Failed to fetch members', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/groups/${id}/members/${userId}`);
      setMembers(members.filter(m => m.user_id !== userId));
      setGroup(prev => prev ? { ...prev, member_count: prev.member_count - 1 } : null);
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsSubmittingPost(true);
    try {
      const res = await api.post(`/groups/${id}/posts`, { content: newPostContent });
      setPosts([res.data, ...posts]);
      setNewPostContent('');
    } catch (err) {
      console.error('Failed to post', err);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleSubmitComment = async (postId: number) => {
    const content = commentContent[postId];
    if (!content?.trim()) return;

    setSubmittingCommentFor(postId);
    try {
      const res = await api.post(`/groups/posts/${postId}/comments`, { content });
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, comments: [...(p.comments || []), res.data] } : p
      ));
      setCommentContent({ ...commentContent, [postId]: '' });
    } catch (err) {
      console.error('Failed to comment', err);
    } finally {
      setSubmittingCommentFor(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-gray-500 font-medium">Entering group...</p>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-screen pb-24">
      {/* Group Header Banner */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        {group.image_url ? (
          <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-2 via-surface to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

        <div className="container relative h-full flex flex-col justify-end pb-12">
          <div className="absolute top-8 right-6 md:right-24 flex gap-3">
            {(group.is_creator || group.creator_id == user?.id) && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="btn-primary !bg-white !text-black !px-6 shadow-xl"
                >
                  <Edit size={18} /> Edit Info
                </button>
                <button
                  onClick={() => { setIsMembersModalOpen(true); fetchMembers(); }}
                  className="btn-primary !bg-white/10 !text-white !border-white/20 !px-6 backdrop-blur-md"
                >
                  <UserX size={18} /> Remove People
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="absolute top-8 left-6 md:left-24 btn-ghost !p-2 rounded-full glass"
          >
            <ArrowLeft size={20} />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-20 w-20 rounded-2xl glass flex items-center justify-center border-white/10 shadow-2xl relative">
                <Users className="text-primary" size={36} />
                {(group.is_creator || group.creator_id === user?.id) && (
                  <div className="absolute -top-2 -right-2 bg-primary p-1.5 rounded-lg shadow-lg" title="You are the Owner">
                    <ShieldCheck size={14} className="text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black mb-1">{group.name}</h1>
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <span className="flex items-center gap-1.5"><Users size={14} /> {group.member_count} Members</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} /> Created {formatDistanceToNow(new Date(group.created_at))} ago</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                {group.description || 'Welcome to the group! Start a conversation about your favorite films.'}
              </p>

              <div className="flex flex-wrap gap-3">
                {!group.is_member ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleJoin}
                    className="btn-primary w-full md:w-auto h-14 !px-12 text-lg shadow-glow"
                  >
                    Join to Participate
                  </motion.button>
                ) : (
                  <div className="px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 font-bold flex items-center gap-2 h-14">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Member
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-8">
            {/* Create Post Card */}
            {group.is_member && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
                    <UserIcon size={20} className="text-primary" />
                  </div>
                  <form onSubmit={handleSubmitPost} className="flex-1">
                    <textarea
                      placeholder={`What's on your mind, ${user?.name}?`}
                      className="w-full bg-transparent border-none outline-none text-lg resize-none min-h-[100px] placeholder:text-gray-600"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <button type="button" className="text-gray-500 hover:text-gray-300 transition-colors text-sm font-medium">
                        Add Image or Link
                      </button>
                      <button
                        disabled={isSubmittingPost}
                        className="btn-primary !py-2 !px-6 h-10 text-sm"
                      >
                        {isSubmittingPost ? <Loader2 className="animate-spin" size={18} /> : (
                          <>Post <Send size={14} /></>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Posts List */}
            <div className="space-y-6">
              {postsLoading ? (
                [1, 2, 3].map(i => <div key={i} className="skeleton h-48 w-full" />)
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostItem
                    key={post.id}
                    post={post}
                    isMember={group.is_member}
                    onComment={(content: string) => handleSubmitComment(post.id)}
                    submittingComment={submittingCommentFor === post.id}
                    commentValue={commentContent[post.id] || ''}
                    onCommentChange={(val: string) => setCommentContent({ ...commentContent, [post.id]: val })}
                    onSubmitComment={() => handleSubmitComment(post.id)}
                  />
                ))
              ) : (
                <div className="text-center py-20 glass rounded-3xl">
                  <MessageSquare size={48} className="text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-1">Silence is golden...</h3>
                  <p className="text-gray-500">But sharing is better. Be the first to post!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {(group.is_creator || group.creator_id == user?.id) && (
              <div className="card p-6 bg-primary/5 border-primary/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Settings size={20} className="text-primary" /> Owner Dashboard
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-sm"
                  >
                    <Edit size={16} className="text-gray-400" /> Edit Group Info
                  </button>
                  <button
                    onClick={() => { setIsMembersModalOpen(true); fetchMembers(); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-sm"
                  >
                    <Users size={16} className="text-gray-400" /> Manage {group.member_count} Members
                  </button>
                </div>
              </div>
            )}

            <div className="card p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-primary" /> Rules
              </h3>
              <ul className="space-y-4">
                {[
                  'Be respectful to other members',
                  'No spoilers without warning',
                  'Keep discussions movie-related',
                  'No spam or self-promotion'
                ].map((rule, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-400">
                    <span className="text-primary font-bold">{idx + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modals */}
      <AnimatePresence>
        {isEditModalOpen && (
          <Modal onClose={() => setIsEditModalOpen(false)} title="Edit Group Info">
            <form onSubmit={handleUpdateGroup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Group Name</label>
                <input
                  className="input-field"
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  className="input-field min-h-[100px]"
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Image URL</label>
                <input
                  className="input-field"
                  value={editFormData.image_url}
                  onChange={e => setEditFormData({ ...editFormData, image_url: e.target.value })}
                />
              </div>
              <button className="btn-primary w-full h-14" disabled={isUpdatingGroup}>
                {isUpdatingGroup ? <Loader2 className="animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </Modal>
        )}

        {isMembersModalOpen && (
          <Modal onClose={() => setIsMembersModalOpen(false)} title={`Manage Members (${group.member_count})`}>
            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
              {membersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
              ) : members.map(m => (
                <div key={m.user_id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
                      <UserIcon size={14} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{m.user_name}</p>
                      <p className="text-[10px] text-gray-500">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {m.user_id !== group.creator_id ? (
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <UserX size={18} />
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded-md">Owner</span>
                  )}
                </div>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, onClose, title }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} className="relative glass w-full max-w-md p-8 rounded-[32px] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function PostItem({
  post,
  isMember,
  submittingComment,
  commentValue,
  onCommentChange,
  onSubmitComment
}: any) {
  const [showComments, setShowComments] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-surface-2 border border-white/5 flex items-center justify-center">
              <UserIcon size={18} className="text-gray-400" />
            </div>
            <div>
              <h4 className="font-bold text-gray-200">{post.user_name}</h4>
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <Clock size={10} /> {formatDistanceToNow(new Date(post.created_at))} ago
              </div>
            </div>
          </div>
          <button className="text-gray-600 hover:text-white transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>

        <p className="text-gray-300 leading-relaxed text-lg mb-8 whitespace-pre-wrap">
          {post.content}
        </p>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${showComments ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <MessageSquare size={16} />
            {post.comments?.length || 0} Comments
            {showComments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <div className="flex items-center gap-4 text-gray-600 text-xs font-bold uppercase tracking-wider">
            Share
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/20 border-t border-white/5 overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* Comment Input */}
              {isMember ? (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-surface-2 shrink-0 flex items-center justify-center">
                    <UserIcon size={14} className="text-gray-500" />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      className="w-full bg-surface-2 border border-white/5 rounded-full py-2 px-4 text-sm outline-none focus:border-primary/50 transition-colors"
                      value={commentValue}
                      onChange={(e) => onCommentChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onSubmitComment()}
                    />
                    <button
                      disabled={submittingComment}
                      onClick={onSubmitComment}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover disabled:opacity-50"
                    >
                      {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-2 bg-white/5 rounded-lg border border-white/5">
                  Join the group to leave a comment.
                </p>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {(post.comments || []).map((comment: GroupComment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-surface-2 shrink-0 flex items-center justify-center group">
                      <UserIcon size={14} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-300">{comment.user_name}</span>
                        <span className="text-[10px] text-gray-600">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                      </div>
                      <p className="text-sm text-gray-400 bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
