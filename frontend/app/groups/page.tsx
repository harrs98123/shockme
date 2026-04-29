'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
  Info,
  Compass
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Group } from '@/lib/types';
import Link from 'next/link';

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  });

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/groups', formData);
      setIsModalOpen(false);
      setFormData({ name: '', description: '', image_url: '' });
      fetchGroups();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      await api.post(`/groups/${groupId}/join`);
      setGroups(groups.map(g => g.id === groupId ? { ...g, is_member: true, member_count: g.member_count + 1 } : g));
    } catch (err) {
      console.error('Failed to join group', err);
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-white py-20">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="container relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-sm font-medium text-gray-300 mb-6 backdrop-blur-md">
              <Compass size={14} className="text-indigo-400" />
              <span>Explore Communities</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
              Find Your Cinematic Tribe
            </h1>
            <p className="text-lg md:text-xl text-gray-400/90 leading-relaxed font-light">
              Join spaces tailored to your favorite genres, directors, and eras. Start a conversation or build your own circle.
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => user ? setIsModalOpen(true) : (window.location.href = '/login')}
            className="group flex items-center gap-2 px-6 py-4 rounded-2xl bg-white text-black font-semibold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transition-all duration-300"
          >
            <Plus size={20} className="transition-transform group-hover:rotate-90 duration-300" />
            Create Group
          </motion.button>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative max-w-2xl mb-16 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-2xl backdrop-blur-xl focus-within:border-white/20 focus-within:bg-white/[0.05] transition-all duration-300">
            <Search className="absolute left-5 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by genre, director, or vibe..."
              className="w-full bg-transparent border-none text-white placeholder-gray-500 pl-14 pr-6 py-5 outline-none font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Groups Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[380px] w-full bg-white/[0.02] border border-white/[0.05] rounded-[32px] animate-pulse" />
            ))}
          </div>
        ) : filteredGroups.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {filteredGroups.map((group) => (
              <motion.div
                key={group.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="relative group block"
              >
                {/* ✨ The Hover Shadow Gradient Effect ✨ */}
                <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[34px] blur-xl opacity-0 group-hover:opacity-40 transition duration-500 z-0" />

                {/* Card Container */}
                <div className="relative z-10 flex flex-col h-full bg-[#0a0a0a] border border-white/[0.08] hover:border-white/[0.15] rounded-[32px] overflow-hidden transition-all duration-500">

                  {/* Banner Image Area */}
                  <div className="relative h-40 bg-zinc-900 overflow-hidden">
                    {group.image_url ? (
                      <>
                        <img
                          src={group.image_url}
                          alt={group.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/[0.02] to-white/[0.05]">
                        <Users size={64} className="text-white/10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                      </div>
                    )}

                    {/* Member Badge */}
                    <div className="absolute top-5 right-5 bg-black/50 backdrop-blur-xl px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border border-white/10 text-gray-200 shadow-xl">
                      <Users size={12} className="text-indigo-400" />
                      {group.member_count}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-5 pt-3 flex flex-col flex-1">
                    <h3 className="text-xl font-bold mb-2 tracking-tight text-white group-hover:text-indigo-200 transition-colors duration-300">
                      {group.name}
                    </h3>
                    <p className="text-xs text-gray-400/80 leading-relaxed line-clamp-2 mb-6 flex-1 font-light">
                      {group.description || 'A mysterious group with no description.'}
                    </p>

                    <div className="flex items-center justify-between gap-4 mt-auto pt-5 border-t border-white/[0.06]">
                      <Link
                        href={`/groups/${group.id}`}
                        className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors duration-300 group/link"
                      >
                        Explore Space
                        <ArrowRight size={16} className="transition-transform group-hover/link:translate-x-1 duration-300 text-indigo-400" />
                      </Link>

                      {!group.is_member ? (
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          className="text-sm font-medium px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          Join Group
                        </button>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20">
                          Joined
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* Empty State Fallback */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 bg-white/[0.01] border border-white/[0.05] rounded-[40px]"
          >
            <div className="p-6 rounded-full bg-white/[0.03] border border-white/[0.05] mb-6">
              <Search size={32} className="text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">No groups found</h2>
            <p className="text-gray-400 font-light text-center max-w-sm">
              We couldn't find anything matching your search. Why not start the conversation yourself?
            </p>
          </motion.div>
        )}

        {/* Create Group Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-6 overflow-y-auto pt-24 md:pt-32">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[-1]"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-md bg-zinc-950/90 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-white/10 shadow-[0_0_80px_-20px_rgba(0,0,0,1)] overflow-hidden"
              >
                {/* Subtle top glare effect for modal */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-8 right-8 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all duration-300"
                >
                  <X size={20} />
                </button>

                <div className="mb-10 pr-12">
                  <h2 className="text-3xl font-bold mb-3 tracking-tight">Launch a Community</h2>
                  <p className="text-gray-400 font-light leading-relaxed">Create a dedicated space for cinephiles to connect, discuss, and share.</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-3 items-center font-medium"
                  >
                    <AlertCircle size={18} className="shrink-0" />
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleCreateGroup} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Group Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. A24 Fanatics, The Director's Cut"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:bg-white/[0.05] focus:border-indigo-500/50 outline-none transition-all duration-300"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Description</label>
                    <textarea
                      rows={3}
                      placeholder="What is the central theme of your group?"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:bg-white/[0.05] focus:border-indigo-500/50 outline-none transition-all duration-300 resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Cover Image URL <span className="text-gray-700">(Optional)</span></label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:bg-white/[0.05] focus:border-indigo-500/50 outline-none transition-all duration-300"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>

                  <div className="pt-2">
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex gap-3 items-start mb-6">
                      <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-400 leading-relaxed font-light">
                        You can manage up to <span className="text-white font-medium">3 active communities</span>.
                      </p>
                    </div>

                    <button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full flex items-center justify-center h-14 rounded-2xl bg-white text-black font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin text-black" size={24} /> : 'Publish Group'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}