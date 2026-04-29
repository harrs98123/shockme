'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Globe,
  MapPin,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import api from '@/lib/api';

interface Country {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

export default function CountryPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/movies/countries')
      .then(res => {
        // Sort by english_name and filter to common cinema countries first or just all
        const sorted = (res.data || []).sort((a: Country, b: Country) =>
          a.english_name.localeCompare(b.english_name)
        );
        setCountries(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch countries:', err);
        setLoading(false);
      });
  }, []);

  const filtered = countries.filter(c =>
    c.english_name.toLowerCase().includes(search.toLowerCase()) ||
    c.native_name.toLowerCase().includes(search.toLowerCase())
  );

  // Frequently browsed countries top highlight
  const topCountries = [
    { code: 'US', name: 'USA', accent: '#3b82f6', flag: '🇺🇸' },
    { code: 'IN', name: 'India', accent: '#f59e0b', flag: '🇮🇳' },
    { code: 'KR', name: 'Korea', accent: '#ef4444', flag: '🇰🇷' },
    { code: 'JP', name: 'Japan', accent: '#dc2626', flag: '🇯🇵' },
    { code: 'GB', name: 'UK', accent: '#4f46e5', flag: '🇬🇧' },
    { code: 'FR', name: 'France', accent: '#2563eb', flag: '🇫🇷' },
    { code: 'ES', name: 'Spain', accent: '#ea580c', flag: '🇪🇸' },
    { code: 'DE', name: 'Germany', accent: '#000000', flag: '🇩🇪' },
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
      {/* Header section with search */}
      <header style={{ marginBottom: 64, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 style={{ fontSize: 48, fontWeight: 800, color: 'white', marginBottom: 16 }}>Browse by Country</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 18, maxWidth: 600 }}>
            Discover cinematic gems from over 150+ countries. Experience the world through storytelling.
          </p>
        </motion.div>

        <div style={{ position: 'relative', width: '100%', maxWidth: 500 }}>
          <input
            type="text"
            placeholder="Search by country name..."
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
          <Globe size={20} color="var(--text-dim)" style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </header>

      {/* Featured Countries */}
      {!search && (
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Award size={24} color="#f59e0b" /> Top Cinema Hubs
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16
          }}>
            {topCountries.map((c, idx) => (
              <motion.div
                key={c.code}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link
                  href={`/catalog/discover?with_origin_country=${c.code}`}
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
                      background: `linear-gradient(135deg, ${c.accent}11, transparent)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.borderColor = c.accent + '66';
                      e.currentTarget.style.boxShadow = `0 10px 30px ${c.accent}11`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 16 }}>{c.flag}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{c.name}</h3>
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: c.accent, letterSpacing: 1, textTransform: 'uppercase' }}>
                      Trending Cinema
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* All Countries Grid */}
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 32 }}>
        {search ? `Search Results (${filtered.length})` : 'All Global Regions'}
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12
      }}>
        {filtered.map((country, idx) => (
          <motion.div
            key={country.iso_3166_1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: Math.min(idx * 0.01, 1) }}
          >
            <Link
              href={`/catalog/discover?with_origin_country=${country.iso_3166_1}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  padding: '16px 20px',
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
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                  <MapPin size={16} color="var(--text-dim)" />
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {country.english_name}
                  </span>
                </div>
                <ArrowRight size={14} color="rgba(255,255,255,0.2)" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-dim)' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🌍</p>
          <h3>No countries match your search</h3>
          <p>Try searching with different keywords.</p>
        </div>
      )}
    </div>
  );
}
