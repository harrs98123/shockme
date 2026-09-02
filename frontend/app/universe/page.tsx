'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { UniverseData, UniverseNode, UniverseEdge, UniverseMovie } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Film, Users, Link2, BarChart3, ChevronRight, X, ArrowUpRight } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

interface PersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: { title: string; id: number }[];
}

// ─── Layout: structured concentric orbital rings ────────────────────────────
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

  if (nodes.length === 0) return { pos, r1: 0, r2: 0 };

  const isCompact = width < 640;
  const minDim = Math.min(width, height);
  const r1 = minDim * (isCompact ? 0.24 : 0.22);
  const r2 = minDim * (isCompact ? 0.42 : 0.39);

  if (nodes.length <= 8) {
    const r = (r1 + r2) / 2;
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      pos.set(node.id, {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      });
    });
  } else {
    const innerCount = Math.min(Math.ceil(nodes.length * 0.36), isCompact ? 6 : 8);
    const outerCount = nodes.length - innerCount;

    nodes.forEach((node, i) => {
      const isInner = i < innerCount;
      const ringTotal = isInner ? innerCount : outerCount;
      const idx = isInner ? i : i - innerCount;
      const r = isInner ? r1 : r2;
      const angleOffset = isInner ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / ringTotal;
      const angle = (2 * Math.PI * idx) / ringTotal + angleOffset;

      pos.set(node.id, {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      });
    });
  }

  return { pos, r1, r2 };
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

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState({ width: 900, height: 620 });
  const [nodePos, setNodePos] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [orbitRadii, setOrbitRadii] = useState({ r1: 0, r2: 0 });

  // ─── Resize listener dynamically measuring container ───────────────
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      const h = window.innerWidth < 640 ? 460 : window.innerWidth < 1024 ? 540 : 620;
      setDims({ width: w, height: h });
    } else {
      const w = Math.min(window.innerWidth - 48, 1100);
      const h = window.innerWidth < 640 ? 460 : window.innerWidth < 1024 ? 540 : 620;
      setDims({ width: w, height: h });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // Recalculate node positions when dimensions or data change
  useEffect(() => {
    if (data?.center && data.nodes.length > 0) {
      const { pos, r1, r2 } = calculatePositions(
        data.center.id,
        data.nodes,
        dims.width,
        dims.height
      );
      setNodePos(pos);
      setOrbitRadii({ r1, r2 });
    }
  }, [dims, data]);

  // ─── Search ─────────────────────────────────────────────────
  const searchPeople = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE}/movies/universe/search/${encodeURIComponent(q)}`);
      if (res.ok) setSearchResults(await res.json());
    } catch {
      /* silent */
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => searchPeople(query), 300);
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
          const { pos, r1, r2 } = calculatePositions(
            d.center.id,
            d.nodes,
            dims.width,
            dims.height
          );
          setNodePos(pos);
          setOrbitRadii({ r1, r2 });
        }
      } else {
        setError(`Failed (HTTP ${res.status}).`);
        setData(null);
      }
    } catch {
      setError('Network error — is the backend server running?');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const edgeFor = (nid: number) => data?.edges.find((e) => e.to === nid);

  // ─── Canvas Draw: Orbital Rings & Constellation Lines ───────────────
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !data || nodePos.size === 0) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const { width, height } = dims;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Draw Subtle Orbital Background Glow
    const bgGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.48);
    bgGlow.addColorStop(0, 'rgba(139, 92, 246, 0.10)');
    bgGlow.addColorStop(0.5, 'rgba(0, 229, 153, 0.03)');
    bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, width, height);

    // Draw Dashed Orbit Circles
    if (orbitRadii.r1 > 0 && orbitRadii.r2 > 0) {
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;

      // Inner Orbit
      ctx.beginPath();
      ctx.arc(cx, cy, orbitRadii.r1, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Orbit
      ctx.beginPath();
      ctx.arc(cx, cy, orbitRadii.r2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]); // Reset dash
    }

    // Draw Edge Connection Lines
    data.edges.forEach((edge) => {
      const f = nodePos.get(edge.from);
      const t = nodePos.get(edge.to);
      if (!f || !t) return;

      const isHovered = hoveredNode === edge.to;
      const isSelected = selectedConnection?.id === edge.to;
      const sharedCount = edge.movies.length;

      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(t.x, t.y);

      if (isHovered || isSelected) {
        ctx.strokeStyle = isSelected ? '#00E599' : '#a78bfa';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = isSelected ? 'rgba(0, 229, 153, 0.8)' : 'rgba(167, 139, 250, 0.8)';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      } else {
        const opacity = Math.min(0.12 + sharedCount * 0.05, 0.4);
        ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
        ctx.lineWidth = Math.min(0.8 + sharedCount * 0.3, 2.2);
        ctx.stroke();
      }
    });
  }, [data, nodePos, hoveredNode, selectedConnection, dims, orbitRadii]);

  const navigateTo = (node: UniverseNode) => {
    loadPerson({
      id: node.id,
      name: node.name,
      profile_path: node.profile_path,
      known_for_department: node.type === 'director' ? 'Directing' : 'Acting',
      known_for: [],
    });
  };

  // ─── Film Filtering + Sorting ───────────────────────────────
  const filteredFilms = (data?.movies || [])
    .filter((m) => filmFilter === 'all' || m.media_type === filmFilter)
    .sort((a, b) => {
      if (filmSort === 'date') return (b.release_date || '').localeCompare(a.release_date || '');
      if (filmSort === 'rating') return (b.vote_average || 0) - (a.vote_average || 0);
      return (b.popularity || 0) - (a.popularity || 0);
    });

  const visibleFilms = showAllFilms ? filteredFilms : filteredFilms.slice(0, 18);

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* ═══════════════ HERO + SEARCH ═══════════════ */}
      <div className="text-center px-4 pt-8 pb-10 bg-[radial-gradient(ellipse_at_center_top,_rgba(139,92,246,0.12)_0%,_transparent_60%)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-xs font-semibold text-purple-300 mb-4">
          <Sparkles size={13} className="text-purple-400" />
          <span>Cinematic Relationship Cosmos</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
          Universe <span className="text-[#00E599]">Explorer</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto mb-8 leading-relaxed">
          Map all director-actor collaborations, co-stars, shared filmographies, and cinematic networks.
        </p>

        {/* Search Input */}
        <div className="max-w-lg mx-auto relative z-40">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              className="w-full bg-[#141419] border border-white/10 focus:border-[#00E599]/60 rounded-2xl py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-neutral-500 shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all outline-none"
              placeholder="Search any actor, actress, or director..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value.trim()) setSearchResults([]);
              }}
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#121217] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] max-h-80 overflow-y-auto text-left z-50">
              {searchResults.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => loadPerson(p)}
                  className={`w-full text-left p-3.5 flex items-center gap-3.5 hover:bg-white/[0.06] transition-colors ${
                    idx < searchResults.length - 1 ? 'border-b border-white/[0.06]' : ''
                  }`}
                >
                  {p.profile_path ? (
                    <img
                      src={`${TMDB_IMG}/w92${p.profile_path}`}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-400 flex-shrink-0">
                      {p.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white truncate">{p.name}</div>
                    <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-purple-300">
                        {p.known_for_department || 'Actor'}
                      </span>
                      {p.known_for?.length > 0 && (
                        <span className="truncate text-neutral-500 text-[11px]">
                          {p.known_for.map((k) => k.title).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ CONTENT CONTAINER ═══════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-3 border-[#00E599] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-300 font-semibold text-base">Building Cinematic Universe Map...</p>
            <p className="text-neutral-500 text-xs mt-1">Analyzing filmography & collaborators in real time</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-16 px-4">
            <div className="text-5xl mb-3">⚠️</div>
            <h2 className="text-xl font-bold mb-2 text-white">Couldn&apos;t Generate Map</h2>
            <p className="text-neutral-400 text-sm max-w-md mx-auto mb-5 leading-relaxed">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setData(null);
                setQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold text-xs hover:bg-purple-500/20 transition-all"
            >
              ← Try Another Search
            </button>
          </div>
        )}

        {/* Initial Empty State */}
        {!loading && !data && !error && (
          <div className="text-center py-12 sm:py-16">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto mb-6 bg-gradient-to-tr from-purple-600/20 to-emerald-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
              <span className="text-4xl">🎬</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Search to Explore Universes</h2>
            <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
              Pick a featured creator below or search anyone above to reveal their orbit of collaborators.
            </p>
            <div className="flex flex-wrap gap-2.5 justify-center max-w-lg mx-auto">
              {[
                { name: 'Christopher Nolan', id: 525 },
                { name: 'Leonardo DiCaprio', id: 6193 },
                { name: 'Quentin Tarantino', id: 138 },
                { name: 'Margot Robbie', id: 234352 },
                { name: 'Denis Villeneuve', id: 137427 },
                { name: 'Greta Gerwig', id: 45400 },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() =>
                    loadPerson({
                      id: s.id,
                      name: s.name,
                      profile_path: null,
                      known_for_department: '',
                      known_for: [],
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-neutral-300 hover:border-[#00E599]/40 hover:bg-[#00E599]/10 hover:text-white transition-all active:scale-95"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ DATA LOADED ═══════════════ */}
        {!loading && data?.center && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* ── Person Header Bio Card ─────────────────── */}
            <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-r from-purple-950/20 via-[#101015] to-[#0d0d12] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {data.center.profile_path ? (
                <img
                  src={`${TMDB_IMG}/w185${data.center.profile_path}`}
                  alt={data.center.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-purple-500/50 shadow-[0_0_24px_rgba(139,92,246,0.3)] flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-purple-600/30 flex items-center justify-center text-3xl font-black text-white border border-purple-500/30 flex-shrink-0">
                  {data.center.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{data.center.name}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {data.center.type}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap mb-2.5">
                  {data.center.birthday && <span>Born: {data.center.birthday}</span>}
                  {data.center.place_of_birth && <span>📍 {data.center.place_of_birth}</span>}
                </div>
                {data.center.biography && (
                  <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 leading-relaxed">
                    {data.center.biography}
                  </p>
                )}
              </div>
            </div>

            {/* ── Stats Bar ────────────────────────── */}
            {data.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Films', value: data.stats.total_films, icon: Film, color: '#38bdf8' },
                  { label: 'Collaborators', value: data.stats.total_collaborators, icon: Users, color: '#a78bfa' },
                  { label: 'Network Links', value: data.stats.graph_connections, icon: Link2, color: '#00E599' },
                  { label: 'Works Analyzed', value: data.stats.works_analyzed, icon: BarChart3, color: '#f59e0b' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center"
                  >
                    <stat.icon size={18} className="mx-auto mb-1.5" style={{ color: stat.color }} />
                    <div className="text-2xl font-black text-white">{stat.value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Connection Graph Canvas Container ─────────────────── */}
            {data.nodes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-[#00E599]" />
                    <span>Orbital Constellation</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400 font-mono">
                      {data.nodes.length} nodes
                    </span>
                  </h3>
                  <span className="text-xs text-neutral-500">Hover or tap any avatar to inspect</span>
                </div>

                <div
                  ref={containerRef}
                  style={{ height: dims.height }}
                  className="relative w-full rounded-3xl bg-[#0a0712] border border-white/10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                >
                  {/* Canvas for perfectly registered orbital lines & tracks */}
                  <canvas
                    ref={canvasRef}
                    width={dims.width}
                    height={dims.height}
                    className="absolute inset-0 w-full h-full block pointer-events-none"
                  />

                  {/* Central Node Avatar (Strictly centered at cx, cy) */}
                  {nodePos.has(data.center.id) && (() => {
                    const p = nodePos.get(data.center.id)!;
                    const centerSize = dims.width < 640 ? 64 : 76;
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: p.x - centerSize / 2,
                          top: p.y - centerSize / 2,
                          width: centerSize,
                          height: centerSize,
                          zIndex: 25,
                        }}
                        className="rounded-full overflow-hidden border-2 sm:border-3 border-[#00E599] shadow-[0_0_35px_rgba(0,229,153,0.45)] bg-[#121218] flex items-center justify-center transition-transform"
                      >
                        {data.center.profile_path ? (
                          <img
                            src={`${TMDB_IMG}/w185${data.center.profile_path}`}
                            alt={data.center.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-600 flex items-center justify-center text-xl sm:text-2xl font-black text-white">
                            {data.center.name[0]}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Satellite Outer Nodes */}
                  {data.nodes.map((node) => {
                    const p = nodePos.get(node.id);
                    if (!p) return null;

                    const edge = edgeFor(node.id);
                    const isHovered = hoveredNode === node.id;
                    const isSelected = selectedConnection?.id === node.id;
                    const sharedCount = edge?.movies.length || 0;

                    const isMobile = dims.width < 640;
                    const baseSize = isMobile ? 38 : 46;
                    const sz = baseSize + Math.min(sharedCount * 2, 8);

                    return (
                      <div
                        key={node.id}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => setSelectedConnection(isSelected ? null : node)}
                        style={{
                          position: 'absolute',
                          left: p.x - sz / 2,
                          top: p.y - sz / 2,
                          width: sz,
                          height: sz,
                          zIndex: isHovered || isSelected ? 30 : 15,
                          transform: isHovered ? 'scale(1.18)' : isSelected ? 'scale(1.12)' : 'scale(1)',
                          boxShadow: isSelected
                            ? '0 0 20px rgba(0,229,153,0.6)'
                            : isHovered
                              ? '0 0 20px rgba(167,139,250,0.6)'
                              : '0 4px 12px rgba(0,0,0,0.5)',
                        }}
                        className={`rounded-full overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
                          isSelected
                            ? 'border-[#00E599]'
                            : isHovered
                              ? 'border-purple-400'
                              : node.type === 'director'
                                ? 'border-amber-500/60'
                                : 'border-white/20'
                        } bg-[#181820]`}
                      >
                        {node.profile_path ? (
                          <img
                            src={`${TMDB_IMG}/w185${node.profile_path}`}
                            alt={node.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                            {node.name[0]}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Tooltips on Node Hover */}
                  {data.nodes.map((node) => {
                    const p = nodePos.get(node.id);
                    if (!p || (hoveredNode !== node.id && selectedConnection?.id !== node.id)) return null;
                    const edge = edgeFor(node.id);

                    return (
                      <div
                        key={`tip-${node.id}`}
                        style={{
                          position: 'absolute',
                          left: Math.max(10, Math.min(dims.width - 170, p.x - 75)),
                          top: p.y > dims.height - 100 ? p.y - 85 : p.y + 30,
                          width: 150,
                          zIndex: 40,
                          pointerEvents: 'none',
                        }}
                        className="animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="p-2.5 rounded-xl bg-[#0e0e14]/95 backdrop-blur-md border border-purple-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-center">
                          <div className="font-bold text-xs text-white truncate">{node.name}</div>
                          <div className="text-[9px] font-semibold uppercase tracking-wider text-purple-300 mt-0.5">
                            {node.type}
                          </div>
                          {edge && (
                            <div className="text-[10px] text-neutral-400 mt-1">
                              <span className="font-bold text-[#00E599]">{edge.movies.length}</span> shared {edge.movies.length === 1 ? 'film' : 'films'}
                            </div>
                          )}
                          <div className="text-[9px] text-purple-400 font-medium mt-1">
                            Tap to inspect
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Selected Connection Inspector Card ─────────── */}
            <AnimatePresence>
              {selectedConnection && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5 rounded-2xl bg-[#14141c] border border-[#00E599]/30 shadow-[0_10px_40px_rgba(0,229,153,0.1)]"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      {selectedConnection.profile_path ? (
                        <img
                          src={`${TMDB_IMG}/w92${selectedConnection.profile_path}`}
                          alt={selectedConnection.name}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-white">
                          {selectedConnection.name[0]}
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-bold text-white">
                          {data.center.name} & {selectedConnection.name}
                        </h4>
                        <p className="text-xs text-[#00E599] font-medium">
                          {edgeFor(selectedConnection.id)?.movies.length || 0} Collaborative Projects
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigateTo(selectedConnection)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00E599]/15 border border-[#00E599]/30 text-xs font-semibold text-[#00E599] hover:bg-[#00E599]/25 transition-all"
                      >
                        <span>Explore {selectedConnection.name}&apos;s Universe</span>
                        <ArrowUpRight size={14} />
                      </button>
                      <button
                        onClick={() => setSelectedConnection(null)}
                        className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {edgeFor(selectedConnection.id)?.movies.map((movie) => (
                      <span
                        key={movie}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-medium text-neutral-300"
                      >
                        🎬 {movie}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── All Collaborators List ────────────── */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={16} className="text-purple-400" />
                <span>All Collaborators</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400 font-mono">
                  {data.nodes.length}
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {data.nodes
                  .map((node) => ({ node, edge: edgeFor(node.id) }))
                  .sort((a, b) => (b.edge?.movies.length || 0) - (a.edge?.movies.length || 0))
                  .map(({ node, edge }) => (
                    <button
                      key={node.id}
                      onClick={() => navigateTo(node)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className={`p-3 rounded-xl flex items-center gap-3 text-left transition-all ${
                        hoveredNode === node.id
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                      } border`}
                    >
                      {node.profile_path ? (
                        <img
                          src={`${TMDB_IMG}/w92${node.profile_path}`}
                          alt={node.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-400 flex-shrink-0">
                          {node.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{node.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                          <span
                            className={`font-semibold uppercase ${
                              node.type === 'director' ? 'text-amber-400' : 'text-purple-300'
                            }`}
                          >
                            {node.type}
                          </span>
                          <span>•</span>
                          <span className="text-[#00E599] font-bold">{edge?.movies.length || 0} films</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-neutral-500" />
                    </button>
                  ))}
              </div>
            </div>

            {/* ═══════════════ COMPLETE FILMOGRAPHY ═══════════════ */}
            {data.movies.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Film size={16} className="text-emerald-400" />
                    <span>Complete Filmography</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400 font-mono">
                      {filteredFilms.length}
                    </span>
                  </h3>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Media Type Filter */}
                    <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                      {(['all', 'movie', 'tv'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilmFilter(f)}
                          className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] transition-colors ${
                            filmFilter === f
                              ? 'bg-purple-600 text-white'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV'}
                        </button>
                      ))}
                    </div>

                    {/* Sort Filter */}
                    <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                      {(['popularity', 'date', 'rating'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilmSort(s)}
                          className={`px-2.5 py-1 rounded-lg font-semibold text-[10px] transition-colors ${
                            filmSort === s
                              ? 'bg-[#00E599]/20 text-[#00E599]'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {s === 'popularity' ? 'Popular' : s === 'date' ? 'Date' : 'Rating'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {visibleFilms.map((movie) => (
                    <a
                      href={`/movie/${movie.id}`}
                      key={`${movie.id}-${movie.media_type}`}
                      className="group rounded-xl overflow-hidden bg-white/[0.02] border border-white/10 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-200"
                    >
                      <div className="aspect-[2/3] relative overflow-hidden bg-neutral-900">
                        <img
                          src={movie.poster_path ? `${TMDB_IMG}/w342${movie.poster_path}` : '/no-poster.png'}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {movie.vote_average > 0 && (
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-amber-400 backdrop-blur-sm">
                            ★ {movie.vote_average.toFixed(1)}
                          </span>
                        )}
                        {movie.media_type === 'tv' && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-600/90 text-[9px] font-bold text-white uppercase">
                            TV
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                          {movie.title}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
                          <span>{movie.release_date?.slice(0, 4) || 'TBA'}</span>
                          {movie.character && (
                            <span className="text-purple-400 truncate max-w-[80px]" title={movie.character}>
                              {movie.character}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {filteredFilms.length > 18 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setShowAllFilms(!showAllFilms)}
                      className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-purple-500/30 text-xs font-semibold text-purple-300 hover:text-white transition-all"
                    >
                      {showAllFilms ? 'Show Less ↑' : `Show All ${filteredFilms.length} Titles ↓`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
