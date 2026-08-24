import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Family-Friendly Movies & Shows',
  description: 'Explore the best family-friendly movies and shows for movie night with everyone, curated on plotmint.',
  alternates: { canonical: '/browse/family' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
