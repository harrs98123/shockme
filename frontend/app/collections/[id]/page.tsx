'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  Search, 
  Star, 
  Clock, 
  ChevronDown, 
  Heart, 
  Bookmark, 
  Trash2, 
  Play, 
  Plus, 
  X,
  LayoutGrid,
  Settings,
  MoreVertical
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import NumberedCollectionCard from '@/components/NumberedCollectionCard';

interface CollectionItem {
  id: number;
  movie_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: string | null;
  vote_average: number | null;
}

interface CollectionDetail {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  is_public: boolean;
  item_count: number;
  cover_poster: string | null;
  banner_path: string | null;
  banner_movie_id: number | null;
  updated_at: string | null;
  items: CollectionItem[];
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_IMG = 'https://image.tmdb.org/t/p/w1280';

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [sortBy, setSortBy] = useState('Creator Order');
  const [contentType, setContentType] = useState('Movies');
  const [moctaleSelect, setMoctaleSelect] = useState(false);
  const [familyFriendly, setFamilyFriendly] = useState(false);

  // Banner Selection State
  const [isSearchingBanner, setIsSearchingBanner] = useState(false);
  const [bannerSearchQuery, setBannerSearchQuery] = useState('');
  const [bannerSearchResults, setBannerSearchResults] = useState<any[]>([]);
  const [bannerSearchLoading, setBannerSearchLoading] = useState(false);

