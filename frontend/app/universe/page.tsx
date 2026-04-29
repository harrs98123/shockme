'use client';

import { useState, useEffect, useRef } from 'react';
import { UniverseData, UniverseNode, UniverseEdge, UniverseMovie } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

interface PersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: { title: string; id: number }[];
}

// ─── Layout: structured 2-ring positions ────────────────────────────
function calculatePositions(
  centerId: number,
  nodes: UniverseNode[],
  width: number,
  height: number
) {
  const pos = new Map<number, { x: number; y: number }>();
  const cx = width / 2;
  const cy = height / 2;
  pos.set(centerId, { x: cx, y: cy });

  const innerCount = Math.min(Math.ceil(nodes.length / 2), 10);
  const outerCount = nodes.length - innerCount;
  const r1 = Math.min(width, height) * 0.22;
  const r2 = Math.min(width, height) * 0.40;

  nodes.forEach((node, i) => {
    const isInner = i < innerCount;
    const ring = isInner ? innerCount : outerCount;
    const idx = isInner ? i : i - innerCount;
    const r = isInner ? r1 : r2;
    const angle = (2 * Math.PI * idx) / ring - Math.PI / 2;
    pos.set(node.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  });
  return pos;
}

// ─── Component ──────────────────────────────────────────────────────
export default function UniversePage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PersonResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [data, setData] = useState<UniverseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<UniverseNode | null>(null);
  const [filmFilter, setFilmFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [filmSort, setFilmSort] = useState<'popularity' | 'date' | 'rating'>('popularity');
  const [showAllFilms, setShowAllFilms] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState({ width: 900, height: 650 });
  const [nodePos, setNodePos] = useState<Map<number, { x: number; y: number }>>(new Map());

  // ─── Resize ─────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => setDims({
      width: Math.min(window.innerWidth - 48, 1100),
      height: Math.max(550, Math.min(window.innerHeight - 350, 700))
    });
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ─── Search ─────────────────────────────────────────────────
  const searchPeople = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE}/movies/universe/search/${encodeURIComponent(q)}`);
      if (res.ok) setSearchResults(await res.json());
    } catch { /* silent */ } finally { setSearching(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => searchPeople(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // ─── Load person ────────────────────────────────────────────
  const loadPerson = async (person: PersonResult) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setQuery(person.name);
    setSelectedConnection(null);
    setShowAllFilms(false);
    setFilmFilter('all');
    try {
      const res = await fetch(`${API_BASE}/movies/universe/${person.id}`);
      if (res.ok) {
        const d = await res.json();
        if (!d.center || d.error) {
          setError(d.error || `Could not generate universe for ${person.name}.`);
          setData(null);
          return;
        }
        setData(d);
        if (d.nodes.length > 0) {
          setNodePos(calculatePositions(d.center.id, d.nodes, dims.width, dims.height));
        }
      } else {
        setError(`Failed (HTTP ${res.status}).`);
        setData(null);
      }
    } catch {
      setError('Network error — is the backend running?');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Recalc on resize
  useEffect(() => {
    if (data?.center && data.nodes.length > 0)
      setNodePos(calculatePositions(data.center.id, data.nodes, dims.width, dims.height));
  }, [dims]);

  const edgeFor = (nid: number) => data?.edges.find(e => e.to === nid);

  // ─── Canvas draw ────────────────────────────────────────────
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !data || nodePos.size === 0) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, dims.width, dims.height);

    data.edges.forEach(edge => {
      const f = nodePos.get(edge.from), t = nodePos.get(edge.to);
      if (!f || !t) return;
      const hovered = hoveredNode === edge.to;
      const n = edge.movies.length;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = hovered ? '#a78bfa' : `rgba(139,92,246,${Math.min(0.08 + n * 0.06, 0.35)})`;
      ctx.lineWidth = Math.min(hovered ? 2.5 : 0.8 + n * 0.3, 3);
      ctx.stroke();
    });
  }, [data, nodePos, hoveredNode, dims]);

  const navigateTo = (node: UniverseNode) => {
    loadPerson({ id: node.id, name: node.name, profile_path: node.profile_path, known_for_department: node.type === 'director' ? 'Directing' : 'Acting', known_for: [] });
  };

  // ─── Film filtering + sorting ───────────────────────────────
  const filteredFilms = (data?.movies || [])
    .filter(m => filmFilter === 'all' || m.media_type === filmFilter)
    .sort((a, b) => {
      if (filmSort === 'date') return (b.release_date || '').localeCompare(a.release_date || '');
      if (filmSort === 'rating') return (b.vote_average || 0) - (a.vote_average || 0);
      return (b.popularity || 0) - (a.popularity || 0);
    });

  const visibleFilms = showAllFilms ? filteredFilms : filteredFilms.slice(0, 18);

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', paddingTop: 100 }}>
      {/* ═══════════════ HERO + SEARCH ═══════════════ */}
      <div style={{ textAlign: 'center', padding: '50px 24px 32px', background: 'radial-gradient(ellipse at center top, rgba(139,92,246,0.10) 0%, transparent 55%)' }}>
        <h1 style={{ fontSize: 44, fontWeight: 900, marginBottom: 10, lineHeight: 1.1 }}>
          🌐 Universe <span style={{ color: '#8b5cf6' }}>Map</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.6 }}>
          Explore every cinematic connection — all films, all collaborators, all data.
        </p>

        {/* Search */}
        <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 100 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>🔍</span>
            <input
              className="input-field"
              placeholder="Search any actor or director..."
              value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value.trim()) setSearchResults([]); }}
              style={{ fontSize: 16, padding: '16px 20px 16px 48px', borderRadius: 16, background: 'var(--surface)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            />
            {searching && (
              <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              </div>
            )}
          </div>

          {/* Dropdown */}
          {searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.6)', maxHeight: 420, overflowY: 'auto' }}>
              {searchResults.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => loadPerson(p)}
                  style={{ width: '100%', textAlign: 'left', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, borderBottom: idx < searchResults.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s', color: 'var(--text)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {p.profile_path ? (
                    <img src={`${TMDB_IMG}/w92${p.profile_path}`} alt={p.name} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--text-dim)', border: '2px solid var(--border)' }}>{p.name[0]}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: p.known_for_department === 'Directing' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)', color: p.known_for_department === 'Directing' ? '#f59e0b' : '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.5 }}>{p.known_for_department || 'Actor'}</span>
                      {p.known_for.length > 0 && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.known_for.map(k => k.title).filter(Boolean).join(', ')}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--text-dim)', flexShrink: 0 }}>→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div className="container" style={{ paddingBottom: 64 }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div className="spinner" style={{ width: 44, height: 44, margin: '0 auto 20px', borderWidth: 3 }} />
            <p style={{ color: 'var(--text-dim)', fontSize: 15, fontWeight: 500 }}>Building complete universe map...</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 8 }}>Fetching all films & collaborators concurrently</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Couldn&apos;t Generate Map</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.6 }}>{error}</p>
            <button onClick={() => { setError(null); setData(null); setQuery(''); }}
              style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', fontWeight: 700, cursor: 'pointer' }}>
              ← Try Another Search
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !data && !error && (
          <div style={{ textAlign: 'center', padding: '60px 24px 80px' }}>
            <div style={{ width: 160, height: 160, borderRadius: '50%', margin: '0 auto 28px', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(139,92,246,0.2)' }}>
              <span style={{ fontSize: 64 }}>🎬</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Search to Explore</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
              Type any actor or director name above to visualize their complete cinematic universe.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
              {[{ name: 'Christopher Nolan', id: 525 }, { name: 'Leonardo DiCaprio', id: 6193 }, { name: 'Greta Gerwig', id: 45400 }, { name: 'Denis Villeneuve', id: 137427 }].map(s => (
                <button key={s.id}
                  onClick={() => loadPerson({ id: s.id, name: s.name, profile_path: null, known_for_department: '', known_for: [] })}
                  style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ DATA LOADED ═══════════════ */}
        {!loading && data?.center && (
          <>
            {/* ── Person Info Card ─────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 32, padding: '24px 28px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,0,0,0.2))', border: '1px solid rgba(139,92,246,0.15)' }}>
              {data.center.profile_path ? (
                <img src={`${TMDB_IMG}/w185${data.center.profile_path}`} alt={data.center.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #8b5cf6', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white', flexShrink: 0 }}>{data.center.name[0]}</div>
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{data.center.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: data.center.type === 'director' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)', color: data.center.type === 'director' ? '#f59e0b' : '#3b82f6', textTransform: 'uppercase' }}>{data.center.type}</span>
                  {data.center.birthday && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Born: {data.center.birthday}</span>}
                  {data.center.place_of_birth && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>📍 {data.center.place_of_birth}</span>}
                </div>
                {data.center.biography && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{data.center.biography}</p>
                )}
              </div>
            </div>

            {/* ── Stats Bar ────────────────────────── */}
            {data.stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 36 }}>
                {[
                  { label: 'Total Films', value: data.stats.total_films, icon: '🎬' },
                  { label: 'Collaborators Found', value: data.stats.total_collaborators, icon: '👥' },
                  { label: 'Top Connections', value: data.stats.graph_connections, icon: '🔗' },
                  { label: 'Works Analyzed', value: data.stats.works_analyzed, icon: '📊' },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: '18px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#a78bfa' }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Connection Graph ─────────────────── */}
            {data.nodes.length > 0 && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  🔗 Connection Graph
                  <span style={{ fontSize: 13, background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 99, color: 'var(--text-muted)', fontWeight: 600 }}>{data.nodes.length}</span>
                </h2>
                <div style={{ position: 'relative', marginBottom: 40, background: 'radial-gradient(circle at center, rgba(139,92,246,0.04) 0%, transparent 70%)', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <canvas ref={canvasRef} width={dims.width} height={dims.height} style={{ display: 'block', margin: '0 auto' }} />

                  {/* Center node */}
                  {nodePos.has(data.center.id) && (() => {
                    const p = nodePos.get(data.center.id)!;
                    return (
                      <div style={{ position: 'absolute', left: p.x - 42, top: p.y - 42, width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', border: '3px solid #8b5cf6', boxShadow: '0 0 40px rgba(139,92,246,0.4)', zIndex: 10 }}>
                        {data.center.profile_path ? (
                          <img src={`${TMDB_IMG}/w185${data.center.profile_path}`} alt={data.center.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white' }}>{data.center.name[0]}</div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Outer nodes */}
                  {data.nodes.map(node => {
                    const p = nodePos.get(node.id);
                    if (!p) return null;
                    const edge = edgeFor(node.id);
                    const isH = hoveredNode === node.id;
                    const isSel = selectedConnection?.id === node.id;
                    const n = edge?.movies.length || 0;
                    const sz = 44 + Math.min(n * 3, 12);
                    return (
                      <div key={node.id}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => setSelectedConnection(isSel ? null : node)}
                        style={{ position: 'absolute', left: p.x - sz / 2, top: p.y - sz / 2, width: sz, height: sz, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${isSel ? '#a78bfa' : isH ? '#8b5cf6' : node.type === 'director' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', zIndex: isH || isSel ? 20 : 5, transform: isH ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.25s ease', boxShadow: isH || isSel ? '0 0 24px rgba(139,92,246,0.35)' : '0 2px 8px rgba(0,0,0,0.3)' }}>
                        {node.profile_path ? (
                          <img src={`${TMDB_IMG}/w185${node.profile_path}`} alt={node.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>{node.name[0]}</div>
                        )}
                      </div>
                    );
                  })}

                  {/* Hover tooltips */}
                  {data.nodes.map(node => {
                    const p = nodePos.get(node.id);
                    if (!p || (hoveredNode !== node.id && selectedConnection?.id !== node.id)) return null;
                    const edge = edgeFor(node.id);
                    return (
                      <div key={`tip-${node.id}`} style={{ position: 'absolute', left: p.x - 80, top: p.y + 32, width: 160, textAlign: 'center', zIndex: 30, pointerEvents: 'none', animation: 'fadeInUp 0.2s ease both' }}>
                        <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: 'white', marginBottom: 3 }}>{node.name}</div>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: node.type === 'director' ? '#f59e0b' : '#60a5fa', marginBottom: edge ? 6 : 0, letterSpacing: 0.5 }}>{node.type}</div>
                          {edge && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              <span style={{ color: '#a78bfa', fontWeight: 700 }}>{edge.movies.length}</span> shared {edge.movies.length === 1 ? 'film' : 'films'}
                              <div style={{ marginTop: 4, fontSize: 9, color: 'var(--text-dim)' }}>
                                {edge.movies.slice(0, 4).join(' · ')}{edge.movies.length > 4 && ` +${edge.movies.length - 4}`}
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: 6, fontSize: 9, color: '#8b5cf6', fontWeight: 600 }}>Click to see details →</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Connection Detail Panel ─────────── */}
            {selectedConnection && (
              <div style={{ marginBottom: 32, padding: 24, borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--border)', animation: 'fadeInUp 0.3s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {selectedConnection.profile_path ? (
                      <img src={`${TMDB_IMG}/w92${selectedConnection.profile_path}`} alt={selectedConnection.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(139,92,246,0.3)' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{selectedConnection.name[0]}</div>
                    )}
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700 }}>{data.center.name} ↔ {selectedConnection.name}</h3>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{edgeFor(selectedConnection.id)?.movies.length || 0} shared films</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => navigateTo(selectedConnection)}
                      style={{ padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', cursor: 'pointer' }}>
                      Explore {selectedConnection.name}&apos;s Universe →
                    </button>
                    <button onClick={() => setSelectedConnection(null)}
                      style={{ padding: '8px 14px', borderRadius: 10, fontSize: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {edgeFor(selectedConnection.id)?.movies.map(movie => (
                    <span key={movie} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>🎬 {movie}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── All Connections Grid ────────────── */}
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                👥 All Connections
                <span style={{ fontSize: 13, background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 99, color: 'var(--text-muted)', fontWeight: 600 }}>{data.nodes.length}</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {data.nodes
                  .map(node => ({ node, edge: edgeFor(node.id) }))
                  .sort((a, b) => (b.edge?.movies.length || 0) - (a.edge?.movies.length || 0))
                  .map(({ node, edge }) => (
                    <button key={node.id}
                      onClick={() => navigateTo(node)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, textAlign: 'left', background: hoveredNode === node.id ? 'rgba(139,92,246,0.08)' : 'var(--surface)', border: `1px solid ${hoveredNode === node.id ? 'rgba(139,92,246,0.25)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text)' }}>
                      {node.profile_path ? (
                        <img src={`${TMDB_IMG}/w92${node.profile_path}`} alt={node.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-dim)', flexShrink: 0 }}>{node.name[0]}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{node.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: node.type === 'director' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)', color: node.type === 'director' ? '#f59e0b' : '#3b82f6', fontWeight: 700, textTransform: 'uppercase' }}>{node.type}</span>
                          <span style={{ color: '#a78bfa', fontWeight: 700 }}>{edge?.movies.length || 0}</span> films
                        </div>
                      </div>
                      <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>→</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* ═══════════════ COMPLETE FILMOGRAPHY ═══════════════ */}
            {data.movies.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                    🎬 Complete Filmography
                    <span style={{ fontSize: 13, background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 99, color: 'var(--text-muted)', fontWeight: 600 }}>{filteredFilms.length}</span>
                  </h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* Filter pills */}
                    {(['all', 'movie', 'tv'] as const).map(f => (
                      <button key={f} onClick={() => setFilmFilter(f)}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: filmFilter === f ? 'rgba(139,92,246,0.15)' : 'var(--surface)', border: `1px solid ${filmFilter === f ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`, color: filmFilter === f ? '#a78bfa' : 'var(--text-dim)', textTransform: 'uppercase' }}>
                        {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV Shows'}
                      </button>
                    ))}
                    <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
                    {/* Sort pills */}
                    {(['popularity', 'date', 'rating'] as const).map(s => (
                      <button key={s} onClick={() => setFilmSort(s)}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: filmSort === s ? 'rgba(139,92,246,0.15)' : 'var(--surface)', border: `1px solid ${filmSort === s ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`, color: filmSort === s ? '#a78bfa' : 'var(--text-dim)' }}>
                        {s === 'popularity' ? '🔥 Popular' : s === 'date' ? '📅 Newest' : '⭐ Rating'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
                  {visibleFilms.map(movie => (
                    <a href={`/movie/${movie.id}`} key={`${movie.id}-${movie.media_type}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
                      <div className="card" style={{ overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                        <div style={{ position: 'relative' }}>
                          <img
                            src={movie.poster_path ? `${TMDB_IMG}/w342${movie.poster_path}` : '/no-poster.png'}
                            alt={movie.title}
                            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }}
                          />
                          {movie.media_type === 'tv' && (
                            <span style={{ position: 'absolute', top: 6, right: 6, padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 800, background: 'rgba(245,158,11,0.9)', color: 'white', textTransform: 'uppercase' }}>TV</span>
                          )}
                          {movie.vote_average > 0 && (
                            <span style={{ position: 'absolute', bottom: 6, left: 6, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: 'rgba(0,0,0,0.7)', color: '#fbbf24', backdropFilter: 'blur(4px)' }}>⭐ {movie.vote_average.toFixed(1)}</span>
                          )}
                        </div>
                        <div style={{ padding: '10px 12px' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{movie.title}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>{movie.release_date?.slice(0, 4) || 'TBA'}</p>
                            {movie.character && (
                              <p style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>as {movie.character}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Show more/less */}
                {filteredFilms.length > 18 && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <button onClick={() => setShowAllFilms(!showAllFilms)}
                      style={{ padding: '12px 32px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}>
                      {showAllFilms ? `Show Less ↑` : `Show All ${filteredFilms.length} Films ↓`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
