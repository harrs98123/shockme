'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Flame,
  Zap,
  Skull,
  Palette,
  Smile,
  Compass,
  Film,
  ChevronRight,
  ChevronLeft,
  Star,
  ArrowUpRight,
} from 'lucide-react';
import { Media } from '@/lib/types';
import { posterUrl, releaseYear } from '@/lib/api';
import { getEnglishTitle } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CategoryItem {
  id: number;
  name: string;
  tagline: string;
  bgGradient: string;
  posterPath: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 28,
    name: 'Action',
    tagline: 'High octane thrillers',
    bgGradient: 'from-[#5a1616] via-[#2d0c0c] to-[#120505]',
    posterPath: '/iADOJ8Zymht2JPMoy3R7xceZprc.jpg', // Furiosa
    icon: Flame,
  },
  {
    id: 878,
    name: 'Sci-Fi',
    tagline: 'Interstellar futures',
    bgGradient: 'from-[#0e486b] via-[#09263a] to-[#04121d]',
    posterPath: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', // Deadpool & Wolverine
    icon: Zap,
  },
  {
    id: 27,
    name: 'Horror',
    tagline: 'Dark psychological chills',
    bgGradient: 'from-[#4a1c12] via-[#280e09] to-[#110503]',
    posterPath: '/l1175hgL5DoXnqeZQCcU3eZIdhX.jpg', // Terrifier 3
    icon: Skull,
  },
  {
    id: 16,
    name: 'Animation & A...',
    tagline: 'Anime masterpieces',
    bgGradient: 'from-[#431d68] via-[#230f37] to-[#0f0518]',
    posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', // Spider-Man Across the Spider-Verse
    icon: Palette,
  },
  {
    id: 35,
    name: 'Comedy',
    tagline: 'Laughs & good vibes',
    bgGradient: 'from-[#5d3810] via-[#331e08] to-[#140b03]',
    posterPath: '/wWba3TaojhK7NdycRhoQpsG0FaH.jpg', // Despicable Me 4
    icon: Smile,
  },
  {
    id: 12,
    name: 'Adventure',
    tagline: 'Fantasies & quests',
    bgGradient: 'from-[#144933] via-[#0b271b] to-[#04120c]',
    posterPath: '/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg', // Godzilla x Kong
    icon: Compass,
  },
];

interface Props {
  favIds?: number[];
  watchlistIds?: number[];
  watchedIds?: number[];
  onFavToggle?: (movie: Media) => void;
  onWatchlistToggle?: (movie: Media) => void;
  onWatchedToggle?: (movie: Media) => void;
}

