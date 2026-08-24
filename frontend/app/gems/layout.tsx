import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hidden Gems',
  description: 'Discover underrated hidden gem movies — great films that flew under the radar, ranked by rarity.',
  alternates: { canonical: '/gems' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
