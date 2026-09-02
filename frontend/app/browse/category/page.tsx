'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Flame,
  Star,
  Trophy,
  Calendar,
  PlayCircle,
  Tv,
  Globe,
  LayoutGrid,
  Film,
  ArrowUpRight,
} from 'lucide-react';
import api, { posterUrl } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CategoryMeta {
  name: string;
  tagline: string;
  bgGradient: string;
  posterPath: string;
  icon: React.ElementType;
  accentColor: string;
}

const CATEGORY_CONFIG: Record<string, CategoryMeta> = {
  trending: {
    name: 'Trending Now',
    tagline: 'What the entire world is watching right now',
    bgGradient: 'from-[#5a1616] via-[#2d0c0c] to-[#120505]',
    posterPath: '/iADOJ8Zymht2JPMoy3R7xceZprc.jpg', // Furiosa
    icon: Flame,
    accentColor: '#F43F5E',
  },
  popular: {
    name: 'Most Popular',
    tagline: 'Global crowd-pleasers & box-office blockbusters',
    bgGradient: 'from-[#5d3810] via-[#331e08] to-[#140b03]',
    posterPath: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg', // Inside Out 2
    icon: Star,
    accentColor: '#F59E0B',
  },
  'top-rated': {
    name: 'Top Rated',
    tagline: 'All-time cinematic classics and masterpieces',
    bgGradient: 'from-[#0e486b] via-[#09263a] to-[#04121d]',
    posterPath: '/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg', // The Godfather
    icon: Trophy,
    accentColor: '#3B82F6',
  },
  upcoming: {
    name: 'Upcoming Releases',
    tagline: 'Anticipated theatrical premieres & trailers',
    bgGradient: 'from-[#144933] via-[#0b271b] to-[#04120c]',
    posterPath: '/czembW0Rk1Ke7lCJGahbOhdCuhV.jpg', // Dune: Part Two
    icon: Calendar,
    accentColor: '#10B981',
  },
  'now-playing': {
    name: 'In Theaters Now',
    tagline: 'Currently lighting up cinema screens worldwide',
    bgGradient: 'from-[#4a1c12] via-[#280e09] to-[#110503]',
    posterPath: '/l1175hgL5DoXnqeZQCcU3eZIdhX.jpg', // Terrifier 3
    icon: PlayCircle,
    accentColor: '#EF4444',
  },
  anime: {
    name: 'Anime Features',
    tagline: 'Legendary animation marvels & studio features',
    bgGradient: 'from-[#431d68] via-[#230f37] to-[#0f0518]',
    posterPath: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', // Spirited Away
    icon: Tv,
    accentColor: '#EC4899',
  },
  'trending-indian': {
    name: 'Indian Cinema',
    tagline: 'Bollywood, Tollywood & pan-Indian powerhouses',
    bgGradient: 'from-[#7c2d12] via-[#431407] to-[#1c0802]',
    posterPath: '/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg', // 12th Fail
    icon: Globe,
    accentColor: '#F97316',
  },
};

function getCategoryDetails(id: string, name: string, desc: string): CategoryMeta {
  const key = id.toLowerCase().trim();
  if (CATEGORY_CONFIG[key]) return CATEGORY_CONFIG[key];
  return {
    name: name || id,
    tagline: desc || 'Curated movie collection',
    bgGradient: 'from-[#312e81] via-[#1e1b4b] to-[#0c0a24]',
    posterPath: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    icon: Film,
    accentColor: '#8B5CF6',
  };
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies/categories')
      .then((res) => {
        setCategories(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch categories:', err);
        setLoading(false);
      });
  }, []);

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
      <header className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-1.5 text-[#FBBF24] text-xs font-bold tracking-wider uppercase mb-2">
            <LayoutGrid size={14} className="text-[#FBBF24]" />
            <span>CURATED COLLECTIONS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Browse by Category
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-xl">
            Quickly jump into our curated collections of trending, popular, and upcoming cinema.
          </p>
        </motion.div>
      </header>

      {/* ── Large Spacious Category Showcase Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {categories.map((cat, idx) => {
          const meta = getCategoryDetails(cat.id, cat.name, cat.description);
          const IconComp = meta.icon;
          const poster = posterUrl(meta.posterPath, 'w500');

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.3) }}
            >
              <Link
                href={`/catalog/${cat.id}`}
                className="group relative block h-[134px] sm:h-[144px] lg:h-[152px] rounded-3xl p-5 sm:p-6 text-left overflow-hidden border border-white/[0.09] hover:border-white/30 bg-zinc-950/90 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xl"
                style={{ textDecoration: 'none' }}
              >
                {/* Background color gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${meta.bgGradient} opacity-90 transition-opacity duration-300 group-hover:opacity-100`}
                />

                {/* Left gradient mask */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent z-10 pointer-events-none" />

                {/* Tilted Poster on Right */}
                <div className="absolute -right-3 -bottom-3 w-[112px] sm:w-[124px] lg:w-[136px] h-[162px] sm:h-[180px] lg:h-[195px] rotate-[9deg] group-hover:rotate-[5deg] group-hover:scale-105 rounded-xl overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.85)] border border-white/15 z-0 transition-transform duration-500 ease-out pointer-events-none">
                  <Image
                    src={poster}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 130px, 160px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/35 pointer-events-none" />
                </div>

                {/* Content on Left */}
                <div className="relative z-20 h-full flex flex-col justify-between max-w-[64%] sm:max-w-[62%]">
                  {/* Top-left: circular icon badge */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/55 border border-white/20 text-white/95 shadow-md group-hover:border-white/40 group-hover:bg-black/70 transition-all">
                      <IconComp size={16} strokeWidth={2.2} />
                    </div>
                  </div>

                  {/* Bottom: Name & Subtitle */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight leading-tight truncate group-hover:text-white transition-colors">
                        {meta.name}
                      </h2>
                      <ArrowUpRight size={16} className="text-white/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-300/80 font-normal mt-1 leading-snug line-clamp-2 group-hover:text-zinc-200 transition-colors">
                      {meta.tagline}
                    </p>
                  </div>
                </div>

                {/* Subtle hover border glow */}
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
    </div>
  );
}
