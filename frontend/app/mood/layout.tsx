import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movies by Mood',
  description: 'Not sure what to watch? Get movie recommendations that match your mood — from feel-good comedies to edge-of-your-seat thrillers.',
  alternates: { canonical: '/mood' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
