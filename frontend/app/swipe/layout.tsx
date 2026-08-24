import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Swipe to Discover',
  description: 'Swipe through movies to quickly discover what to watch next on plotmint.',
  alternates: { canonical: '/swipe' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
