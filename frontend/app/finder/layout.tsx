import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movie Finder',
  description: 'Find the perfect movie with advanced filters — genre, rating, year, language, and more, on plotmint.',
  alternates: { canonical: '/finder' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
