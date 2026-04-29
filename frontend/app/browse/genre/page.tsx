'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';
import { GenreIcons } from '@/lib/genre-icons';

interface Genre {
  id: number;
  name: string;
}

export default function GenrePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies/genres')
      .then(res => {
        setGenres(res.data.genres || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch genres:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  const getGenreConfig = (name: string) => {
    const n = name.toLowerCase();

    // Helper to find icon by flexible name match
    const getIconKey = (str: string) => {
      const lowerStr = str.toLowerCase();
      if (lowerStr.includes('sci-fi') || lowerStr.includes('science fiction')) return 'Science Fiction';
      if (lowerStr.includes('action')) return 'Action';
      if (lowerStr.includes('adventure')) return 'Adventure';
      if (lowerStr.includes('animation')) return 'Animation';
      if (lowerStr.includes('comedy')) return 'Comedy';
      if (lowerStr.includes('crime')) return 'Crime';
      if (lowerStr.includes('documentary')) return 'Documentary';
      if (lowerStr.includes('drama')) return 'Drama';
      if (lowerStr.includes('family')) return 'Family';
      if (lowerStr.includes('fantasy')) return 'Fantasy';
      if (lowerStr.includes('history')) return 'History';
      if (lowerStr.includes('horror')) return 'Horror';
      if (lowerStr.includes('music')) return 'Music';
      if (lowerStr.includes('mystery')) return 'Mystery';
      if (lowerStr.includes('romance')) return 'Romance';
      if (lowerStr.includes('thriller')) return 'Thriller';
      if (lowerStr.includes('war')) return 'War';
      if (lowerStr.includes('western')) return 'Western';
      return null;
    };

    const iconKey = getIconKey(name);
    const icon = iconKey ? GenreIcons[iconKey] : GenreIcons['Action']; // Fallback

    if (n.includes('action')) return { icon, color: '#F43F5E' };
    if (n.includes('comedy')) return { icon, color: '#EC4899' };
    if (n.includes('drama')) return { icon, color: '#8B5CF6' };
    if (n.includes('horror')) return { icon, color: '#ef4444' };
    if (n.includes('romance')) return { icon, color: '#f472b6' };
    if (n.includes('sci-fi') || n.includes('science fiction')) return { icon, color: '#3B82F6' };
    if (n.includes('thriller')) return { icon, color: '#4f46e5' };
    if (n.includes('adventure')) return { icon, color: '#10B981' };
    if (n.includes('animation')) return { icon, color: '#F59E0B' };
    if (n.includes('crime')) return { icon, color: '#475569' };
    if (n.includes('documentary')) return { icon, color: '#64748b' };
    if (n.includes('family')) return { icon, color: '#fb923c' };
    if (n.includes('fantasy')) return { icon, color: '#a78bfa' };
    if (n.includes('history')) return { icon, color: '#b45309' };
    if (n.includes('music')) return { icon, color: '#ec4899' };
    if (n.includes('mystery')) return { icon, color: '#312e81' };
    if (n.includes('war')) return { icon, color: '#991b1b' };
    if (n.includes('western')) return { icon, color: '#92400e' };

    return { icon, color: '#8B5CF6' };
  };

  return (
    <div className="section container" style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 140 }}>
      <header style={{ marginBottom: 64 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 style={{ fontSize: 48, fontWeight: 800, color: 'white', marginBottom: 16 }}>Browse by Genre</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 18, maxWidth: 600 }}>
            Find the perfect mood through cinematic themes. Explore movies across 19+ unique categories.
          </p>
        </motion.div>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20
      }}>
        {genres.map((genre, idx) => {
          const config = getGenreConfig(genre.name);
          return (
            <motion.div
              key={genre.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.02 }}
            >
              <Link
                href={`/catalog/discover?with_genres=${genre.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '24px 32px',
                    borderRadius: 24,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.background = `${config.color}0a`;
                    e.currentTarget.style.borderColor = `${config.color}33`;
                    e.currentTarget.style.boxShadow = `0 12px 30px -10px ${config.color}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background: `${config.color}15`,
                    border: `1px solid ${config.color}25`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    color: config.color
                  }}>
                    <div style={{ width: 36, height: 36 }}>
                      {config.icon}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>{genre.name}</h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'var(--text-dim)',
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: 0.8
                    }}>
                      Explore <ArrowRight size={14} />
                    </div>
                  </div>

                  {/* Decorative glow */}
                  <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    background: config.color,
                    opacity: 0.05,
                    borderRadius: '50%',
                    filter: 'blur(30px)'
                  }} />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
