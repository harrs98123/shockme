import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse by Country',
  description: 'Discover cinematic gems from over 150+ countries. Experience the world through storytelling on plotmint.',
  alternates: { canonical: '/browse/country' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
