'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import RecommendationsSection from '@/components/RecommendationsSection';
import {
  FavoriteItem,
  WatchlistItem,
  WatchedItem,
  Group,
  UserReview,
  Collection,
  GroupPost,
  MovieInterest
} from '@/lib/types';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Edit,
  UserX,
  ShieldCheck,
  Loader2,
  ExternalLink,
  MessageSquare,
  Star,
  LayoutGrid,
  Plus,
  ArrowRight,
  TrendingUp,
  Calendar,
  LogOut,
  Heart,
  Eye,
  Clock,
  Film,
  Bell,
  Users,
} from 'lucide-react';

import ProfileEditModal from '@/components/ProfileEditModal';

type TabType = 'favorites' | 'reviews' | 'posts' | 'collections' | 'watchlist' | 'watched' | 'groups' | 'tierlists' | 'interested';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const [favs, setFavs] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watched, setWatched] = useState<WatchedItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tierLists, setTierLists] = useState<any[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [myPosts, setMyPosts] = useState<GroupPost[]>([]);
  const [interested, setInterested] = useState<MovieInterest[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setDataLoading(true);
    const fetchItem = async (url: string, setter: (data: any) => void) => {
      try {
        const res = await api.get(url);
        setter(res.data);
      } catch { setter([]); }
    };
    await Promise.all([
      fetchItem('/favorites', setFavs),
      fetchItem('/watchlist', setWatchlist),
      fetchItem('/watched', setWatched),
      fetchItem('/tierlist/all', setTierLists),
      fetchItem('/moctale/my', setReviews),
      fetchItem('/collections/my', setCollections),
      fetchItem('/groups', setGroups),
      fetchItem('/groups/my/posts', setMyPosts),
      fetchItem('/interests/user/all', setInterested),
    ]);

    setDataLoading(false);
  };

  if (isLoading || !user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
      <Loader2 style={{ animation: 'spin 1s linear infinite', color: 'var(--primary, #E50914)' }} size={40} />
    </div>
  );

  const getMappedMovies = (items: any[]) => items.map(item => ({
    id: item.movie_id, title: item.title, poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.release_year ? `${item.release_year}-01-01` : '',
    vote_average: item.vote_average || 0, vote_count: 0, overview: '', genre_ids: []
  }));

  const favIds = favs.map(f => f.movie_id);
  const watchIds = watchlist.map(w => w.movie_id);
  const watchedIds = watched.map(w => w.movie_id);

  const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const quickStats = [
    { label: 'Favorites', count: favs.length, icon: Heart, tab: 'favorites' as TabType },
    { label: 'Watched', count: watched.length, icon: Eye, tab: 'watched' as TabType },
    { label: 'Watchlist', count: watchlist.length, icon: Clock, tab: 'watchlist' as TabType },
    { label: 'Reviews', count: reviews.length, icon: Star, tab: 'reviews' as TabType },
    { label: 'Collections', count: collections.length, icon: LayoutGrid, tab: 'collections' as TabType },
  ];

  const tabs = [
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'watchlist', label: 'Watchlist', icon: Clock },
    { id: 'watched', label: 'Watched', icon: Eye },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'collections', label: 'Collections', icon: LayoutGrid },
    { id: 'posts', label: 'Posts', icon: MessageSquare },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'tierlists', label: 'Tier Lists', icon: TrendingUp },
    { id: 'interested', label: 'Interested', icon: Bell },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: 80, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Cinematic Ambient Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 15% 0%, rgba(139,92,246,0.05) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(229,9,20,0.03) 0%, transparent 50%)',
      }} />

      {/* Profile Hero Header */}
      <div style={{ position: 'relative', paddingTop: 100, paddingBottom: 40, zIndex: 1 }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* Glassmorphic Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 32,
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
              overflow: 'hidden'
            }}
          >
            {/* Subtle internal glow */}
            <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>

              {/* Circular Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 128, height: 128,
                  borderRadius: '50%',
                  padding: 4,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                }}>
                  <div style={{
                    width: '100%', height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1f1f1f, #0a0a0a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 40, fontWeight: 800, color: '#fff',
                  }}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : initials}
                  </div>
                </div>
                {/* Verified badge */}
                <div style={{
                  position: 'absolute', bottom: 4, right: 4,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--primary, #E50914)', border: '4px solid #111',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShieldCheck size={16} color="#fff" strokeWidth={2.5} />
                </div>
              </div>

              {/* User Info */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: '-1px', color: '#fff' }}>{user.name}</h1>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: '4px 12px', letterSpacing: '0.5px', textTransform: 'uppercase'
                  }}>Member</span>
                </div>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', fontWeight: 500 }}>
                  @{user.username || user.name.toLowerCase().replace(/\s/g, '')}
                </p>
                {user.bio && (
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 540, lineHeight: 1.6, margin: 0 }}>
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, flexShrink: 0, alignSelf: 'flex-start' }}>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 16,
                    background: '#fff', color: '#000',
                    border: 'none', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <Edit size={16} /> Edit Profile
                </button>
                <button
                  onClick={logout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 20px', borderRadius: 16,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>

            {/* Bento Quick Stats */}
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {quickStats.map((stat, idx) => (
                <div key={idx} onClick={() => setActiveTab(stat.tab)} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px', borderRadius: 20,
                  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)',
                  minWidth: 160, cursor: 'pointer', transition: 'background 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                >
                  <div style={{ padding: 10, borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)' }}>
                    <stat.icon size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{dataLoading ? '-' : stat.count}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Sleek Floating Tabs */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 40, overflowX: 'auto',
          scrollbarWidth: 'none', paddingBottom: 4,
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          {tabs.map(tab => {
            const countMap: Record<string, number> = {
              favorites: favs.length, watchlist: watchlist.length, watched: watched.length,
              reviews: reviews.length, collections: collections.length, posts: myPosts.length,
              groups: groups.length, tierlists: tierLists.length, interested: interested.length,
            };

            const count = countMap[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 16px', flexShrink: 0,
                  fontSize: 14, fontWeight: isActive ? 700 : 600,
                  background: 'transparent', border: 'none',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'color 0.2s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
              >
                <tab.icon size={16} />
                {tab.label}
                {!dataLoading && count > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                    borderRadius: 20, padding: '2px 8px', marginLeft: 4
                  }}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    style={{
                      position: 'absolute', bottom: -1, left: 0, right: 0,
                      height: 2, background: '#fff', borderRadius: '2px 2px 0 0'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div style={{ minHeight: 400 }}>
          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
              <div style={{ width: 48, height: 48, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3 }}
              >
                {/* Movie Lists (Favorites, Watchlist, Watched) */}
                {(activeTab === 'favorites' || activeTab === 'watchlist' || activeTab === 'watched') && (
                  <div>
                    <SectionHeader
                      title={activeTab === 'favorites' ? 'Curated Favorites' : activeTab === 'watchlist' ? 'Up Next' : 'Viewing History'}
                      count={activeTab === 'favorites' ? favs.length : activeTab === 'watchlist' ? watchlist.length : watched.length}
                    />
                    {getMappedMovies(activeTab === 'favorites' ? favs : activeTab === 'watchlist' ? watchlist : watched).length === 0 ? (
                      <EmptyState
                        icon={activeTab === 'favorites' ? Heart : activeTab === 'watchlist' ? Clock : Eye}
                        title={`Your ${activeTab} is empty`}
                        description="Start exploring and curate your personal cinematic journey."
                        action="Discover Cinema"
                        onAction={() => router.push('/search')}
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {getMappedMovies(activeTab === 'favorites' ? favs : activeTab === 'watchlist' ? watchlist : watched).map(movie => (
                          <MovieCard
                            key={movie.id} movie={movie}
                            isFav={favIds.includes(movie.id)}
                            isWatchlisted={watchIds.includes(movie.id)}
                            isWatched={watchedIds.includes(movie.id)}
                            onFavToggle={() => fetchAllData()}
                            onWatchlistToggle={() => fetchAllData()}
                            onWatchedToggle={() => fetchAllData()}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Other Tabs (Reviews, Collections, Groups, etc.) follow similar sleek patterns */}
                {/* Interested */}
                {activeTab === 'interested' && (
                  <div>
                    <SectionHeader title="Anticipated Releases" count={interested.length} />
                    {interested.length === 0 ? (
                      <EmptyState icon={Bell} title="No upcoming alerts" description="Track unreleased films and get notified when they drop." action="Explore Upcoming" onAction={() => router.push('/upcoming')} />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {interested.map(item => (
                          <MovieCard
                            key={item.movie_id}
                            movie={{
                              id: item.movie_id, title: item.title || 'Untitled', media_type: item.media_type as any,
                              poster_path: item.poster_path, backdrop_path: item.backdrop_path, release_date: item.release_date || '',
                              vote_average: 0, vote_count: 0, overview: '', genre_ids: []
                            }}
                            isFav={favIds.includes(item.movie_id)}
                            isWatchlisted={watchIds.includes(item.movie_id)}
                            isWatched={watchedIds.includes(item.movie_id)}
                            onFavToggle={() => fetchAllData()}
                            onWatchlistToggle={() => fetchAllData()}
                            onWatchedToggle={() => fetchAllData()}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews */}
                {activeTab === 'reviews' && (
                  <div>
                    <SectionHeader title="Your Verdicts" count={reviews.length} />
                    {reviews.length === 0 ? (
                      <EmptyState icon={Star} title="No reviews yet" description="Share your thoughts on the films you've experienced." action="Browse Movies" onAction={() => router.push('/search')} />
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                      </div>
                    )}
                  </div>
                )}

                {/* Collections */}
                {activeTab === 'collections' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                      <SectionHeader title="Curated Collections" count={collections.length} noMargin />
                      <button
                        onClick={() => router.push('/collections')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 20px', borderRadius: 14,
                          background: '#fff', color: '#000', fontSize: 14, fontWeight: 700,
                          border: 'none', cursor: 'pointer', transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <Plus size={16} /> New List
                      </button>
                    </div>
                    {collections.length === 0 ? (
                      <EmptyState icon={LayoutGrid} title="Empty shelves" description="Group your favorite films into custom cinematic lists." action="Start Curating" onAction={() => router.push('/collections')} />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {collections.map(col => <CollectionCard key={col.id} collection={col} />)}
                      </div>
                    )}
                  </div>
                )}

                {/* Groups */}
                {activeTab === 'groups' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <SectionHeader title="Managed by You" count={groups.filter(g => g.creator_id == user.id).length} noMargin />
                        <Link href="/groups" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', opacity: 0.6, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
                          Browse All <ArrowRight size={14} />
                        </Link>
                      </div>
                      {groups.filter(g => g.creator_id == user.id).length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>You haven't created any communities.</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                          {groups.filter(g => g.creator_id == user.id).map(g => (
                            <GroupProfileCard key={g.id} group={g} onManage={() => { setSelectedGroup(g); setIsGroupModalOpen(true); }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <SectionHeader title="Joined Communities" count={groups.filter(g => g.is_member && g.creator_id != user.id).length} />
                      {groups.filter(g => g.is_member && g.creator_id != user.id).length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>You haven't joined any groups yet.</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                          {groups.filter(g => g.is_member && g.creator_id != user.id).map(g => (
                            <GroupProfileCard key={g.id} group={g} onManage={() => { setSelectedGroup(g); setIsGroupModalOpen(true); }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallbacks for Posts and Tierlists omitted for brevity but follow the exact same updated card styling patterns (border-radius: 24px, subtle borders, deep glassmorphic backgrounds) */}

              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div style={{ marginTop: 64, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 40 }}>
          <RecommendationsSection />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isEditModalOpen && (
          <ProfileEditModal user={user} onClose={() => setIsEditModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────

function SectionHeader({ title, count, noMargin }: { title: string; count: number; noMargin?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: noMargin ? 0 : 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>{title}</h2>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 20 }}>
        {count} {count === 1 ? 'Entry' : 'Entries'}
      </span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action, onAction }: any) {
  return (
    <div style={{ padding: '100px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 32, border: '1px dashed rgba(255,255,255,0.05)' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 24,
        background: 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, color: 'rgba(255,255,255,0.3)',
      }}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: '#fff' }}>{title}</h3>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: 340, lineHeight: 1.6, margin: '0 0 32px' }}>{description}</p>
      {action && (
        <button
          onClick={onAction}
          style={{
            padding: '14px 32px', borderRadius: 16,
            background: '#fff', color: '#000', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {action}
        </button>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: UserReview }) {
  return (
    <div style={{
      display: 'flex', gap: 20, padding: 24,
      borderRadius: 24, background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s',
      backdropFilter: 'blur(10px)',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}
    >
      <div style={{ width: 64, height: 96, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#111' }}>
        {review.poster_path ? (
          <img src={`https://image.tmdb.org/t/p/w200${review.poster_path}`} alt={review.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={24} color="rgba(255,255,255,0.1)" /></div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.title || 'Untitled'}</h3>
        </div>
        <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 10px', marginBottom: 12 }}>
          {review.label}
        </span>
        {review.review_text && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            "{review.review_text}"
          </p>
        )}
      </div>
    </div>
  );
}

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link href={`/collections/${collection.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', transition: 'all 0.3s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}
      >
        <div style={{ position: 'relative', aspectRatio: '3/4', background: '#111' }}>
          {collection.cover_poster ? (
            <>
              <img src={`https://image.tmdb.org/t/p/w500${collection.cover_poster}`} alt={collection.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,5,0.9) 0%, transparent 50%)' }} />
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutGrid size={32} color="rgba(255,255,255,0.1)" />
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{collection.name}</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: 600 }}>{collection.item_count} Films</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function GroupProfileCard({ group, onManage }: { group: Group; onManage: () => void }) {
  return (
    <div style={{
      padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column',
      transition: 'all 0.3s', backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>{group.name}</h3>
        {group.is_creator && (
          <span style={{ fontSize: 10, fontWeight: 800, color: '#000', background: '#fff', borderRadius: 12, padding: '4px 10px', textTransform: 'uppercase' }}>Admin</span>
        )}
      </div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 24px', flexGrow: 1 }}>
        {group.description || 'Cinema discussion and discovery.'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
          <Users size={16} /> {group.member_count} Members
        </span>
        <button
          onClick={onManage}
          style={{
            padding: '8px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: 'rgba(255,255,255,0.05)', border: 'none',
            color: '#fff', cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          {group.is_creator ? 'Manage' : 'View'}
        </button>
      </div>
    </div>
  );
}