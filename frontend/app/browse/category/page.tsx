'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Star,
  Award,
  Clock,
  PlayCircle,
  Sparkles,
  Flag,
  ArrowRight
} from 'lucide-react';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies/categories')
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err);
        setLoading(false);
      });
  }, []);

  const getCategoryConfig = (id: string) => {
    switch (id) {
      case 'trending': return { svg: '/film-camera-svgrepo-com.svg', color: '#f43f5e' };
      case 'popular': return { svg: '/oscar-prize-statue-silhouette-svgrepo-com.svg', color: '#fbbf24' };
      case 'top-rated': return { svg: '/badge-svgrepo-com.svg', color: '#3b82f6' };
      case 'upcoming': return { svg: '/category-solid-svgrepo-com.svg', color: '#10b981' };
      case 'now-playing': return { svg: '/film-camera-svgrepo-com.svg', color: '#ef4444' };
      case 'anime': return { svg: '/anime-away-face-svgrepo-com.svg', color: '#ec4899' };
      case 'trending-indian': return { svg: '/globe-2-svgrepo-com.svg', color: '#f97316' };
      default: return { svg: '/category-solid-svgrepo-com.svg', color: '#8b5cf6' };
    }
  };

  return (
    <div className="section container" style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 140 }}>
      <header style={{ marginBottom: 64 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 style={{ fontSize: 48, fontWeight: 800, color: 'white', marginBottom: 16 }}>Browse by Category</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 18, maxWidth: 600 }}>
            Quickly jump into our curated collections of trending, popular, and upcoming cinema.
          </p>
        </motion.div>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 24
      }}>
        {categories.map((cat, idx) => {
          const config = getCategoryConfig(cat.id);
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <Link
                href={`/catalog/${cat.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="glass"
                  style={{
                    padding: 32,
                    borderRadius: 24,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.borderColor = `${config.color}33`;
                    e.currentTarget.style.background = `${config.color}0a`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
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
                    marginBottom: 8
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      backgroundColor: config.color,
                      maskImage: `url(${config.svg})`,
                      WebkitMaskImage: `url(${config.svg})`,
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain'
                    }} />
                  </div>

                  <div>
                    <h3 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>{cat.name}</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: 16, lineHeight: 1.5 }}>{cat.description}</p>
                  </div>

                  <div style={{
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: config.color,
                    fontWeight: 700,
                    fontSize: 14
                  }}>
                    View All Titles <ArrowRight size={16} />
                  </div>

                  {/* Subtle Glow */}
                  <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    background: config.color,
                    opacity: 0.04,
                    filter: 'blur(40px)',
                    borderRadius: '50%'
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
