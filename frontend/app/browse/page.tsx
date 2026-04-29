'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Theater,
  Globe,
  Languages,
  ArrowUpRight,
  Search,
  Sparkles,
  Trophy,
  Users,
  Clapperboard
} from 'lucide-react';

const BROWSE_OPTIONS = [
  {
    id: 'category',
    title: 'Category',
    description: 'Trending, Popular & Top Rated',
    icon: LayoutGrid,
    color: '#8B5CF6',
    href: '/browse/category',
  },
  {
    id: 'genre',
    title: 'Genre',
    description: '19+ Cinematic Themes',
    icon: Theater,
    color: '#EC4899',
    href: '/browse/genre',
  },
  {
    id: 'country',
    title: 'Country',
    description: 'Global Cinema Hubs',
    icon: Globe,
    color: '#3B82F6',
    href: '/browse/country',
  },
  {
    id: 'language',
    title: 'Language',
    description: 'Multi-lingual Discovery',
    icon: Languages,
    color: '#10B981',
    href: '/browse/language',
  },
];

const SPECIAL_COLLECTIONS = [
  {
    id: 'awards',
    title: 'Award Winners',
    description: 'The highest acclaimed cinematic masterpieces.',
    icon: Trophy,
    color: '#F59E0B',
    href: '/browse/awards',
  },
  {
    id: 'anime',
    title: 'Anime',
    description: 'Legendary animation from Japanese studios.',
    icon: Sparkles,
    color: '#EC4899',
    href: '/browse/anime',
  },
  {
    id: 'family',
    title: 'Family',
    description: 'Wholesome movies for every generation.',
    icon: Users,
    color: '#10B981',
    href: '/browse/family',
  },
  {
    id: 'franchise',
    title: 'Franchises',
    description: 'Epic sagas and cinematic universes.',
    icon: Clapperboard,
    color: '#3B82F6',
    href: '/browse/franchise',
  },
];

export default function BrowsePage() {
  return (
    <div
      className="section"
      style={{
        minHeight: '100vh',
        paddingTop: 160,
        paddingBottom: 140,
        background: 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)'
      }}
    >
      <div className="container">
        {/* Header - Minimalist & Centered */}
        <header style={{ textAlign: 'center', marginBottom: 100 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 100,
              border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: 24,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-dim)',
              letterSpacing: 0.5
            }}>
              <Search size={14} /> Discovery Engine
            </div>
            <h1 style={{
              fontSize: 'clamp(40px, 8vw, 72px)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              color: 'white',
              marginBottom: 24
            }}>
              Explore <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontWeight: 400 }}>beyond</span> limits.
            </h1>
            <p style={{
              color: 'var(--text-dim)',
              fontSize: 20,
              maxWidth: 600,
              margin: '0 auto',
              lineHeight: 1.6,
              fontWeight: 400
            }}>
              A sophisticated way to find your next cinematic experience.
              Browse through curated lenses of global cinema.
            </p>
          </motion.div>
        </header>

        {/* Grid - Clean Bento Style */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          maxWidth: 1100,
          margin: '0 auto 120px'
        }}>
          {BROWSE_OPTIONS.map((opt, idx) => (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={opt.href}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '32px',
                    borderRadius: 24,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `${opt.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 20,
                      color: opt.color
                    }}>
                      <opt.icon size={20} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>
                      {opt.title}
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                      {opt.description}
                    </p>
                  </div>

                  <div style={{
                    marginTop: 32,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'white',
                    opacity: 0.5,
                    transition: 'opacity 0.3s'
                  }}>
                    Explore <ArrowUpRight size={12} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Special Collections Section */}
        <section style={{ marginBottom: 120 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 12 }}>Special Collections</h2>
            <p style={{ color: 'var(--text-dim)' }}>Hand-picked cinema curated by our editors</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
            {SPECIAL_COLLECTIONS.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={c.href} style={{ textDecoration: 'none' }}>
                  <div className="glass" style={{
                    padding: '40px',
                    borderRadius: 32,
                    height: '100%',
                    textAlign: 'center',
                    transition: 'all 0.3s',
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.01)'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.borderColor = c.color + '33';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: `${c.color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      color: c.color
                    }}>
                      <c.icon size={32} />
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 16 }}>{c.title}</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: 16, lineHeight: 1.5 }}>{c.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Minimalist CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          style={{
            textAlign: 'center',
            maxWidth: 600,
            margin: '0 auto',
            paddingTop: 80,
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--primary)" /> Smart Recommendation
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 32 }}>
            Feeling indecisive? Let our AI suggest something for your mood.
          </h2>
          <Link
            href="/mood"
            className="btn"
            style={{
              background: 'white',
              color: 'black',
              padding: '16px 36px',
              borderRadius: 100,
              fontWeight: 700,
              fontSize: 15,
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Launch Mood Finder
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
