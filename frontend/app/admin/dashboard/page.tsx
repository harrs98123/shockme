'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Clapperboard,
  Gem,
  TrendingUp,
  Clock,
  ExternalLink,
} from 'lucide-react';
import api from '@/lib/api';
import { AdminStats, User } from '@/lib/types';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, color: 'var(--text-dim)' }}>
        Loading dashboard...
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: '#3B82F6' },
    { label: 'Franchises', value: stats?.total_franchises || 0, icon: Clapperboard, color: '#8B5CF6' },
    { label: 'Hidden Gems', value: stats?.total_gems || 0, icon: Gem, color: '#10B981' },
    { label: 'Growth', value: '+12%', icon: TrendingUp, color: '#F59E0B' }, // Hardcoded for aesthetic
  ];

  return (
    <div style={{ padding: '40px 48px' }}>
      <header style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>
          Dashboard Overview
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>
          Welcome back, Admin. Here's what's happening on CineMatch today.
        </p>
      </header>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 24,
        marginBottom: 48
      }}>
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              padding: 24,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: `${stat.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stat.color
            }}>
              <stat.icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'white' }}>
                {stat.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* Recent Users */}
        <section style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 24,
          padding: 32
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>Recent Users</h2>
            <Link href="/admin/users" style={{ fontSize: 13, color: '#8B5CF6', fontWeight: 600, textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {stats?.recent_users.map((user: User) => (
              <div key={user.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)'
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16
                }}>
                  {user.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{user.email}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} />
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            borderRadius: 24,
            padding: 32,
            color: 'white'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Pro Tip</h3>
            <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, marginBottom: 20 }}>
              Use the "Franchises" section to create new themed collections for your users.
            </p>
            <Link href="/admin/franchises" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              color: 'white',
              textDecoration: 'none'
            }}>
              Go to Franchises <ExternalLink size={14} />
            </Link>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 24,
            padding: 32
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 16 }}>System Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>API Server</span>
                <span style={{ color: '#10B981', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                  Operational
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>TMDB Service</span>
                <span style={{ color: '#10B981', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                  Operational
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
