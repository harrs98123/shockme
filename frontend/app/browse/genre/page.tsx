'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Flame,
  Compass,
  Palette,
  Smile,
  ShieldAlert,
  Video,
  Sparkles,
  Users,
  Wand2,
  Landmark,
  Skull,
  Music,
  Search,
  Heart,
  Zap,
  Tv,
  Activity,
  Crosshair,
  Mountain,
  Film,
  Theater,
  ArrowUpRight,
} from 'lucide-react';
import api, { posterUrl } from '@/lib/api';

interface Genre {
  id: number;
  name: string;
}

interface GenreMeta {
  name: string;
  tagline: string;
  bgGradient: string;
  posterPath: string;
  icon: React.ElementType;
  accentColor: string;
}

const GENRE_CONFIG: Record<string, GenreMeta> = {
  action: {
    name: 'Action',
    tagline: 'High octane thrillers & explosive battles',
    bgGradient: 'from-[#5a1616] via-[#2d0c0c] to-[#120505]',
    posterPath: '/iADOJ8Zymht2JPMoy3R7xceZprc.jpg', // Furiosa: A Mad Max Saga
    icon: Flame,
    accentColor: '#F43F5E',
  },
  adventure: {
    name: 'Adventure',
    tagline: 'Epic journeys & uncharted desert worlds',
    bgGradient: 'from-[#144933] via-[#0b271b] to-[#04120c]',
    posterPath: '/czembW0Rk1Ke7lCJGahbOhdCuhV.jpg', // Dune: Part Two
    icon: Compass,
    accentColor: '#10B981',
  },
  animation: {
    name: 'Animation',
    tagline: 'Anime marvels & multiverse masterpieces',
    bgGradient: 'from-[#431d68] via-[#230f37] to-[#0f0518]',
    posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', // Spider-Man Across the Spider-Verse
    icon: Palette,
    accentColor: '#A855F7',
  },
  comedy: {
    name: 'Comedy',
    tagline: 'Laughs, mayhem & good vibes',
    bgGradient: 'from-[#5d3810] via-[#331e08] to-[#140b03]',
    posterPath: '/wWba3TaojhK7NdycRhoQpsG0FaH.jpg', // Despicable Me 4
    icon: Smile,
    accentColor: '#F59E0B',
  },
  crime: {
    name: 'Crime',
    tagline: 'Underworld heists & Gotham noir',
    bgGradient: 'from-[#1e293b] via-[#0f172a] to-[#020617]',
    posterPath: '/74xTEgt7R36Fpooo50r9T25onhq.jpg', // The Batman
    icon: ShieldAlert,
    accentColor: '#94A3B8',
  },
  documentary: {
    name: 'Documentary',
    tagline: 'Real world revelations & breathtaking climbs',
    bgGradient: 'from-[#164e63] via-[#083344] to-[#02131b]',
    posterPath: '/1E5baAaEse26fej7uHcjOgEE2t2.jpg', // Free Solo
    icon: Video,
    accentColor: '#38BDF8',
  },
  drama: {
    name: 'Drama',
    tagline: 'Deep emotions & timeless hope',
    bgGradient: 'from-[#4c1d95] via-[#2e1065] to-[#0f0426]',
    posterPath: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', // The Shawshank Redemption
    icon: Sparkles,
    accentColor: '#8B5CF6',
  },
  family: {
    name: 'Family',
    tagline: 'Heartfelt magic for every generation',
    bgGradient: 'from-[#7c2d12] via-[#431407] to-[#1c0802]',
    posterPath: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg', // Inside Out 2
    icon: Users,
    accentColor: '#FB923C',
  },
  fantasy: {
    name: 'Fantasy',
    tagline: 'Mythical realms, wizards & epic sagas',
    bgGradient: 'from-[#581c87] via-[#2e0854] to-[#120224]',
    posterPath: '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // The Lord of the Rings: Fellowship of the Ring
    icon: Wand2,
    accentColor: '#C084FC',
  },
  history: {
    name: 'History',
    tagline: 'Pivotal moments that shaped humanity',
    bgGradient: 'from-[#78350f] via-[#451a03] to-[#1c0a01]',
    posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', // Oppenheimer
    icon: Landmark,
    accentColor: '#D97706',
  },
  horror: {
    name: 'Horror',
    tagline: 'Dark psychological chills & night terrors',
    bgGradient: 'from-[#4a1c12] via-[#280e09] to-[#110503]',
    posterPath: '/l1175hgL5DoXnqeZQCcU3eZIdhX.jpg', // Terrifier 3
    icon: Skull,
    accentColor: '#EF4444',
  },
  music: {
    name: 'Music',
    tagline: 'Sonic passion, intense rhythm & stage drive',
    bgGradient: 'from-[#831843] via-[#500724] to-[#1f020d]',
    posterPath: '/uDO8zWDhfWwoFdKS4fzkVJt0Rf0.jpg', // La La Land
    icon: Music,
    accentColor: '#EC4899',
  },
  mystery: {
    name: 'Mystery',
    tagline: 'Whodunit puzzles & brilliant detective twists',
    bgGradient: 'from-[#1e1b4b] via-[#0f0e26] to-[#050410]',
    posterPath: '/vDGr1YdrlfbU9wxTOdpf3zChmv9.jpg', // Glass Onion / Knives Out
    icon: Search,
    accentColor: '#6366F1',
  },
  romance: {
    name: 'Romance',
    tagline: 'Passionate connections & grand love stories',
    bgGradient: 'from-[#9d174d] via-[#5b082a] to-[#20020e]',
    posterPath: '/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', // Titanic
    icon: Heart,
    accentColor: '#F472B6',
  },
  'science fiction': {
    name: 'Science Fiction',
    tagline: 'Black holes, spacetime & interstellar futures',
    bgGradient: 'from-[#0e486b] via-[#09263a] to-[#04121d]',
    posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
    icon: Zap,
    accentColor: '#0284C7',
  },
  'tv movie': {
    name: 'TV Movie',
    tagline: 'Special features & superhero team-ups',
    bgGradient: 'from-[#312e81] via-[#1e1b4b] to-[#0c0a24]',
    posterPath: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', // Deadpool & Wolverine
    icon: Tv,
    accentColor: '#818CF8',
  },
  thriller: {
    name: 'Thriller',
    tagline: 'Edge-of-your-seat suspense & dark secrets',
    bgGradient: 'from-[#7f1d1d] via-[#450a0a] to-[#1a0303]',
    posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
    icon: Activity,
    accentColor: '#DC2626',
  },
  war: {
    name: 'War',
    tagline: 'Trench warfare, brotherhood & frontline bravery',
    bgGradient: 'from-[#701a75] via-[#4a044e] to-[#1c021e]',
    posterPath: '/iZhaTkCpmdZtCniStkWgKyGUiur.jpg', // 1917
    icon: Crosshair,
    accentColor: '#A21CAF',
  },
  western: {
    name: 'Western',
    tagline: 'Bounty hunters, dusty trails & outlaws',
    bgGradient: 'from-[#713f12] via-[#3f2206] to-[#180c02]',
    posterPath: '/2oZPub2rwMUbRLb4ytbt8ZZFbzs.jpg', // Django Unchained
    icon: Mountain,
    accentColor: '#D97706',
  },
};

