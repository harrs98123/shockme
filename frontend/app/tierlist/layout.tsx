import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movie Tier List Maker',
  description: 'Build and share your own movie tier list — rank your favorite films from S-tier to F-tier.',
  alternates: { canonical: '/tierlist' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
