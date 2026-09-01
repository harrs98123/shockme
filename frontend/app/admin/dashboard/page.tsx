'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Clapperboard,
  Gem,
  Star,
  Clock,
  Shield,
  ShieldCheck,
  Activity,
  Database,
  Server,
  Zap,
  RefreshCw,
  Search,
  Film,
  MessageSquare,
  Heart,
  Bookmark,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  Plus,
  ArrowUpRight,
  BarChart3,
  Layers,
  Radio,
  Trash2,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  Share2,
  Filter,
} from 'lucide-react';
import api, { posterUrl, releaseYear } from '@/lib/api';
import { AdminStats, User, SystemHealth, Franchise, AdminSocialPost } from '@/lib/types';
import toast from '@/lib/toast';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'feed' | 'activity' | 'curator' | 'health'>('overview');

  // Feed moderation tab state
  const [feedPosts, setFeedPosts] = useState<AdminSocialPost[]>([]);
  const [feedFilter, setFeedFilter] = useState<string>('all');
  const [feedLoading, setFeedLoading] = useState(false);

  // Quick curator state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number | null>(null);
  const [curatingId, setCuratingId] = useState<number | null>(null);

  // Activity filter
  const [activityFilter, setActivityFilter] = useState<'reviews' | 'users' | 'comments'>('reviews');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([fetchStats(), fetchHealth(), fetchFranchises(), fetchFeedPosts()]);
    } catch (err) {
      console.error('Initial load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
      if (res.data?.recent_posts) {
        setFeedPosts(res.data.recent_posts);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await api.get('/admin/system/health');
      setHealth(res.data);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    }
  };

  const fetchFranchises = async () => {
    try {
      const res = await api.get('/admin/franchises');
      setFranchises(res.data);
      if (res.data.length > 0 && !selectedFranchiseId) {
        setSelectedFranchiseId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch franchises:', err);
    }
  };

  const fetchFeedPosts = async (type = feedFilter) => {
    setFeedLoading(true);
    try {
      const param = type === 'all' ? '' : `?post_type=${type}`;
      const res = await api.get(`/admin/feed/posts${param}`);
      setFeedPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch feed posts:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchStats(), fetchHealth(), fetchFeedPosts()]);
    setRefreshing(false);
    toast.success('Telemetry synchronized');
  };

  const handleFlushCache = async () => {
    if (!confirm('Invalidate all cached database & TMDB response entries?')) return;
    try {
      await api.post('/admin/system/flush-cache');
      toast.success('Cache successfully cleared');
      fetchHealth();
    } catch (err) {
      console.error('Cache error:', err);
      toast.error('Failed to flush cache');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post from the community feed?')) return;
    try {
      await api.delete(`/admin/feed/posts/${postId}`);
      setFeedPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Post removed from feed');
      fetchStats();
    } catch (err) {
      console.error('Delete post error:', err);
      toast.error('Failed to delete post');
    }
  };

  const handleToggleSpoiler = async (postId: number) => {
    try {
      const res = await api.patch(`/admin/feed/posts/${postId}/spoiler`);
      setFeedPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, is_spoiler: res.data.is_spoiler } : p))
      );
      toast.success(res.data.is_spoiler ? 'Marked as spoiler' : 'Spoiler removed');
    } catch (err) {
      console.error('Spoiler toggle error:', err);
      toast.error('Failed to update spoiler tag');
    }
  };

  const handleSearchTMDB = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/admin/tmdb/search?q=${encodeURIComponent(searchQuery)}&media_type=movie`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Could not search TMDB');
    } finally {
      setSearching(false);
    }
  };

  const handleQuickCurate = async (movie: any, target: 'gem' | 'must_watch' | 'franchise') => {
    setCuratingId(movie.id);
    try {
      const payload: any = {
        movie_id: movie.id,
        media_type: 'movie',
        target,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        overview: movie.overview,
      };
      if (target === 'franchise') {
        if (!selectedFranchiseId) {
          toast.error('Select a franchise first');
          setCuratingId(null);
          return;
        }
        payload.franchise_id = selectedFranchiseId;
      }
      const res = await api.post('/admin/quick-curate', payload);
      if (res.data.status === 'exists') {
        toast.info(res.data.message);
      } else {
        toast.success(res.data.message);
        fetchStats();
      }
    } catch (err: any) {
      console.error('Curate error:', err);
      toast.error(err.response?.data?.detail || 'Failed to curate movie');
    } finally {
      setCuratingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070c] text-white flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
          Loading Control Center...
        </p>
      </div>
    );
  }

  // Moctale breakdown calculations
  const breakdown = stats?.moctale_breakdown || {};
  const totalMoctale = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
  const perfectionPct = Math.round(((breakdown['perfection'] || 0) / totalMoctale) * 100);
  const goforitPct = Math.round(((breakdown['goforit'] || 0) / totalMoctale) * 100);
  const timepassPct = Math.round(((breakdown['timepass'] || 0) / totalMoctale) * 100);
  const skipPct = Math.round(((breakdown['skip'] || 0) / totalMoctale) * 100);

  return (
    <div className="min-h-screen bg-[#08080c] text-zinc-100 font-[Inter] p-6 lg:p-10 max-w-[1600px] mx-auto">
      
      {/* ── TOP HEADER (MINIMAL LUXURY) ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
              Live Console
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Command Center
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time platform metrics, community social stream, content curation & system health.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:bg-zinc-800/60 text-xs font-semibold text-zinc-300 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-purple-400' : 'text-zinc-400'} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={handleFlushCache}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-950/30 border border-rose-500/20 hover:bg-rose-900/40 text-xs font-semibold text-rose-300 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Zap size={13} className="text-rose-400" />
            <span>Flush Cache</span>
          </button>

          <button
            onClick={() => setActiveTab('curator')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer shadow-md shadow-purple-600/20"
          >
            <Plus size={14} />
            <span>Curate</span>
          </button>
        </div>
      </header>

      {/* ── KPI METRICS STRIP (6 CLEAN STAT CARDS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 my-6">
        
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Users</span>
            <Users size={15} className="text-blue-400/80" />
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">{stats?.total_users || 0}</div>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-mono font-medium">
              <span>+{stats?.new_users_today || 0} today</span>
            </div>
          </div>
        </div>

        {/* Watched & Watchlist */}
        <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Watched</span>
            <Eye size={15} className="text-emerald-400/80" />
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">{stats?.total_watched || 0}</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">
              {stats?.total_watchlist || 0} queued
            </div>
          </div>
        </div>

        {/* Ratings & Score */}
        <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Ratings</span>
            <Star size={15} className="text-amber-400/80" />
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">{stats?.total_ratings || 0}</div>
            <div className="text-[10px] text-amber-400 font-mono mt-1 flex items-center gap-1">
              <span>★ {stats?.avg_rating || 0}/5.0</span>
            </div>
          </div>
        </div>

        {/* Community Feed Volume */}
        <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Social Posts</span>
            <MessageSquare size={15} className="text-purple-400/80" />
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">{stats?.total_social_posts || 0}</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">
              {stats?.total_moctale_reviews || 0} reviews
            </div>
          </div>
        </div>

        {/* Curated Vault */}
        <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Vault</span>
            <Gem size={15} className="text-indigo-400/80" />
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              {(stats?.total_gems || 0) + (stats?.total_must_watch || 0)}
            </div>
            <div className="text-[10px] text-purple-300 font-mono mt-1">
              {stats?.total_franchises || 0} franchises
            </div>
          </div>
        </div>

        {/* System Ping */}
        <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">System</span>
            <Activity size={15} className="text-cyan-400/80" />
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
              <span className="capitalize">{health?.status || 'Active'}</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">
              DB: {health?.db_latency_ms || 0}ms
            </div>
          </div>
        </div>

      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] mb-6 pb-2.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <BarChart3 size={14} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('feed');
            fetchFeedPosts(feedFilter);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'feed'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Radio size={14} className="text-purple-400" />
          <span>Community Feed & Mod</span>
          {feedPosts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-[10px] text-purple-300 font-mono">
              {feedPosts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Clock size={14} />
          <span>Activity Stream</span>
        </button>

        <button
          onClick={() => setActiveTab('curator')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'curator'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Sparkles size={14} />
          <span>Quick Curator</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'health'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Server size={14} />
          <span>Diagnostics</span>
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Sentiment Meter Bar Card */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Flame size={16} className="text-purple-400" />
                    Moctale Meter Sentiment
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Distribution of user verdict labels across reviews.</p>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {totalMoctale === 1 && !breakdown['perfection'] ? 0 : totalMoctale} verdicts
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden flex mb-4 p-0.5 gap-0.5 border border-white/[0.04]">
                <div style={{ width: `${perfectionPct}%` }} className="h-full bg-emerald-500 rounded-l-full transition-all" title={`Perfection: ${perfectionPct}%`} />
                <div style={{ width: `${goforitPct}%` }} className="h-full bg-blue-500 transition-all" title={`Go For It: ${goforitPct}%`} />
                <div style={{ width: `${timepassPct}%` }} className="h-full bg-amber-500 transition-all" title={`Timepass: ${timepassPct}%`} />
                <div style={{ width: `${skipPct}%` }} className="h-full bg-rose-500 rounded-r-full transition-all" title={`Skip: ${skipPct}%`} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                  <div className="text-[11px] font-semibold text-emerald-400">✨ Perfection</div>
                  <div className="text-lg font-bold text-white mt-0.5">{breakdown['perfection'] || 0}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{perfectionPct}%</div>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/15">
                  <div className="text-[11px] font-semibold text-blue-400">🔥 Go For It</div>
                  <div className="text-lg font-bold text-white mt-0.5">{breakdown['goforit'] || 0}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{goforitPct}%</div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                  <div className="text-[11px] font-semibold text-amber-400">🍿 Timepass</div>
                  <div className="text-lg font-bold text-white mt-0.5">{breakdown['timepass'] || 0}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{timepassPct}%</div>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/[0.06] border border-rose-500/15">
                  <div className="text-[11px] font-semibold text-rose-400">🚫 Skip</div>
                  <div className="text-lg font-bold text-white mt-0.5">{breakdown['skip'] || 0}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{skipPct}%</div>
                </div>
              </div>
            </div>

            {/* Platform Counters */}
            <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.06] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Layers size={16} className="text-indigo-400" />
                  Ecosystem Modules
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <span className="text-zinc-400">Franchises & Sagas</span>
                    <span className="font-mono font-bold text-white">{stats?.total_franchises || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <span className="text-zinc-400">Timeline Entries</span>
                    <span className="font-mono font-bold text-white">{stats?.total_universe_entries || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <span className="text-zinc-400">User Collections</span>
                    <span className="font-mono font-bold text-white">{stats?.total_collections || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <span className="text-zinc-400">Debates & Battles</span>
                    <span className="font-mono font-bold text-white">{(stats?.total_debates || 0) + (stats?.total_battles || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <span className="text-zinc-400">Watch Parties</span>
                    <span className="font-mono font-bold text-white">{stats?.total_watch_parties || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.05] mt-3 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>Lockouts: {stats?.locked_users || 0}</span>
                <span>Admins: {stats?.admin_users || 1}</span>
              </div>
            </div>

          </div>

          {/* Quick Launch Cards */}
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Admin Sections
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              <Link
                href="/admin/users"
                className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-blue-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                    <Users size={16} />
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">User Directory</div>
                  <p className="text-xs text-zinc-400 mt-0.5">Manage roles, accounts & security flags.</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-blue-400 mt-3">
                  <span>Open</span>
                  <ArrowUpRight size={13} />
                </div>
              </Link>

              <Link
                href="/admin/franchises"
                className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-purple-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                    <Clapperboard size={16} />
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Franchises & Sagas</div>
                  <p className="text-xs text-zinc-400 mt-0.5">Curate watch-orders, sagas & canon tags.</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-purple-400 mt-3">
                  <span>Open</span>
                  <ArrowUpRight size={13} />
                </div>
              </Link>

              <Link
                href="/admin/gems"
                className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                    <Gem size={16} />
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Hidden Gems</div>
                  <p className="text-xs text-zinc-400 mt-0.5">Curate indie gems and rarity ratings.</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 mt-3">
                  <span>Open</span>
                  <ArrowUpRight size={13} />
                </div>
              </Link>

              <Link
                href="/admin/must-watch"
                className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-amber-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                    <Star size={16} />
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">Must Watch</div>
                  <p className="text-xs text-zinc-400 mt-0.5">Essential master-list recommendations.</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 mt-3">
                  <span>Open</span>
                  <ArrowUpRight size={13} />
                </div>
              </Link>

            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LIVE COMMUNITY FEED & MODERATION ── */}
      {activeTab === 'feed' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio size={16} className="text-purple-400 animate-pulse" />
                Community Social Feed & Moderation
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time user social posts, reviews, polls and discussions with 1-click admin moderation.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-white/[0.06] overflow-x-auto">
              {['all', 'review', 'poll', 'recommendation', 'meme', 'watching'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFeedFilter(type);
                    fetchFeedPosts(type);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    feedFilter === type
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Feed List */}
          {feedLoading ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-mono">Loading community feed...</div>
          ) : feedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {feedPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                          {post.user_name ? post.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{post.user_name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.06]">
                          {post.post_type}
                        </span>
                        {post.is_spoiler && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            Spoiler
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    {post.content && (
                      <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.015] p-2.5 rounded-xl border border-white/[0.03]">
                        {post.content}
                      </p>
                    )}

                    {/* Poll Payload preview if any */}
                    {post.post_type === 'poll' && post.payload?.options && (
                      <div className="mt-2 space-y-1.5">
                        {post.payload.options.map((opt: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-zinc-900/60 text-[11px] text-zinc-400 border border-white/[0.03]">
                            <span>{opt.text || opt.title || `Option ${idx + 1}`}</span>
                            <span className="font-mono text-zinc-500">{opt.votes || 0} votes</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Counters Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[11px] text-zinc-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart size={12} className="text-rose-400" />
                        <span>{post.reactions_count || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={12} className="text-purple-400" />
                        <span>{post.comments_count || 0}</span>
                      </span>
                      {post.movie_id && (
                        <span className="font-mono text-[10px] text-zinc-500">Movie #{post.movie_id}</span>
                      )}
                    </div>

                    {/* Mod Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSpoiler(post.id)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
                      >
                        {post.is_spoiler ? 'Unspoiler' : 'Spoiler'}
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-[10px] font-semibold p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-zinc-950/20 border border-white/[0.04] text-xs text-zinc-500">
              No community posts recorded for this category yet.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: ACTIVITY STREAM ── */}
      {activeTab === 'activity' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">System Activity Logs</h3>
              <p className="text-xs text-zinc-400">Chronological history of registrations, ratings, and comments.</p>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-white/[0.06]">
              <button
                onClick={() => setActivityFilter('reviews')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activityFilter === 'reviews' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Reviews ({stats?.recent_reviews?.length || 0})
              </button>
              <button
                onClick={() => setActivityFilter('users')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activityFilter === 'users' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Signups ({stats?.recent_users?.length || 0})
              </button>
              <button
                onClick={() => setActivityFilter('comments')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activityFilter === 'comments' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Comments ({stats?.recent_comments?.length || 0})
              </button>
            </div>
          </div>

          {/* Sub-view: Reviews */}
          {activityFilter === 'reviews' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {stats?.recent_reviews && stats.recent_reviews.length > 0 ? (
                stats.recent_reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 rounded-2xl bg-zinc-950/40 border border-white/[0.06] flex gap-3.5 items-start">
                    <img
                      src={posterUrl(rev.poster_path, 'w185')}
                      alt={rev.title || 'Movie'}
                      className="w-12 h-16 rounded-lg object-cover flex-shrink-0 bg-white/5 border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-white truncate">{rev.title}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/[0.06]">
                          {rev.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mb-1.5">
                        by <strong className="text-zinc-300">{rev.user_name}</strong> • {new Date(rev.created_at).toLocaleDateString()}
                      </div>
                      {rev.review_text && (
                        <p className="text-xs text-zinc-300 line-clamp-2 italic bg-white/[0.015] p-2 rounded-lg border border-white/[0.03]">
                          &quot;{rev.review_text}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-12 text-center text-xs text-zinc-500 font-mono">No recent reviews logged.</div>
              )}
            </div>
          )}

          {/* Sub-view: Users */}
          {activityFilter === 'users' && (
            <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.06]">
              <div className="divide-y divide-white/[0.04]">
                {stats?.recent_users && stats.recent_users.length > 0 ? (
                  stats.recent_users.map((u: User) => (
                    <div key={u.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-500/20">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{u.name}</span>
                            {u.is_admin && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500">{u.email}</div>
                        </div>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-zinc-500 font-mono">No users found.</div>
                )}
              </div>
            </div>
          )}

          {/* Sub-view: Comments */}
          {activityFilter === 'comments' && (
            <div className="space-y-2.5">
              {stats?.recent_comments && stats.recent_comments.length > 0 ? (
                stats.recent_comments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-zinc-950/40 border border-white/[0.06] flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">{c.user_name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Movie #{c.movie_id}</span>
                        {c.contains_spoiler && (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                            Spoiler
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300">{c.content}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-xs text-zinc-500 font-mono">No comments found.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: QUICK CURATOR ── */}
      {activeTab === 'curator' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.06]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-purple-400" />
              TMDB Fast Movie Curator
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Search any title on TMDB to promote to <strong>Hidden Gems</strong>, <strong>Must Watch</strong>, or add to a <strong>Franchise Timeline</strong> with 1-click.
            </p>

            <form onSubmit={handleSearchTMDB} className="flex gap-2.5 max-w-xl">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search movie title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-purple-500/60 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
              >
                {searching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                <span>{searching ? 'Searching...' : 'Search'}</span>
              </button>
            </form>

            {franchises.length > 0 && (
              <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400">
                <span className="text-[11px] font-mono">Target Franchise:</span>
                <select
                  value={selectedFranchiseId || ''}
                  onChange={(e) => setSelectedFranchiseId(Number(e.target.value))}
                  className="bg-zinc-900 border border-white/[0.08] rounded-lg px-2.5 py-1 text-white text-xs font-semibold outline-none cursor-pointer"
                >
                  {franchises.map((f) => (
                    <option key={f.id} value={f.id} className="bg-[#0f071a]">
                      {f.icon_emoji} {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {searchResults.map((m) => (
              <div key={m.id} className="p-3.5 rounded-2xl bg-zinc-950/40 border border-white/[0.06] flex gap-3.5 items-start hover:border-white/[0.12] transition-all">
                <img
                  src={posterUrl(m.poster_path, 'w185')}
                  alt={m.title}
                  className="w-14 h-20 rounded-lg object-cover flex-shrink-0 bg-white/5 border border-white/10"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{m.title}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                      <span>{releaseYear(m.release_date)}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-mono">★ {m.vote_average?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <button
                      onClick={() => handleQuickCurate(m, 'gem')}
                      disabled={curatingId === m.id}
                      className="px-2 py-0.8 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
                    >
                      + Gem
                    </button>
                    <button
                      onClick={() => handleQuickCurate(m, 'must_watch')}
                      disabled={curatingId === m.id}
                      className="px-2 py-0.8 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-semibold hover:bg-amber-500/20 transition-all cursor-pointer"
                    >
                      + Must
                    </button>
                    <button
                      onClick={() => handleQuickCurate(m, 'franchise')}
                      disabled={curatingId === m.id || !selectedFranchiseId}
                      className="px-2 py-0.8 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-semibold hover:bg-purple-500/20 transition-all cursor-pointer"
                    >
                      + Franchise
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {searchResults.length === 0 && !searching && (
            <div className="py-12 text-center text-xs text-zinc-500 font-mono">
              Search a movie above to quickly promote it into any curated collection.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: DIAGNOSTICS & SECURITY ── */}
      {activeTab === 'health' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* System Ping Card */}
            <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server size={16} className="text-cyan-400" />
                  Service Health Matrix
                </h3>
                <button
                  onClick={fetchHealth}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/[0.08] text-[11px] font-semibold text-zinc-300 hover:text-white cursor-pointer"
                >
                  Run Ping
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Database size={15} className="text-blue-400" />
                    <div>
                      <div className="font-semibold text-white">PostgreSQL Database Engine</div>
                      <div className="text-[11px] text-zinc-500">Query latency & pool status</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[11px] text-emerald-400 uppercase font-bold">{health?.db_status || 'OK'}</span>
                    <div className="text-[10px] text-zinc-500">{health?.db_latency_ms || 0} ms</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Film size={15} className="text-amber-400" />
                    <div>
                      <div className="font-semibold text-white">TMDB Public API Gateway</div>
                      <div className="text-[11px] text-zinc-500">Live configuration endpoint check</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[11px] text-emerald-400 uppercase font-bold">{health?.tmdb_status || 'OK'}</span>
                    <div className="text-[10px] text-zinc-500">{health?.tmdb_latency_ms || 0} ms</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Zap size={15} className="text-purple-400" />
                    <div>
                      <div className="font-semibold text-white">Cache Layer</div>
                      <div className="text-[11px] text-zinc-500">FastAPI cache backend</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-purple-300 font-bold">
                    {health?.redis_status || 'Active'}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Policies */}
            <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.06] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-purple-400" />
                  Security Policies
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                    <span className="text-zinc-400">Account Lockout Protection</span>
                    <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Active (5 fails / 15m)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                    <span className="text-zinc-400">JWT Token Rotation (SHA-256)</span>
                    <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Enforced
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                    <span className="text-zinc-400">Cloudflare Turnstile</span>
                    <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/15 text-[11px] text-purple-300 mt-4">
                <strong>Policy Guard:</strong> All administrative modifications require verified Bearer JWT tokens with `is_admin: true`.
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}


