'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  UserCheck,
  Lock,
} from 'lucide-react';
import api from '@/lib/api';
import { User } from '@/lib/types';
import toast from '@/lib/toast';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${page}`);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User removed');
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error('Could not delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center p-8 text-zinc-500 font-mono text-xs">
        Loading user directory...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-zinc-100 font-[Inter] p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Users size={14} className="text-blue-400" />
            <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Directory</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage authenticated members, security access & administrative credentials.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-purple-500/60 transition-all"
          />
        </div>
      </header>

      {/* Users Table */}
      <div className="rounded-2xl bg-zinc-950/40 border border-white/[0.06] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                <th className="px-5 py-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredUsers.map((u, idx) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-white/[0.015] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{u.name}</div>
                        <div className="text-[11px] text-zinc-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase font-mono">
                        <Shield size={10} /> Admin
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-mono uppercase">
                        Member
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-400 font-mono">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => deleteUser(u.id)}
                      disabled={u.is_admin}
                      className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      title={u.is_admin ? 'Admin accounts protected' : 'Delete user'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Page {page}</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              className="p-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:text-white cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

