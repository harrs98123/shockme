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
            title: 'The best of Action',
            posters: actionData.results?.slice(0, 3).map((m: any) => m.poster_path) || [],
            link: '/catalog/action',
          },
          {
            id: 'romance',
            title: 'The best of romance',
            posters: romanceData.results?.slice(0, 3).map((m: any) => m.poster_path) || [],
            link: '/catalog/romance',
          },
          {
            id: 'shounen',
            title: 'The best of Shounen',
            posters: animeData.results?.slice(0, 3).map((m: any) => m.poster_path) || [],
            link: '/catalog/anime', // Actually it's anime
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
      <div className="container" style={{ padding: '40px 24px', opacity: 0.5 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Featured Collections</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 340, backgroundColor: '#111116', borderRadius: 20 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px', position: 'relative' }}>

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'baseline', 
        marginBottom: 32 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 28, backgroundColor: '#fff', borderRadius: 2 }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            Featured Collections
          </h2>
        </div>
        <Link href="/collections" style={{ 
          fontSize: 14, 
          color: 'rgba(255,255,255,0.6)', 
          textDecoration: 'none',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          See All <span style={{ fontSize: 18 }}>→</span>
        </Link>
      </div>

      {/* Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
        gap: 24 
      }}>
        {collections.map((col: Collection) => (
          <CollectionStackCard key={col.id} collection={col} />
        ))}
      </div>

    </div>
  );
}

function CollectionStackCard({ collection }: { collection: Collection }) {
  return (
    <Link href={collection.link} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover="hover"
        initial="rest"
        animate="rest"
        style={{
          height: 340,
          background: 'linear-gradient(145deg, #1e1231 0%, #111116 100%)',
          borderRadius: 20,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          cursor: 'pointer'
        }}
      >

        <span style={{ 
          fontSize: 18, 
          fontWeight: 600, 
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
          marginBottom: 40,
          display: 'block'
        }}>
          {collection.title}
        </span>

        {/* Poster Stack */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingBottom: 20
        }}>
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
  // Styles based on index (0, 1, 2)
  // i=0: Left, rotated left
  // i=1: Middle, slightly rotated
  // i=2: Right, rotated right
  const configs = [
    { 
      rotate: -15, 
      x: -60, 
      z: 5, 
      hoverX: -80, 
      hoverRotate: -25 
    },
    { 
      rotate: -2, 
      x: 0, 
      z: 10, 
      hoverX: 0, 
      hoverRotate: 0 
    },
    { 
      rotate: 15, 
      x: 60, 
      z: 5, 
      hoverX: 80, 
      hoverRotate: 25 
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
          scale: 1.1,
          zIndex: 15 
        }
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      style={{
        position: 'absolute',
        width: 140,
        aspectRatio: '2/3',
        borderRadius: 12,
        overflow: 'hidden',
        border: '3px solid #6b46c1', // Purple border as requested
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        backgroundColor: '#1a1a2e'
      }}
    >
      <Image
        src={posterUrl(path, 'w300')}
        alt="Poster"
        fill
        sizes="140px"
        style={{ objectFit: 'cover' }}
      />
    </motion.div>
  );
}
