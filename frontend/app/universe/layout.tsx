import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cinematic Universe Explorer',
  description: 'Explore every cinematic connection — actors, directors, and collaborators — across films, all in one interactive map.',
  alternates: { canonical: '/universe' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
