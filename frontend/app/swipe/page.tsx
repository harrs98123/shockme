// frontend/app/swipe/page.tsx
import SwipeDeck from '@/components/SwipeDeck';
import { Movie } from '@/lib/types';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchSwipeMovies(): Promise<Movie[]> {
  try {
    const res = await fetch(`${API_BASE}/movies/trending`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching trending for swipe:', error);
    return [];
  }
}

export default async function SwipePage() {
  const movies = await fetchSwipeMovies();

  // The categories shown in the image mockup
  const categories = ['Trending', 'New', 'Movies', 'Serials', 'TV shows', 'Cartoons'];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col relative font-[family-name:var(--font-geist-sans)]">
      {/* Absolute dark background as per image */}

      {/* Top Navigation */}
      <header className="w-full pt-12 pb-6 px-8 flex items-center justify-start gap-10 overflow-x-auto scrollbar-hide shrink-0 z-10">
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`whitespace-nowrap text-2xl font-semibold transition-all duration-300 ${i === 0
              ? 'text-white scale-105' // Active "Trending" look
              : 'text-zinc-600 hover:text-zinc-400'
              }`}
          >
            {cat}
          </button>
        ))}
      </header>

      {/* Main Swipe Deck Area */}
      <main className="flex-1 w-full h-full relative flex flex-col items-center justify-end pb-32 overflow-hidden">
        <SwipeDeck initialMovies={movies} />
      </main>
    </div>
  );
}
