'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { X, Search, UserCheck, UserPlus, Loader2 } from 'lucide-react';

export interface FollowUser {
  id: number;
  name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_following: boolean;
  followers_count: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  initialTab?: 'followers' | 'following';
  onFollowChange?: () => void;
}

export default function FollowersModal({
  isOpen,
  onClose,
  userId,
  userName,
  initialTab = 'followers',
  onFollowChange,
}: Props) {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab);
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      fetchUsers(initialTab);
    }
  }, [isOpen, userId, initialTab]);

  const fetchUsers = async (activeTab: 'followers' | 'following') => {
    setLoading(true);
    try {
      const res = await api.get<FollowUser[]>(`/user/${userId}/${activeTab}`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = (newTab: 'followers' | 'following') => {
    setTab(newTab);
    fetchUsers(newTab);
  };

  const handleToggleFollow = async (targetUser: FollowUser) => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    setActionLoading(targetUser.id);
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUser.id
          ? {
              ...u,
              is_following: !u.is_following,
              followers_count: u.is_following ? Math.max(0, u.followers_count - 1) : u.followers_count + 1,
            }
          : u
      )
    );

    try {
      await api.post(`/user/${targetUser.id}/follow`);
      if (onFollowChange) onFollowChange();
    } catch (err) {
      console.error(err);
      // Revert if error
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, is_following: targetUser.is_following, followers_count: targetUser.followers_count }
            : u
        )
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          style={{
            background: '#121216',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 440,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="flex gap-4">
              <button
                onClick={() => handleTabSwitch('followers')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 800,
                  color: tab === 'followers' ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'color 0.2s',
                  position: 'relative',
                }}
              >
                Followers
                {tab === 'followers' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -8,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'var(--primary)',
                      borderRadius: 99,
                    }}
                  />
                )}
              </button>

              <button
                onClick={() => handleTabSwitch('following')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 800,
                  color: tab === 'following' ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'color 0.2s',
                  position: 'relative',
                }}
              >
                Following
                {tab === 'following' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -8,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'var(--primary)',
                      borderRadius: 99,
                    }}
                  />
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Search bar */}
          <div style={{ padding: '14px 20px 8px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder={`Search ${tab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '9px 12px 9px 34px',
                  color: 'white',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* List */}
          <div
            style={{
              padding: '8px 12px',
              overflowY: 'auto',
              flex: 1,
              scrollbarWidth: 'thin',
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
                <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                <span style={{ fontSize: 12 }}>Loading {tab}...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)' }}>
                <p style={{ fontSize: 13, margin: 0 }}>
                  {search ? 'No matching users found.' : `No ${tab} yet.`}
                </p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const initials = u.name.slice(0, 2).toUpperCase();
                const isSelf = currentUser && currentUser.id === u.id;

                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 8px',
                      borderRadius: 14,
                      transition: 'background 0.2s',
                    }}
                    className="hover:bg-white/5"
                  >
                    {/* User info */}
                    <Link
                      href={`/user/${u.id}`}
                      onClick={onClose}
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}
                      className="group"
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #e50914 0%, #a855f7 100%)',
                          padding: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: '#1a1a20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            fontWeight: 800,
                            fontSize: 12,
                            color: 'white',
                          }}
                        >
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} alt={u.name} width={40} height={40} className="object-cover w-full h-full" />
                          ) : (
                            initials
                          )}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }} className="truncate group-hover:text-primary transition-colors">
                            {u.name}
                          </span>
                        </div>
                        {u.username && (
                          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }} className="truncate">
                            @{u.username}
                          </p>
                        )}
                        {u.bio && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }} className="line-clamp-1">
                            {u.bio}
                          </p>
                        )}
                      </div>
                    </Link>

                    {/* Follow button (if not self) */}
                    {!isSelf && (
                      <button
                        onClick={() => handleToggleFollow(u)}
                        disabled={actionLoading === u.id}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 99,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginLeft: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          transition: 'all 0.2s',
                          border: u.is_following ? '1px solid rgba(255,255,255,0.15)' : 'none',
                          background: u.is_following ? 'transparent' : 'white',
                          color: u.is_following ? 'white' : 'black',
                        }}
                        className={u.is_following ? 'hover:border-red-500/40 hover:text-red-400' : 'hover:bg-white/90'}
                      >
                        {actionLoading === u.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : u.is_following ? (
                          <>
                            <UserCheck size={12} /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus size={12} /> Follow
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
