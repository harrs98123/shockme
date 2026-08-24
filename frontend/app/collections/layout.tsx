import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movie Collections',
  description: 'Browse curated movie collections and ranked lists from the plotmint community, or build your own.',
  alternates: { canonical: '/collections' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
