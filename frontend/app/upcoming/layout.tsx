import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upcoming Movies',
  description: 'See what movies are coming out soon — upcoming releases from around the world, region by region.',
  alternates: { canonical: '/upcoming' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
