'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
} from 'lucide-react';
import api from '@/lib/api';
import { User } from '@/lib/types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users?page=${page}`);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Could not delete user. See console for details.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && page === 1) {
    return <div style={{ padding: 48, color: 'var(--text-dim)' }}>Loading users...</div>;
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      <header style={{ marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>
            Users Management
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>
            Total users found: {users.length * page} +
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'white',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
          />
        </div>
      </header>

      {/* Users Table */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 20,
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '20px 24px', fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>User</th>
              <th style={{ padding: '20px 24px', fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Role</th>
              <th style={{ padding: '20px 24px', fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Joined On</th>
              <th style={{ padding: '20px 24px', fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u, idx) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, color: '#8B5CF6'
                    }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {u.is_admin ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 8,
                      background: 'rgba(139,92,246,0.1)', color: '#8B5CF6',
                      fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase'
                    }}>
                      <Shield size={12} /> Admin
                    </span>
                  ) : (
                    <span style={{
                      padding: '4px 10px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)',
                      fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase'
                    }}>
                      User
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontSize: 14, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} />
                    {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => deleteUser(u.id)}
                      disabled={u.is_admin}
                      style={{
                        padding: 8, borderRadius: 10,
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
                        color: u.is_admin ? 'rgba(255,255,255,0.1)' : 'rgba(248,113,113,0.5)',
                        cursor: u.is_admin ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!u.is_admin) {
                          e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)';
                          e.currentTarget.style.background = 'rgba(248,113,113,0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!u.is_admin) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button style={{
                      padding: 8, borderRadius: 10,
                      background: 'transparent', border: 'none',
                      color: 'rgba(255,255,255,0.2)', cursor: 'pointer'
                    }}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(255,255,255,0.01)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            Page {page}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                width: 32, height: 32, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                color: page === 1 ? 'rgba(255,255,255,0.1)' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                color: 'white', cursor: 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
