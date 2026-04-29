'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Clapperboard,
  Gem,
  LogOut,
  ChevronRight,
  Shield,
  Star,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/franchises', label: 'Franchises', icon: Clapperboard },
  { href: '/admin/gems', label: 'Hidden Gems', icon: Gem },
  { href: '/admin/must-watch', label: 'Must Watch', icon: Star },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user?.is_admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080810' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                CineMatch
              </div>
              <div style={{ fontSize: 10, color: '#8B5CF6', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px 16px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  marginBottom: 2,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                  color: active ? '#A78BFA' : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 600 : 500,
                  fontSize: 14,
                  position: 'relative',
                }}
              >
                {active && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 18,
                    background: '#8B5CF6',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <item.icon size={17} />
                {item.label}
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user info + logout */}
        <div style={{ padding: '16px' }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />
          <div style={{
            padding: '12px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{user.email}</div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F87171';
              e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)';
              e.currentTarget.style.background = 'rgba(248,113,113,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 240, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
