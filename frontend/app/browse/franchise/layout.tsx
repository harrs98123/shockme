import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movie Franchises & Studios',
  description: 'Explore movie franchises and studios — watch orders, timelines, and every entry in your favorite cinematic universe.',
  alternates: { canonical: '/browse/franchise' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
