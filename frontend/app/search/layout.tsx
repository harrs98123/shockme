import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search movies, TV shows, and people on plotmint.',
  // Query-driven result pages are thin/duplicate content — keep them out of
  // the index, but still let bots follow links from here.
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