export default function BrowseCategoriesShowcase({
  favIds = [],
  watchlistIds = [],
  watchedIds = [],
}: Props) {
  const [selectedGenreId, setSelectedGenreId] = useState<number>(28);
  const [genreMoviesCache, setGenreMoviesCache] = useState<Record<number, Media[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const activeCategory = CATEGORIES.find((c) => c.id === selectedGenreId) || CATEGORIES[0];
  const currentMovies = genreMoviesCache[selectedGenreId] || [];

  // Fetch movies for current category
  useEffect(() => {
    if (genreMoviesCache[selectedGenreId]) return;

    let isMounted = true;
    setLoading(true);

    fetch(`${API_BASE}/movies/discover?with_genres=${selectedGenreId}&sort_by=popularity.desc`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          const results = data.results || [];
          setGenreMoviesCache((prev) => ({
            ...prev,
            [selectedGenreId]: results.slice(0, 14),
          }));
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch category movies', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGenreId, genreMoviesCache]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="relative my-8 sm:my-12 select-none">
      <div className="container">
        {/* ── Section Header matching the screenshot ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[#FBBF24] text-[11px] font-bold tracking-wider uppercase mb-1">
              <Film size={13} className="text-[#FBBF24]" />
              <span>EXPLORE BY GENRE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Browse Categories
            </h2>
          </div>

          <Link
            href="/browse/genre"
            className="text-xs sm:text-sm font-semibold text-[#FBBF24] hover:underline flex items-center gap-1"
          >
            <span>See all</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* ── 6 Category Selector Cards Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5 mb-6">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedGenreId === cat.id;
            const IconComp = cat.icon;
            const poster = posterUrl(cat.posterPath, 'w342');

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedGenreId(cat.id)}
                className={`group relative h-[88px] sm:h-[94px] rounded-2xl p-3 text-left overflow-hidden border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'border-[#F59E0B] shadow-[0_0_18px_rgba(245,158,11,0.3)] bg-zinc-900/90'
                    : 'border-white/[0.08] hover:border-white/20 bg-zinc-950/80 hover:scale-[1.015]'
                }`}
              >
                {/* Background color gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${cat.bgGradient} opacity-90`}
                />

                {/* Left gradient mask to ensure text clarity */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent z-10 pointer-events-none" />

                {/* ── Tilted Poster on Right (Clockwise tilt matching the screenshot) ── */}
                <div className="absolute -right-2 -bottom-2 w-[72px] sm:w-[80px] h-[98px] sm:h-[106px] rotate-[10deg] rounded-lg overflow-hidden shadow-xl border border-white/10 z-0">
                  <Image
                    src={poster}
                    alt={cat.name}
                    fill
                    sizes="90px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/30 pointer-events-none" />
                </div>

                {/* Content on Left */}
                <div className="relative z-20 h-full flex flex-col justify-between max-w-[62%]">
                  {/* Top-left: circular icon badge */}
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/90">
                    <IconComp size={13} strokeWidth={2.2} />
                  </div>

                  {/* Bottom: Name & Subtitle */}
                  <div>
                    <div className="text-[13px] sm:text-sm font-bold text-white tracking-tight leading-tight truncate">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-normal truncate mt-0.5">
                      {cat.tagline}
                    </div>
                  </div>
                </div>

                {/* Selected Indicator Dot in Top-Right Corner */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 z-20 h-2 w-2 rounded-full bg-[#FBBF24] shadow-[0_0_6px_#FBBF24]" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Active Category Live Reel / Movies Carousel ── */}
        <div className="relative rounded-2xl border border-white/[0.06] bg-zinc-950/60 p-4 sm:p-5 backdrop-blur-md transition-opacity duration-150">
          {/* Header info for active reel */}
          <div className="flex items-center justify-between gap-4 mb-3.5 pb-2.5 border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FBBF24]/10 border border-[#FBBF24]/25 text-[#FBBF24]">
                <activeCategory.icon size={15} />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Top in <span className="text-[#FBBF24]">{activeCategory.name}</span>
                </h3>
                <span className="text-[11px] text-zinc-400 hidden sm:inline">
                  • {activeCategory.tagline}
                </span>
              </div>
            </div>

            {/* Navigation arrows & See More header link */}
            <div className="flex items-center gap-2.5">
              <Link
                href={`/catalog/discover?with_genres=${activeCategory.id}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[11px] font-bold text-[#FBBF24] hover:bg-[#FBBF24]/20 transition-colors"
              >
                <span>See More</span>
                <ArrowUpRight size={12} />
              </Link>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className="h-7 w-7 rounded-full border border-white/10 bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-opacity cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className="h-7 w-7 rounded-full border border-white/10 bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-opacity cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal Movies Row */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 sm:gap-3.5 overflow-x-auto scrollbar-none py-1 scroll-smooth snap-x snap-mandatory items-start"
          >
            {loading && currentMovies.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[135px] sm:w-[160px] lg:w-[175px] h-[202px] sm:h-[240px] lg:h-[262px] rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.05] shrink-0"
                />
              ))
            ) : currentMovies.length > 0 ? (
              <>
                {currentMovies.map((movie) => {
                  const title = getEnglishTitle(movie);
                  const poster = posterUrl(movie.poster_path, 'w342');
                  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '7.5';
                  const year = releaseYear(movie.release_date || movie.first_air_date);

                  return (
                    <div
                      key={movie.id}
                      className="group relative w-[135px] sm:w-[160px] lg:w-[175px] shrink-0 snap-start"
                    >
                      <Link
                        href={`/movie/${movie.id}`}
                        className="block relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-[#FBBF24]/60 transition-all duration-200"
                      >
                        <Image
                          src={poster}
                          alt={title}
                          fill
                          sizes="(max-width: 640px) 135px, 175px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Top Rating Badge */}
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-[#FBBF24]">
                          <Star size={9} className="fill-[#FBBF24] text-[#FBBF24]" />
                          <span>{rating}</span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5 z-20">
                          <div className="text-xs font-bold text-white line-clamp-2 mb-1">
                            {title}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-300">
                            <span>{year}</span>
                            <span className="text-[#FBBF24] font-semibold flex items-center gap-0.5">
                              View <ArrowUpRight size={10} />
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Movie Title below */}
                      <div className="mt-1.5 px-0.5">
                        <Link
                          href={`/movie/${movie.id}`}
                          title={title}
                          className="text-xs font-semibold text-white/90 hover:text-[#FBBF24] transition-colors truncate block"
                        >
                          {title}
                        </Link>
                        <div className="text-[10px] text-zinc-500">{year}</div>
                      </div>
                    </div>
                  );
                })}

                {/* ── Final Card: See More / Explore Full Genre ── */}
                <div className="w-[135px] sm:w-[160px] lg:w-[175px] shrink-0 snap-start">
                  <Link
                    href={`/catalog/discover?with_genres=${activeCategory.id}`}
                    className="group flex flex-col items-center justify-center text-center aspect-[2/3] w-full rounded-xl border border-dashed border-[#FBBF24]/30 bg-[#FBBF24]/[0.03] p-3 transition-colors hover:border-[#FBBF24] hover:bg-[#FBBF24]/[0.08]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBBF24]/15 text-[#FBBF24] group-hover:scale-105 group-hover:bg-[#FBBF24] group-hover:text-black transition-all mb-2">
                      <ArrowUpRight size={18} strokeWidth={2.2} />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-[#FBBF24] transition-colors">
                      See All
                    </div>
                    <div className="text-[10px] font-medium text-[#FBBF24] mt-0.5">
                      {activeCategory.name}
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-1">
                      1,000+ Titles
                    </div>
                  </Link>
                </div>
              </>
            ) : (
              <div className="w-full py-8 text-center text-xs text-zinc-500 font-mono">
                No movies found for this category right now.
              </div>
            )}
          </div>

          {/* ── Bottom Bar: See More Button ── */}
          <div className="mt-3.5 pt-2.5 border-t border-white/[0.05] flex items-center justify-between">
            <div className="text-[11px] text-zinc-400">
              Discover all trending <strong className="text-zinc-200">{activeCategory.name}</strong> movies
            </div>
            <Link
              href={`/catalog/discover?with_genres=${activeCategory.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-xs font-bold text-[#FBBF24] hover:bg-[#FBBF24] hover:text-black transition-colors"
            >
              <span>See More {activeCategory.name}</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
