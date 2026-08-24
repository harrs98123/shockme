'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Calendar,
  Clock,
  Users,
  PlaySquare,
  Plus,
  Tv,
  MessageSquare,
  Search,
  X,
  Check
} from 'lucide-react';

interface WatchPartyParticipant {
  user_id: number;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  joined_at: string;
}

interface WatchParty {
  id: number;
  movie_id: number;
  title: string;
  scheduled_time: string;
  status: string;
  host: {
    id: number;
    name: string;
    username?: string | null;
    avatar_url?: string | null;
  };
  participants: WatchPartyParticipant[];
}

export default function WatchPartiesPage() {
  const { user } = useAuth();
  const [parties, setParties] = useState<WatchParty[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', movieId: '', time: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const res = await api.get<WatchParty[]>('/watch-parties/');
      setParties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const handleJoin = async (partyId: number) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    // Optimistic UI
    setParties(prev => prev.map(p => {
      if (p.id === partyId) {
        if (p.participants.some(x => x.user_id === user.id)) return p;
        return {
          ...p,
          participants: [...p.participants, { user_id: user.id, name: user.name, username: user.username, avatar_url: user.avatar_url, joined_at: new Date().toISOString() }]
        };
      }
      return p;
    }));

    try {
      await api.post(`/watch-parties/${partyId}/join`);
    } catch (err) {
      console.error(err);
      fetchParties(); // Revert on fail
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.movieId || !createForm.time) return;
    
    setIsSubmitting(true);
    try {
      await api.post('/watch-parties/', {
        movie_id: parseInt(createForm.movieId),
        title: createForm.title,
        scheduled_time: new Date(createForm.time).toISOString()
      });
      setShowCreate(false);
      setCreateForm({ title: '', movieId: '', time: '' });
      fetchParties();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 100 }}>
      {/* Glow Effects */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, rgba(56,189,248,0.03) 50%, transparent 70%)',
          filter: 'blur(120px)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      <div className="container max-w-5xl">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                <Tv size={13} /> Live Sync
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Watch <span className="text-primary">Parties</span>
            </h1>
            <p className="text-white/50 text-sm mt-2 max-w-lg">
              Join live synchronized viewing sessions with other cinephiles. Chat, react, and experience movies together in real-time.
            </p>
          </div>
          
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-105"
          >
            <Plus size={18} /> Host a Party
          </button>
        </div>

        {/* Create Party Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#111116] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowCreate(false)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                
                <h2 className="text-2xl font-bold text-white mb-6">Host a Watch Party</h2>
                
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Party Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Friday Night Interstellar"
                      value={createForm.title}
                      onChange={e => setCreateForm({...createForm, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5 block">TMDB Movie ID (mocked)</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 text-white/40" size={16} />
                      <input 
                        type="number" 
                        required
                        placeholder="e.g. 157336 for Interstellar"
                        value={createForm.movieId}
                        onChange={e => setCreateForm({...createForm, movieId: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Scheduled Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={createForm.time}
                      onChange={e => setCreateForm({...createForm, time: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-4 hover:opacity-90 transition-opacity flex justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Party'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/5 border border-white/10 h-64 rounded-3xl"></div>
            ))}
          </div>
        ) : parties.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
            <Tv size={48} className="mx-auto text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Upcoming Watch Parties</h3>
            <p className="text-white/50">Be the first to host a movie night for the community!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {parties.map(party => {
              const time = new Date(party.scheduled_time);
              const isJoined = Boolean(user && party.participants.some(p => p.user_id === user.id));
              
              return (
                <div 
                  key={party.id}
                  className="bg-[#0f0f14] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all flex flex-col group relative overflow-hidden"
                >
                  {/* Decorative backdrop glow based on ID */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors"></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <span className="bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-3 inline-block border border-green-500/20">
                        {party.status}
                      </span>
                      <h3 className="text-xl font-black text-white leading-tight mb-2">
                        {party.title}
                      </h3>
                      <Link href={`/movie/${party.movie_id}`} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                        View Movie Details <PlaySquare size={12} />
                      </Link>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-white/80 font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                        <Calendar size={14} className="text-primary" />
                        {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-white/50 text-xs font-semibold mt-2 justify-end">
                        <Clock size={12} />
                        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/10 relative z-10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">
                        Host & Attendees
                      </div>
                      <div className="flex items-center">
                        {/* Host avatar first, slightly larger */}
                        <div className="w-8 h-8 rounded-full bg-primary p-0.5 z-10 border-2 border-[#0f0f14]" title={`Host: ${party.host.name}`}>
                          {party.host.avatar_url ? (
                            <Image src={party.host.avatar_url} alt="" width={32} height={32} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <div className="w-full h-full bg-[#222] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                              {party.host.name.slice(0,2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        {/* Other participants */}
                        {party.participants.filter(p => p.user_id !== party.host.id).slice(0, 4).map((p, idx) => (
                          <div key={p.user_id} className={`w-8 h-8 rounded-full bg-white/10 border-2 border-[#0f0f14] ${idx > 0 ? '-ml-3' : '-ml-2'}`} style={{ zIndex: 9 - idx }} title={p.name}>
                            {p.avatar_url ? (
                              <Image src={p.avatar_url} alt="" width={32} height={32} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <div className="w-full h-full bg-[#333] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                {p.name.slice(0,2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {party.participants.length > 5 && (
                          <div className="w-8 h-8 rounded-full bg-white/5 border-2 border-[#0f0f14] -ml-3 z-0 flex items-center justify-center text-[10px] font-bold text-white/60">
                            +{party.participants.length - 5}
                          </div>
                        )}
                        
                        <div className="ml-3 text-xs font-bold text-white/50 flex items-center gap-1">
                          <Users size={12} /> {party.participants.length} Joined
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleJoin(party.id)}
                      disabled={isJoined}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        isJoined 
                          ? 'bg-white/5 text-white/50 border border-white/10 cursor-default' 
                          : 'bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                      }`}
                    >
                      {isJoined ? (
                        <>Joined <Check size={14} /></>
                      ) : (
                        'Join Party'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