function getGenreDetails(name: string): GenreMeta {
  const key = name.toLowerCase().trim();
  if (GENRE_CONFIG[key]) return GENRE_CONFIG[key];
  for (const [k, v] of Object.entries(GENRE_CONFIG)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return {
    name,
    tagline: 'Explore cinematic gems & curated titles',
    bgGradient: 'from-[#312e81] via-[#1e1b4b] to-[#0c0a24]',
    posterPath: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    icon: Film,
    accentColor: '#8B5CF6',
  };
}

export default function GenrePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/movies/genres')
      .then((res) => {
        setGenres(res.data.genres || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch genres:', err);
        setLoading(false);
      });
  }, []);

  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) return genres;
    const q = searchQuery.toLowerCase().trim();
    return genres.filter((g) => {
      const meta = getGenreDetails(g.name);
      return (
        g.name.toLowerCase().includes(q) ||
        meta.tagline.toLowerCase().includes(q)
      );
    });
  }, [genres, searchQuery]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="section container select-none" style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 140 }}>
      {/* ── Page Header ── */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-1.5 text-[#FBBF24] text-xs font-bold tracking-wider uppercase mb-2">
            <Theater size={14} className="text-[#FBBF24]" />
            <span>EXPLORE BY THEME</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Browse by Genre
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-xl">
            Find the perfect mood through cinematic themes. Explore movies across 19+ unique categories.
          </p>
        </motion.div>

        {/* Quick Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter genres by name or theme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FBBF24]/50 focus:bg-white/[0.07] transition-all shadow-inner"
          />
        </div>
      </header>

      {/* ── Large Spacious Genre Showcase Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {filteredGenres.map((genre, idx) => {
          const meta = getGenreDetails(genre.name);
          const IconComp = meta.icon;
          const poster = posterUrl(meta.posterPath, 'w500');

          return (
            <motion.div
              key={genre.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.025, 0.3) }}
            >
              <Link
                href={`/catalog/discover?with_genres=${genre.id}`}
                className="group relative block h-[134px] sm:h-[144px] lg:h-[152px] rounded-3xl p-5 sm:p-6 text-left overflow-hidden border border-white/[0.09] hover:border-white/30 bg-zinc-950/90 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xl"
                style={{ textDecoration: 'none' }}
              >
                {/* Dynamic Background color gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${meta.bgGradient} opacity-90 transition-opacity duration-300 group-hover:opacity-100`}
                />

                {/* Left gradient mask ensuring crisp text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent z-10 pointer-events-none" />

                {/* Large Tilted Poster Artwork on Right */}
                <div className="absolute -right-3 -bottom-3 w-[112px] sm:w-[124px] lg:w-[136px] h-[162px] sm:h-[180px] lg:h-[195px] rotate-[9deg] group-hover:rotate-[5deg] group-hover:scale-105 rounded-xl overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.85)] border border-white/15 z-0 transition-transform duration-500 ease-out pointer-events-none">
                  <Image
                    src={poster}
                    alt={genre.name}
                    fill
                    sizes="(max-width: 768px) 130px, 160px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/35 pointer-events-none" />
                </div>

                {/* Left Content Stack */}
                <div className="relative z-20 h-full flex flex-col justify-between max-w-[64%] sm:max-w-[62%]">
                  {/* Top-left: Prominent circular icon badge */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/55 border border-white/20 text-white/95 shadow-md group-hover:border-white/40 group-hover:bg-black/70 transition-all">
                      <IconComp size={16} strokeWidth={2.2} />
                    </div>
                  </div>

                  {/* Bottom-left: Title, Tagline & Explore indicator */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight leading-tight truncate group-hover:text-white transition-colors">
                        {genre.name}
                      </h2>
                      <ArrowUpRight size={16} className="text-white/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-300/80 font-normal mt-1 leading-snug line-clamp-2 group-hover:text-zinc-200 transition-colors">
                      {meta.tagline}
                    </p>
                  </div>
                </div>

                {/* Subtle Hover Glow Border Effect */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 0 1px ${meta.accentColor}66, 0 12px 32px -8px ${meta.accentColor}33`,
                  }}
                />
              </Link>
            </motion.div>
          );
        })}
      </div>

      {filteredGenres.length === 0 && (
        <div className="text-center py-24 text-zinc-500 text-sm">
          No genres found matching &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
}
