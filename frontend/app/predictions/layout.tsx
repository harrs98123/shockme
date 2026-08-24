import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Award Predictions',
  description: 'Predict award-season winners, compete on the leaderboard, and see how your picks stack up against the community.',
  alternates: { canonical: '/predictions' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
