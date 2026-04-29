'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getStreamingDirectLink } from '@/lib/utils';

interface Provider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

interface CountryProviders {
  link?: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
  free?: Provider[];
  ads?: Provider[];
}

interface WatchProvidersData {
  results?: Record<string, CountryProviders>;
}

interface Props {
  movieId: number;
  mediaType?: 'movie' | 'tv';
  watchProviders?: WatchProvidersData | null;
  minimal?: boolean;
  title: string;
}

const LOGO_BASE = 'https://image.tmdb.org/t/p/w92';
const PRIORITY_COUNTRIES = ['IN', 'US', 'GB', 'CA', 'AU'];

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  flatrate: { label: 'Stream', color: '#10b981' },
  free: { label: 'Free', color: '#f59e0b' },
  ads: { label: 'Ads', color: '#6366f1' },
  rent: { label: 'Rent', color: '#3b82f6' },
  buy: { label: 'Buy', color: '#8b5cf6' },
};

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'USA', GB: 'UK', CA: 'Canada', AU: 'Australia',
};

export default function WhereToWatch({ movieId, mediaType = 'movie', watchProviders, minimal = false, title }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string>('IN');
  const [showAll, setShowAll] = useState(false);

  const allCountries = watchProviders?.results ? Object.keys(watchProviders.results) : [];
  const sortedCountries = [
    ...PRIORITY_COUNTRIES.filter(c => allCountries.includes(c)),
    ...allCountries.filter(c => !PRIORITY_COUNTRIES.includes(c)).sort(),
  ].slice(0, 10);

  useEffect(() => {
    if (sortedCountries.length > 0 && !sortedCountries.includes(selectedCountry)) {
      setSelectedCountry(sortedCountries[0]);
    }
  }, [sortedCountries, selectedCountry]);

  if (!watchProviders?.results || allCountries.length === 0) return null;

  const countryData = watchProviders.results[selectedCountry];
  if (!countryData) return null;

  // Flatten providers for a truly minimal view if requested
  const categories = [
    { key: 'flatrate', label: 'Stream', color: '#10b981' },
    { key: 'free', label: 'Free', color: '#f59e0b' },
    { key: 'ads', label: 'Ads', color: '#6366f1' },
    { key: 'rent', label: 'Rent', color: '#3b82f6' },
    { key: 'buy', label: 'Buy', color: '#8b5cf6' },
  ] as const;

  const hasAny = categories.some(cat => (countryData[cat.key as keyof CountryProviders] as Provider[])?.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 18px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Where to Watch
          </span>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px' }}>
            {sortedCountries.slice(0, 4).map(code => (
              <button
                key={code}
                onClick={() => { setSelectedCountry(code); setShowAll(false); }}
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: 9,
                  fontWeight: 900,
                  background: selectedCountry === code ? '#fff' : 'transparent',
                  color: selectedCountry === code ? '#000' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
        {countryData.link && (
          <a href={countryData.link} target="_blank" rel="noopener" style={{ fontSize: 10, color: '#10b981', textDecoration: 'none', fontWeight: 700, opacity: 0.8 }}>
            JUSTWATCH ↗
          </a>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {hasAny ? (
          categories.map(cat => {
            const providers = (countryData[cat.key as keyof CountryProviders] as Provider[]) || [];
            if (providers.length === 0) return null;

            return (
              <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ 
                  fontSize: 9, 
                  fontWeight: 900, 
                  color: cat.color, 
                  textTransform: 'uppercase', 
                  opacity: 0.8,
                  background: `${cat.color}15`,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${cat.color}30`
                }}>
                  {cat.label}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {providers.slice(0, 3).map((p, i) => (
                    <a
                      key={`${p.provider_id}-${i}`}
                      href={getStreamingDirectLink(p.provider_name, title, countryData.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.15, y: -2 }}
                        title={p.provider_name}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid rgba(255,255,255,0.1)',
                          position: 'relative',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        <Image
                          src={`${LOGO_BASE}${p.logo_path}`}
                          alt={p.provider_name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </motion.div>
                    </a>
                  ))}
                  {providers.length > 3 && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', alignSelf: 'center', fontWeight: 600 }}>
                      +{providers.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '4px 0' }}>
            Not available in {selectedCountry}
          </span>
        )}
      </div>
    </motion.div>
  );
}