  // Streaming Providers State
  const [providersMap, setProvidersMap] = useState<Record<number, any[]>>({});
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = () => {
    setLoading(true);
    api.get(`/collections/${id}`)
      .then(res => {
        setCollection(res.data);
        if (res.data.items?.length > 0) {
          fetchProviders(res.data.items);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Collection not found or private');
      })
      .finally(() => setLoading(false));
  };

  const fetchProviders = async (items: CollectionItem[]) => {
    setLoadingProviders(true);
    const newProvidersMap: Record<number, any[]> = {};
    
    try {
      // TMDB limit is 40 requests per 10 seconds. For a typical collection we are fine.
      // We'll fetch in batches if needed, but for now Promise.all is okay for common collection sizes.
      await Promise.all(items.map(async (item) => {
        try {
          const res = await api.get(`/movies/${item.movie_id}?media_type=${item.media_type || 'movie'}`);
          const resData = res.data?.['watch/providers']?.results?.['IN'] || {};
          
          // Collect all availability types
          const allForMovie = [
            ...(resData.flatrate || []),
            ...(resData.rent || []),
            ...(resData.buy || []),
            ...(resData.free || []),
            ...(resData.ads || [])
          ];

          // Deduplicate by provider_id for the same movie
          const uniqueForMovie = Array.from(new Map(allForMovie.map(p => [p.provider_id, p])).values());
          
          newProvidersMap[item.movie_id] = uniqueForMovie;
        } catch (e) {
          console.error(`Failed to fetch providers for ${item.movie_id}`, e);
        }
      }));
      setProvidersMap(newProvidersMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const removeFromCollection = async (movieId: number) => {
    if (!collection) return;
    try {
      await api.delete(`/collections/${id}/remove/${movieId}`);
      setCollection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter(item => item.movie_id !== movieId),
          item_count: prev.item_count - 1
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBannerSearch = async (q: string) => {
    setBannerSearchQuery(q);
    if (q.trim().length < 2) {
      setBannerSearchResults([]);
      return;
    }
    setBannerSearchLoading(true);
    try {
      const res = await api.get(`/movies/search?q=${encodeURIComponent(q)}`);
      setBannerSearchResults(res.data?.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBannerSearchLoading(false);
    }
  };

  const updateBanner = async (movie: any) => {
    if (!collection) return;
    try {
      const res = await api.patch(`/collections/${id}/banner`, {
        banner_path: movie.backdrop_path || movie.poster_path,
        banner_movie_id: movie.id
      });
      setCollection(prev => prev ? { ...prev, banner_path: res.data.banner_path, banner_movie_id: res.data.banner_movie_id } : null);
      setIsSearchingBanner(false);
      setBannerSearchQuery('');
      setBannerSearchResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  const availableProviders = useMemo(() => {
    const allProviders: any[] = [];
    const seenIds = new Set<number>();

    Object.values(providersMap).forEach((providers: any[]) => {
      providers.forEach(p => {
        if (!seenIds.has(p.provider_id)) {
          seenIds.add(p.provider_id);
          allProviders.push(p);
        }
      });
    });

    return allProviders.sort((a, b) => a.display_priority - b.display_priority);
  }, [providersMap]);

  const filteredItems = useMemo(() => {
    if (!collection) return [];
    let items = [...collection.items];
    
    // Sort logic
    if (sortBy === 'Rating') {
      items.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (sortBy === 'Earliest') {
      items.sort((a, b) => (a.release_year || '').localeCompare(b.release_year || ''));
    } else if (sortBy === 'Latest') {
      items.sort((a, b) => (b.release_year || '').localeCompare(a.release_year || ''));
    }

    // Provider filter
    if (selectedProviderId) {
      items = items.filter(item => {
        const itemProviders = providersMap[item.movie_id] || [];
        return itemProviders.some(p => p.provider_id === selectedProviderId);
      });
    }
    
    return items;
  }, [collection, sortBy, contentType, selectedProviderId, providersMap]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)' }} />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#050505' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12, color: 'white' }}>{error || 'Not Found'}</h1>
        <Link href="/collections" style={{ color: 'var(--primary)', fontWeight: 700 }}>Return to Collections</Link>
      </div>
    );
  }

  const isOwner = user?.id === collection.user_id;
  const bannerImg = collection.banner_path || collection.items[0]?.backdrop_path;

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: 100 }}>
      
      {/* ── Main Layout Container ── */}
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '100px 40px 40px', display: 'flex', gap: 48 }}>
        
        {/* ── Sidebar Filters ── */}
        <aside style={{ width: 320, flexShrink: 0, position: 'sticky', top: 100, height: 'fit-content' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            padding: 32,
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <Filter size={20} className="text-primary" />
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Filters</h2>
            </div>

            {/* Sort By */}
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Sort By</p>
              <div style={{ position: 'relative' }}>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: 'white',
                    appearance: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="Creator Order">Creator Order</option>
                  <option value="Rating">Top Rated</option>
                  <option value="Latest">Recently Released</option>
                  <option value="Earliest">Oldest First</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.4)' }} />
              </div>
            </div>

            {/* Content Type */}
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Content Type</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Movies', 'Shows', 'Anime'].map(type => (
                  <button
                    key={type}
                    onClick={() => setContentType(type)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: contentType === type ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                      background: contentType === type ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                      color: contentType === type ? 'var(--primary)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Toggles */}
            <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={() => setMoctaleSelect(!moctaleSelect)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', borderRadius: 12,
                  background: moctaleSelect ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                  border: '1px solid',
                  borderColor: moctaleSelect ? '#facc15' : 'rgba(255,255,255,0.1)',
                  color: moctaleSelect ? '#facc15' : 'rgba(255,255,255,0.7)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 3, border: `2px solid ${moctaleSelect ? '#facc15' : 'currentColor'}` }} />
                Moctale Select
              </button>
              <button 
                onClick={() => setFamilyFriendly(!familyFriendly)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', borderRadius: 12,
                  background: familyFriendly ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  border: '1px solid',
                  borderColor: familyFriendly ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                  color: familyFriendly ? '#06b6d4' : 'rgba(255,255,255,0.7)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 3, border: `2px solid ${familyFriendly ? '#06b6d4' : 'currentColor'}` }} />
                Family Friendly
              </button>
            </div>

            {/* Streaming Platforms */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>Streaming Platforms</p>
              
              {loadingProviders ? (
                <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
                   {[1,2,3].map(i => (
                     <div key={i} style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
                   ))}
                </div>
              ) : availableProviders.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {availableProviders.slice(0, 12).map(p => (
                    <button
                      key={p.provider_id}
                      onClick={() => setSelectedProviderId(selectedProviderId === p.provider_id ? null : p.provider_id)}
                      title={p.provider_name}
                      style={{
                        position: 'relative',
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: 'none',
                        border: '2px solid',
                        borderColor: selectedProviderId === p.provider_id ? 'var(--primary)' : 'transparent',
                        transition: 'all 0.2s',
                        padding: 0
                      }}
                    >
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                        alt={p.provider_name}
                        fill
                        style={{ objectFit: 'cover', opacity: selectedProviderId && selectedProviderId !== p.provider_id ? 0.3 : 1 }}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No streaming info found.</p>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          
          {/* Banner Hero */}
          <div style={{ position: 'relative', borderRadius: 32, overflow: 'hidden', height: 480, boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)' }}>
             {bannerImg ? (
                <Image
                  src={`${BACKDROP_IMG}${bannerImg}`}
                  alt={collection.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
             ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #111, #222)' }} />
             )}
             <div style={{
               position: 'absolute', inset: 0,
               background: 'linear-gradient(to top, #050505 0%, transparent 60%, rgba(0,0,0,0.3) 100%)'
             }} />

             {/* Change Banner UI for Owner */}
             {isOwner && (
               <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
                 {!isSearchingBanner ? (
                   <button 
                    onClick={() => setIsSearchingBanner(true)}
                    style={{
                      padding: '10px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8
                    }}
                   >
                     <Settings size={16} />
                     Change Banner
                   </button>
                 ) : (
                   <div style={{ position: 'relative', width: 300 }}>
                      <input 
                        autoFocus
                        type="text"
                        placeholder="Search any movie backdrop..."
                        value={bannerSearchQuery}
                        onChange={(e) => handleBannerSearch(e.target.value)}
                        style={{
                          width: '100%', padding: '12px 16px 12px 40px', borderRadius: 16,
                          background: 'rgba(0,0,0,0.8)', color: 'white', border: '1px solid var(--primary)',
                          outline: 'none', fontSize: 14
                        }}
                      />
                      <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                      <button 
                        onClick={() => setIsSearchingBanner(false)}
                        style={{ position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                      >
                        <X size={24} />
                      </button>

                      {/* Search Results Dropdown */}
                      <AnimatePresence>
                        {bannerSearchResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            style={{
                              position: 'absolute', top: '100%', right: 0, width: '100%', marginTop: 8,
                              background: '#111', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
                              maxHeight: 300, overflowY: 'auto', zIndex: 100, padding: 8,
                              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                            }}
                          >
                            {bannerSearchResults.slice(0, 5).map(m => (
                              <button
                                key={m.id}
                                onClick={() => updateBanner(m)}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                  padding: 8, borderRadius: 10, background: 'none', border: 'none',
                                  color: 'white', cursor: 'pointer', textAlign: 'left'
                                }}
                                className="search-result-item"
                              >
                                <div style={{ width: 40, height: 60, position: 'relative', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                                  <Image src={`${TMDB_IMG}${m.poster_path}`} alt={m.title} fill style={{ objectFit: 'cover' }} />
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{m.title}</p>
                                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{m.release_date?.slice(0,4)}</p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                 )}
               </div>
             )}
          </div>

          {/* Collection Metadata Section */}
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 40 }}>
            <div style={{ flex: 1, paddingRight: 60 }}>
              <h1 style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-2px', margin: '0 0 16px', lineHeight: 1 }}>{collection.name}</h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 600 }}>
                   <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(to tr, #8B5CF6, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white' }}>
                    <MoreVertical size={16} />
                   </div>
                   <span>Creator: User #{collection.user_id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
                  <Clock size={16} />
                  <span>Updated {new Date(collection.updated_at || '').toLocaleDateString()}</span>
                </div>
              </div>

              {collection.description && (
                <p style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', maxWidth: 800 }}>
                  {collection.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <button style={{ 
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 24px', borderRadius: 16,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: 15
              }}>
                <Heart size={20} />
                0
              </button>
              <button style={{ 
                padding: '14px', borderRadius: 16,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', cursor: 'pointer'
              }}>
                <Bookmark size={22} />
              </button>
            </div>
          </div>

          {/* Grid Section */}
          <div style={{ marginTop: 60 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
               <h3 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Collection <span style={{ color: 'var(--primary)', opacity: 0.8 }}>({collection.items.length})</span></h3>
            </div>
            
            {filteredItems.length === 0 ? (
              <div style={{ padding: '80px 0', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>No movies found in this collection.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 40 }}>
                {filteredItems.map((item, idx) => (
                  <NumberedCollectionCard
                    key={item.movie_id}
                    index={idx}
                    movie={item}
                    isOwner={isOwner}
                    onRemove={removeFromCollection}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .search-result-item:hover {
          background: rgba(255,255,255,0.05) !important;
        }
        select option {
          background: #111;
          color: white;
        }
      `}</style>
    </div>
  );
}
