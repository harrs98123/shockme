import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse by Genre',
  description: 'Find the perfect mood through cinematic themes. Explore movies across 19+ unique genres, from action to romance.',
  alternates: { canonical: '/browse/genre' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
