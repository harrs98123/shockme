'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Eye, ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { posterUrl } from '@/lib/api';

interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

interface Props {
  seasons: Season[];
}

export default function SeasonsSection({ seasons }: Props) {
  if (!seasons || seasons.length === 0) return null;

  // Filter out Specials (season 0) if desired, or keep them.
  const displaySeasons = seasons.filter(s => s.season_number > 0);

  return (
    <section style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="container" style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, margin: 0, fontFamily: 'Poppins' }}>Seasons</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}>
              <ListFilter size={16} />
              Sequence
              <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ 
                width: '36px', height: '36px', borderRadius: '50%', border: 'none', 
                background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
              }}>
                <ChevronLeft size={20} />
              </button>
              <button style={{ 
                width: '36px', height: '36px', borderRadius: '50%', border: 'none', 
                background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
              }}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '24px', 
          overflowX: 'auto', 
          paddingBottom: '20px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }} className="hide-scrollbar">
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          
          {displaySeasons.map((season, i) => {
            const year = season.air_date ? new Date(season.air_date).getFullYear() : 'TBA';
            // Random review counts to match the aesthetic requested
            const reviews = Math.floor(Math.random() * 1000) + 500;
            // Simulated watched progress (random percentage for UI demo)
            const progress = Math.floor(Math.random() * 100);

            return (
              <motion.div
                key={season.id}
                whileHover={{ y: -10 }}
                style={{
                  minWidth: '400px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '24px',
                  padding: '24px',
                  display: 'flex',
                  gap: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                {/* Watch Status Icon Overlay */}
                <div style={{ 
                  position: 'absolute', 
                  top: '20px', 
                  right: '25px', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'rgba(0,0,0,0.4)', 
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  zIndex: 2,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Eye size={16} />
                </div>

                {/* Poster */}
                <div style={{ 
                  width: '120px', 
                  height: '180px', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  flexShrink: 0,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}>
                  <Image
                    src={posterUrl(season.poster_path, 'w342')}
                    alt={season.name}
                    width={120}
                    height={180}
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 12px 0', fontFamily: 'Poppins' }}>
                    {season.name}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 8px 0', fontSize: '15px' }}>
                    {year} • {season.episode_count} Episodes
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '14px', fontWeight: 500 }}>
                    {reviews.toLocaleString()} Reviews
                  </p>
                </div>

                {/* Progress Bar (Bottom) */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '6px', 
                  background: 'rgba(255,255,255,0.05)' 
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    style={{ 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
                      boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
