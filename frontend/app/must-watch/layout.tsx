import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Must-Watch Movies',
  description: 'A hand-picked list of must-watch movies you shouldn\'t miss — curated must-sees across every genre.',
  alternates: { canonical: '/must-watch' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
