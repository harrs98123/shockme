import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse by Language',
  description: 'Explore movies and shows in your favorite language, from Hindi and English to Korean and Japanese.',
  alternates: { canonical: '/browse/language' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
