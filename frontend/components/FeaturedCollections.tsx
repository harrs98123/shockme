'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { posterUrl } from '@/lib/api';

interface Collection {
  id: string;
  title: string;
  posters: string[]; // 3 poster paths
  link: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function FeaturedCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [actionRes, romanceRes, animeRes] = await Promise.all([
          fetch(`${API_BASE}/movies/discover?with_genres=28`),
          fetch(`${API_BASE}/movies/discover?with_genres=10749`),
          fetch(`${API_BASE}/movies/anime`),
        ]);

        const [actionData, romanceData, animeData] = await Promise.all([
          actionRes.json(),
          romanceRes.json(),
          animeRes.json(),
        ]);

        setCollections([
          {
            id: 'action',
            title: 'The Best of Action',
            posters: actionData.results?.slice(0, 3).map((m: any) => m.poster_path) || [],
            link: '/catalog/action',
          },
          {
            id: 'romance',
            title: 'The Best of Romance',
            posters: romanceData.results?.slice(0, 3).map((m: any) => m.poster_path) || [],
            link: '/catalog/romance',
          },
          {
            id: 'shounen',
            title: 'The Best of Anime',
            posters: animeData.results?.slice(0, 3).map((m: any) => m.poster_path) || [],
            link: '/catalog/anime',
          },
        ]);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch collections', err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading && collections.length === 0) {
    return (
      <section className="py-6 sm:py-10">
        <div className="container opacity-50">
          <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-8 text-white">Featured Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[280px] sm:h-[340px] bg-[#111116] rounded-2xl sm:rounded-3xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-10 relative">
      <div className="container">
        {/* Header */}
        <div className="flex justify-between items-baseline mb-4 sm:mb-8">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-1 h-5 sm:h-7 bg-white rounded-full" />
            <h2 className="text-lg sm:text-2xl font-extrabold text-white margin-0 tracking-tight">
              Featured Collections
            </h2>
          </div>
          <Link
            href="/collections"
            className="text-xs sm:text-sm color-white/60 hover:text-white no-underline font-semibold flex items-center gap-1 transition-colors"
          >
            See All <span className="text-base sm:text-lg">→</span>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {collections.map((col: Collection) => (
            <CollectionStackCard key={col.id} collection={col} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionStackCard({ collection }: { collection: Collection }) {
  return (
    <Link href={collection.link} className="no-underline block">
      <motion.div
        whileHover="hover"
        initial="rest"
        animate="rest"
        className="h-[290px] sm:h-[340px] bg-gradient-to-br from-[#1e1231] to-[#111116] rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center relative overflow-hidden border border-white/10 shadow-lg cursor-pointer"
      >
        <span className="text-sm sm:text-base font-semibold text-white/80 text-center mb-6 sm:mb-10 block">
          {collection.title}
        </span>

        {/* Poster Stack */}
        <div className="relative w-full h-full flex justify-center items-end pb-4 sm:pb-6">
          {collection.posters.map((path, i) => (
            <PosterInStack
              key={i}
              path={path}
              index={i}
            />
          ))}
        </div>
      </motion.div>
    </Link>
  );
}

function PosterInStack({ path, index }: { path: string; index: number }) {
  const configs = [
    {
      rotate: -14,
      x: -48,
      z: 5,
      hoverX: -64,
      hoverRotate: -22
    },
    {
      rotate: -2,
      x: 0,
      z: 10,
      hoverX: 0,
      hoverRotate: 0
    },
    {
      rotate: 14,
      x: 48,
      z: 5,
      hoverX: 64,
      hoverRotate: 22
    }
  ];

  const config = configs[index];

  return (
    <motion.div
      variants={{
        rest: {
          rotate: config.rotate,
          x: config.x,
          scale: index === 1 ? 1.05 : 0.95,
          zIndex: config.z
        },
        hover: {
          rotate: config.hoverRotate,
          x: config.hoverX,
          scale: 1.08,
          zIndex: 15
        }
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="absolute w-[115px] sm:w-[140px] aspect-[2/3] rounded-xl overflow-hidden border-2 sm:border-3 border-[#6b46c1] shadow-2xl bg-[#1a1a2e]"
    >
      <Image
        src={posterUrl(path, 'w342')}
        alt="Poster"
        fill
        sizes="(max-width: 640px) 115px, 140px"
        priority={index === 1}
        className="object-cover"
      />
    </motion.div>
  );
}
