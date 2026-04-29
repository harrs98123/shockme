'use client';

import { motion } from 'framer-motion';
import { Genre } from '@/lib/types';

interface Props {
  genres: Genre[];
}

const GENRE_COLORS: Record<string, string> = {
  Action: '#ef4444',
  Adventure: '#f97316',
  Animation: '#3b82f6',
  Comedy: '#ffcc00',
  Crime: '#7c3aed',
  Documentary: '#10b981',
  Drama: '#8b5cf6',
  Family: '#ec4899',
  Fantasy: '#6366f1',
  History: '#92400e',
  Horror: '#1f2937',
  Music: '#f43f5e',
  Mystery: '#0ea5e9',
  Romance: '#db2777',
  'Science Fiction': '#06b6d4',
  Thriller: '#dc2626',
  War: '#451a03',
  Western: '#78350f',
};

const DEFAULT_COLOR = '#4b5563';

export default function VibeChart({ genres }: Props) {
  if (!genres || genres.length === 0) return null;

  // Simulate weights for a better visualization
  // 45, 25, 15, 10, 5... sum to 100
  const weights = [45, 25, 15, 10, 5];
  const chartData = genres.slice(0, 5).map((genre, i) => ({
    name: genre.name,
    weight: weights[i] || 5,
    color: GENRE_COLORS[genre.name] || DEFAULT_COLOR,
  }));

  // Re-normalize if needed (ensure total is 100 if we have fewer than 5)
  const totalWeight = chartData.reduce((sum, item) => sum + item.weight, 0);
  const normalizedData = chartData.map(item => ({
    ...item,
    pct: Math.round((item.weight / totalWeight) * 100),
  }));

  const cx = 100;
  const cy = 100;
  const r = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * r;

  let currentOffset = 0;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '24px',
      padding: '24px',
      width: '100%',
      maxWidth: '320px',
      marginTop: '20px'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: 700, 
        marginBottom: '20px', 
        fontFamily: 'Poppins',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        Vibe Chart
      </h3>

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {normalizedData.map((item, i) => {
            const strokeDasharray = `${(item.pct / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += (item.pct / 100) * circumference;

            return (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeDashoffset }}
                transition={{ duration: 1.5, delay: i * 0.1, ease: 'easeOut' }}
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
              />
            );
          })}
          
          {/* Central Text */}
          <foreignObject x="50" y="50" width="100" height="100">
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{normalizedData[0].name}</span>
              <span style={{ fontSize: '24px', fontWeight: 900 }}>{normalizedData[0].pct}%</span>
            </div>
          </foreignObject>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {normalizedData.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{item.name}</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
