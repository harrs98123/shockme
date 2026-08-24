import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anime Movies & Series',
  description: 'Discover the finest selection of Japanese anime — from legendary classics to modern hits — on plotmint.',
  alternates: { canonical: '/browse/anime' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
