import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Award-Winning Movies',
  description: 'Explore Oscar and award-winning movies — celebrated films recognized for outstanding storytelling and craft.',
  alternates: { canonical: '/browse/awards' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
