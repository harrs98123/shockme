import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse by Category',
  description: 'Explore trending, popular, top-rated, and newly released movies and shows by category on plotmint.',
  alternates: { canonical: '/browse/category' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
