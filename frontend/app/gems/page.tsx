'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { posterUrl } from '@/lib/api';
import { HiddenGem, UserBadge } from '@/lib/types';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function GemsPage() {
  const { user } = useAuth();
  const [gems, setGems] = useState<HiddenGem[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchGems();
    if (user) fetchBadges();
  }, [page, user]);

  const fetchGems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hidden-gems?page=${page}`);
      if (res.ok) setGems(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const res = await api.get('/hidden-gems/badges');
      setBadges(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const rarityConfig = {
    legendary: { label: 'Legendary', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.4)', icon: '👑', glow: '0 0 20px rgba(245,158,11,0.35)' },
    rare: { label: 'Rare', color: '#a78bfa', bg: 'rgba(139,92,246,0.18)', border: 'rgba(139,92,246,0.4)', icon: '💎', glow: '0 0 20px rgba(139,92,246,0.35)' },
    common: { label: 'Common', color: '#60a5fa', bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.4)', icon: '✨', glow: '0 0 20px rgba(59,130,246,0.35)' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');

        .gems-root {
          min-height: 100vh;
          background: #0a0a0f;
          font-family: 'DM Sans', sans-serif;
          padding-top: 80px;
        }

        /* ── HERO ── */
        .gems-hero {
          position: relative;
          text-align: center;
          padding: 80px 24px 64px;
          overflow: hidden;
        }
        .gems-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 70% at 50% 0%, rgba(139,92,246,0.13) 0%, transparent 65%);
          pointer-events: none;
        }
        .gems-hero::after {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 120px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139,92,246,0.7), transparent);
        }
        .gems-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(167,139,250,0.7);
          margin-bottom: 22px;
          padding: 5px 14px;
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 99px;
          background: rgba(139,92,246,0.06);
        }
        .gems-hero-eyebrow-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #a78bfa;
          box-shadow: 0 0 8px rgba(167,139,250,0.8);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        .gems-hero h1 {
          font-size: clamp(38px, 5.5vw, 68px);
          font-weight: 700;
          letter-spacing: -2px;
          line-height: 1.05;
          margin-bottom: 18px;
          color: #fff;
        }
        .gems-hero h1 em {
          font-style: normal;
          background: linear-gradient(120deg, #c4b5fd 0%, #a78bfa 40%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gems-hero-divider {
          width: 36px;
          height: 2px;
          background: linear-gradient(90deg, #a78bfa, #7c3aed);
          border-radius: 2px;
          margin: 0 auto 18px;
          opacity: 0.7;
        }
        .gems-hero p {
          color: rgba(255,255,255,0.38);
          font-size: 15px;
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.75;
          font-weight: 400;
          letter-spacing: 0.1px;
        }

        /* ── BADGES ── */
        .gems-badges {
          max-width: 1400px;
          margin: 0 auto 48px;
          padding: 0 24px;
        }
        .gems-badges-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .gems-badges-count {
          background: rgba(139,92,246,0.2);
          color: #a78bfa;
          padding: 2px 10px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
        }
        .badge-chip {
          padding: 8px 16px;
          border-radius: 10px;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.25);
          font-size: 12px;
          font-weight: 700;
          color: #a78bfa;
          letter-spacing: 0.5px;
          transition: background 0.2s, border-color 0.2s;
        }
        .badge-chip:hover {
          background: rgba(139,92,246,0.2);
          border-color: rgba(139,92,246,0.5);
        }

        /* ── GRID ── */
        .gems-grid {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 28px 80px;
          columns: 5 220px;
          column-gap: 20px;
        }

        /* ── CARD ── */
        .gem-card-wrap {
          break-inside: avoid;
          margin-bottom: 20px;
          display: block;
          text-decoration: none;
        }
        .gem-card {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          background: #111118;
          display: block;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .gem-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
        }

        /* Desktop hover only */
        @media (hover: hover) and (pointer: fine) {
          .gem-card:hover {
            transform: translateY(-8px) scale(1.03);
            z-index: 10;
          }
          .gem-card:hover img {
            transform: scale(1.08);
          }
          .gem-card:hover .gem-overlay {
            opacity: 1;
          }
          .gem-card:hover .gem-overlay-content {
            transform: translateY(0);
            opacity: 1;
          }
          .gem-card:hover .gem-rarity-badge {
            opacity: 0;
          }
        }

        /* Overlay (hover reveal) */
        .gem-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,0,0,0.97) 0%,
            rgba(0,0,0,0.75) 40%,
            rgba(0,0,0,0.2) 70%,
            transparent 100%
          );
          opacity: 0;
          transition: opacity 0.35s ease;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px 16px;
        }
        .gem-overlay-content {
          transform: translateY(14px);
          opacity: 0;
          transition: transform 0.35s cubic-bezier(0.34,1.2,0.64,1) 0.05s, opacity 0.3s ease 0.05s;
        }
        .gem-overlay-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 1.5px;
          color: #fff;
          line-height: 1.1;
          margin-bottom: 8px;
        }
        .gem-overlay-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 10px;
        }
        .gem-overlay-rating {
          background: rgba(245,158,11,0.2);
          border: 1px solid rgba(245,158,11,0.4);
          color: #fbbf24;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 12px;
        }
        .gem-overlay-desc {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Always-visible badges */
        .gem-score-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 5px 10px;
          border-radius: 8px;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 800;
          z-index: 2;
          transition: opacity 0.2s;
        }
        .gem-rarity-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 2;
          transition: opacity 0.25s;
        }
        .rarity-chip {
          padding: 3px 9px;
          border-radius: 7px;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          align-self: flex-start;
        }
        .admin-chip {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #000;
          padding: 3px 9px;
          border-radius: 7px;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 14px rgba(255,215,0,0.3);
          align-self: flex-start;
        }

        /* Always-on bottom gradient for non-hover context */
        .gem-bottom-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 55%;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
          pointer-events: none;
        }

        /* Mobile bottom title (always visible on mobile) */
        .gem-mobile-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 14px 12px 12px;
          z-index: 2;
        }
        .gem-mobile-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 17px;
          letter-spacing: 1px;
          color: #fff;
          line-height: 1.1;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .gem-mobile-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.55);
          display: flex;
          gap: 8px;
        }

        /* On desktop, hide mobile info since hover overlay handles it */
        @media (hover: hover) and (pointer: fine) {
          .gem-mobile-info {
            display: none;
          }
        }

        /* ── SKELETON ── */
        .gem-skeleton {
          border-radius: 14px;
          background: linear-gradient(110deg, #1a1a24 25%, #232330 50%, #1a1a24 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite linear;
          break-inside: avoid;
          margin-bottom: 16px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── PAGINATION ── */
        .gems-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 14px;
          padding-bottom: 80px;
        }
        .page-btn {
          padding: 11px 28px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.75);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
          letter-spacing: 0.3px;
        }
        .page-btn:hover:not(:disabled) {
          background: rgba(139,92,246,0.15);
          border-color: rgba(139,92,246,0.4);
          color: #a78bfa;
        }
        .page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .page-num {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1200px) {
          .gems-grid { columns: 4 200px; }
        }
        @media (max-width: 900px) {
          .gems-grid { columns: 3 160px; column-gap: 14px; padding: 0 16px 60px; }
          .gem-card-wrap { margin-bottom: 14px; }
        }
        @media (max-width: 600px) {
          .gems-grid { columns: 2 140px; column-gap: 12px; padding: 0 14px 48px; }
          .gem-card-wrap { margin-bottom: 12px; }
        }
      `}</style>

      <div className="gems-root">
        {/* HERO */}
        <div className="gems-hero">
          <div className="gems-hero-eyebrow">
            <span className="gems-hero-eyebrow-dot" />
            Curated Collection
          </div>
          <h1>Hidden <em>Gems</em></h1>
          <div className="gems-hero-divider" />
          <p>
            Critically acclaimed films that fly under the radar.
            High ratings, low viewcount — cinema's best kept secrets.
          </p>
        </div>

        {/* BADGES */}
        {badges.length > 0 && (
          <div className="gems-badges">
            <div className="gems-badges-title">
              🏆 Your Gem Hunter Badges
              <span className="gems-badges-count">{badges.length}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {badges.map(badge => (
                <div key={badge.id} className="badge-chip">{badge.badge_name}</div>
              ))}
            </div>
          </div>
        )}

        {/* GRID */}
        {loading ? (
          <div className="gems-grid">
            {[320, 440, 380, 460, 340, 420, 360, 480, 310, 450, 390, 430].map((h, i) => (
              <div key={i} className="gem-skeleton" style={{ height: h }} />
            ))}
          </div>
        ) : (
          <div className="gems-grid">
            {gems.map((gem, idx) => {
              const rarity = rarityConfig[gem.rarity as keyof typeof rarityConfig] || rarityConfig.common;
              return (
                <Link href={`/movie/${gem.id}`} key={gem.id} className="gem-card-wrap">
                  <div
                    className="gem-card"
                    style={{
                      boxShadow: `0 4px 24px rgba(0,0,0,0.6)`,
                      animation: `fadeInUp 0.5s ease ${idx * 0.04}s both`
                    }}
                  >
                    {/* Poster image */}
                    <img
                      src={posterUrl(gem.poster_path)}
                      alt={gem.title}
                      loading="lazy"
                    />

                    {/* Bottom gradient */}
                    <div className="gem-bottom-gradient" />

                    {/* Score badge (top right) */}
                    <div
                      className="gem-score-badge"
                      style={{ border: `1px solid ${rarity.border}`, boxShadow: rarity.glow }}
                    >
                      <span style={{ fontSize: 12 }}>{rarity.icon}</span>
                      <span style={{ color: rarity.color }}>{gem.gem_score}</span>
                    </div>

                    {/* Rarity & Admin badges (top left) */}
                    <div className="gem-rarity-badge">
                      {gem.is_admin_curated && (
                        <div className="admin-chip">✨ CineMatch</div>
                      )}
                      <div
                        className="rarity-chip"
                        style={{
                          background: rarity.bg,
                          border: `1px solid ${rarity.border}`,
                          color: rarity.color,
                        }}
                      >
                        {rarity.label}
                      </div>
                    </div>

                    {/* Hover overlay (desktop only via CSS) */}
                    <div className="gem-overlay">
                      <div className="gem-overlay-content">
                        <div className="gem-overlay-title">{gem.title}</div>
                        <div className="gem-overlay-meta">
                          <span className="gem-overlay-rating">⭐ {gem.vote_average.toFixed(1)}</span>
                          <span>{gem.vote_count?.toLocaleString()} votes</span>
                          {gem.release_date && <span>{gem.release_date.slice(0, 4)}</span>}
                        </div>
                        {gem.overview && (
                          <p className="gem-overlay-desc">{gem.overview}</p>
                        )}
                      </div>
                    </div>

                    {/* Mobile always-visible info */}
                    <div className="gem-mobile-info">
                      <div className="gem-mobile-title">{gem.title}</div>
                      <div className="gem-mobile-meta">
                        <span>⭐ {gem.vote_average.toFixed(1)}</span>
                        {gem.release_date && <span>{gem.release_date.slice(0, 4)}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && (
          <div className="gems-pagination">
            <button
              className="page-btn"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              ← Previous
            </button>
            <span className="page-num">Page {page}</span>
            <button
              className="page-btn"
              onClick={() => setPage(page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}