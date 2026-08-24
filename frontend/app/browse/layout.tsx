import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Movies & Shows',
  description: 'Browse movies and TV shows by genre, category, country, language, and franchise on plotmint.',
  alternates: { canonical: '/browse' },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
