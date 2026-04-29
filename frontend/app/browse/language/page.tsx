'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Languages,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';
import api from '@/lib/api';

interface Language {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export default function LanguagePage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/movies/languages')
      .then(res => {
        const sorted = (res.data || []).sort((a: Language, b: Language) =>
          a.english_name.localeCompare(b.english_name)
        );
        // Sometimes TMDB returns duplicates or empty names, filter them
        const filtered = sorted.filter((l: Language) => l.english_name && l.iso_639_1);
        setLanguages(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch languages:', err);
        setLoading(false);
      });
  }, []);

  const filtered = languages.filter(l =>
    l.english_name.toLowerCase().includes(search.toLowerCase()) ||
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const topLanguages = [
    { code: 'en', name: 'English', accent: '#3b82f6', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', accent: '#f59e0b', flag: '🇮🇳' },
    { code: 'ko', name: 'Korean', accent: '#ef4444', flag: '🇰🇷' },
    { code: 'ja', name: 'Japanese', accent: '#ec4899', flag: '🎌' },
    { code: 'es', name: 'Spanish', accent: '#ea580c', flag: '🇪🇸' },
    { code: 'fr', name: 'French', accent: '#2563eb', flag: '🇫🇷' },
    { code: 'it', name: 'Italian', accent: '#10b981', flag: '🇮🇹' },
    { code: 'de', name: 'German', accent: '#000000', flag: '🇩🇪' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="section container" style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 140 }}>
      <header style={{ marginBottom: 64, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 style={{ fontSize: 48, fontWeight: 800, color: 'white', marginBottom: 16 }}>Browse by Language</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 18, maxWidth: 600 }}>
            Hear the sound of cinema in every dialect. From world-class masterpieces to local favorites.
          </p>
        </motion.div>

        <div style={{ position: 'relative', width: '100%', maxWidth: 500 }}>
          <input
            type="text"
            placeholder="Search by language name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 24px',
              paddingLeft: 52,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: 16,
              outline: 'none',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              e.target.style.borderColor = 'var(--primary)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          <Languages size={20} color="var(--text-dim)" style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </header>

      {!search && (
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Award size={24} color="#f59e0b" /> Popular Dialects
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16
          }}>
            {topLanguages.map((l, idx) => (
              <motion.div
                key={l.code}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link
                  href={`/catalog/discover?with_original_language=${l.code}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="glass"
                    style={{
                      padding: 24,
                      borderRadius: 20,
                      textAlign: 'center',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      background: `linear-gradient(135deg, ${l.accent}11, transparent)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.borderColor = l.accent + '44';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{l.flag}</div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{l.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{l.code.toUpperCase()}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 32 }}>
        {search ? `Search Results (${filtered.length})` : 'All Available Languages'}
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 12
      }}>
        {filtered.map((l, idx) => (
          <motion.div
            key={l.iso_639_1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: Math.min(idx * 0.005, 0.5) }}
          >
            <Link
              href={`/catalog/discover?with_original_language=${l.iso_639_1}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>{l.english_name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{l.name}</span>
                </div>
                <div style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)' }}>
                  {l.iso_639_1.toUpperCase()}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
