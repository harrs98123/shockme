'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { posterUrl } from '@/lib/api';
import { FranchiseInfo, FranchiseEntry } from '@/lib/types';

interface Props {
  movieId: number;
  mediaType?: 'movie' | 'tv';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function entryHref(e: FranchiseEntry): string {
  return e.media_type === 'tv' ? `/tv/${e.movie_id}` : `/movie/${e.movie_id}`;
}

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '5px 12px',
        borderRadius: 999,
        background: color ? `${color}18` : 'rgba(255,255,255,0.06)',
        color: color || 'rgba(255,255,255,0.7)',
        border: `1px solid ${color ? `${color}44` : 'rgba(255,255,255,0.12)'}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function MiniEntry({ label, entry }: { label: string; entry: FranchiseEntry }) {
  return (
    <Link
      href={entryHref(entry)} prefetch={false}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 10,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        textDecoration: 'none',
        flex: 1,
        minWidth: 0,
      }}
    >
      <img
        src={posterUrl(entry.poster_path, 'w200')}
        alt={entry.title}
        style={{ width: 36, height: 54, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {entry.title}
        </div>
      </div>
    </Link>
  );
}

export default function WatchOrderPanel({ movieId, mediaType = 'movie' }: Props) {
  const [data, setData] = useState<FranchiseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/movies/${movieId}/franchise-info?media_type=${mediaType}`)
      .then((res) => (res.ok ? res.json() : { in_franchise: false }))
      .then((json) => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setData({ in_franchise: false } as FranchiseInfo); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [movieId, mediaType]);

  if (loading || !data?.in_franchise || !data.entry || !data.franchise) return null;

  const { franchise, entry, previous, next, requires } = data;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ margin: '2rem 0', width: '100%' }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            padding: '28px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 14, fontSize: 22, flexShrink: 0,
                background: `${franchise.color}18`, border: `1px solid ${franchise.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {franchise.icon_emoji}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
                {franchise.name}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, margin: 0 }}>
                Watch order &amp; timeline placement
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {entry.phase && <Chip label={entry.phase} color={franchise.color} />}
            {entry.saga && <Chip label={entry.saga} />}
            {entry.sub_timeline && <Chip label={entry.sub_timeline} />}
            {!entry.canon && <Chip label="Non-canon" color="#F87171" />}
            {entry.multiverse && <Chip label="🌀 Multiverse" color="#A78BFA" />}
            {entry.timeline_order != null && <Chip label={`Timeline #${entry.timeline_order}`} />}
            {entry.watch_order != null && <Chip label={`Watch #${entry.watch_order}`} />}
            {entry.watch_order == null && entry.release_order != null && (
              <Chip label={`Release #${entry.release_order}`} />
            )}
          </div>

          {requires && requires.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Watch first
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {requires.map((r) => (
                  <MiniEntry key={r.id} label="Required" entry={r} />
                ))}
              </div>
            </div>
          )}

          {(previous || next) && (
            <div style={{ display: 'flex', gap: 12 }}>
              {previous && <MiniEntry label="Previous" entry={previous} />}
              {next && <MiniEntry label="Next" entry={next} />}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
