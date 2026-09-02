'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Clapperboard,
  Gem,
  Star,
  LogOut,
  ChevronRight,
  Shield,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, tag: 'Live' },
  { href: '/admin/users', label: 'User Directory', icon: Users },
  { href: '/admin/franchises', label: 'Franchises & Sagas', icon: Clapperboard },
  { href: '/admin/gems', label: 'Hidden Gems', icon: Gem },
  { href: '/admin/must-watch', label: 'Must Watch', icon: Star },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isLoading || !user?.is_admin) {
    return (
      <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 rounded-xl border-2 border-purple-500/30 border-t-purple-500 animate-spin mb-3" />
        <span className="text-xs font-semibold text-gray-400">Verifying administrator credentials...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col lg:flex-row font-[Inter] antialiased">
      
      {/* ── MOBILE TOP BAR ── */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 bg-[#0a0714] border-b border-white/[0.08] sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Shield size={16} />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white tracking-tight">CineMatch</div>
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Admin Hub</div>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-gray-200 hover:text-white"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── MOBILE BACKDROP ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        />
      )}

      {/* ── SIDEBAR DRAWER ── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0714] border-r border-white/[0.08] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Shield size={18} />
            </div>
            <div>
              <div className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <span>CineMatch</span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              </div>
              <div className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest">
                Master Control
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-white/[0.06] mx-5 mb-4" />

        {/* Navigation List */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-zinc-800/90 text-white border border-white/[0.1] shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                <Icon
                  size={15}
                  className={`flex-shrink-0 transition-colors ${
                    active ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.tag && (
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.tag}
                  </span>
                )}
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400 ml-auto flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: Profile, Quick site link, Logout */}
        <div className="p-4 border-t border-white/[0.06] space-y-3">
          
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] text-xs font-semibold text-gray-300 transition-all"
          >
            <span className="flex items-center gap-2">
              <span>View Main Site</span>
            </span>
            <ExternalLink size={12} className="text-gray-400" />
          </Link>

          {/* Admin User Card */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-500/20">
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-gray-400 truncate">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-white transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN VIEWPORT ── */}
      <main className="flex-1 lg:ml-64 min-h-screen bg-[#080810]">
        {children}
      </main>
    </div>
  );
}

