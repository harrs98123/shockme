import type { Metadata } from 'next';
import SecurityVerification from '@/components/SecurityVerification';

export const metadata: Metadata = {
  title: 'Verifying…',
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <SecurityVerification 
      message="Performing security verification"
      subtext="This website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot."
    />
  );
}
