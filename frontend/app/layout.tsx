import type { Metadata } from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import NavbarWrapper from '@/components/NavbarWrapper';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport = {
  themeColor: '#E50914',
};

export const metadata: Metadata = {
  title: {
    default: 'shockme – Discover Your Next Favorite Movie',
    template: '%s | shockme',
  },
  description:
    'shockme is your cinematic companion — discover trending movies, get personalized recommendations, rate, review, and debate your favorites.',
  keywords: ['movies', 'film recommendations', 'movie ratings', 'watchlist', 'cinema'],
  openGraph: {
    type: 'website',
    title: 'shockme',
    description: 'Discover your next favorite movie',
    siteName: 'shockme',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          {/* Universal Ambient Background Glow */}
          <div
            className="pointer-events-none fixed inset-0 -z-50"
            style={{
              background: 'radial-gradient(circle at -10% -10%, #3b2355 0%, #150E1B 45%, var(--bg) 80%)',
            }}
          />
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
