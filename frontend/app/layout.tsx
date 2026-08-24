import type { Metadata } from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import NavbarWrapper from '@/components/NavbarWrapper';
import { SITE_URL, SITE_NAME, jsonLdScript } from '@/lib/seo';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo/android-chrome-512x512.png`,
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'plotmint – Discover Your Next Favorite Movie',
    template: '%s | plotmint',
  },
  description:
    'plotmint is your cinematic companion — discover trending movies, get personalized recommendations, rate, review, and debate your favorites.',
  keywords: ['movies', 'film recommendations', 'movie ratings', 'watchlist', 'cinema', 'what to watch', 'movie reviews'],
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/logo/favicon.ico' },
      { url: '/logo/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/logo/favicon.ico',
    apple: [
      { url: '/logo/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/logo/site.webmanifest',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'plotmint – Discover Your Next Favorite Movie',
    description: 'plotmint is your cinematic companion — discover trending movies, get personalized recommendations, rate, review, and debate your favorites.',
    siteName: SITE_NAME,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'plotmint – Discover Your Next Favorite Movie',
    description: 'Discover trending movies, get personalized recommendations, rate, review, and debate your favorites.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${poppins.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        {API_ORIGIN && <link rel="preconnect" href={API_ORIGIN} />}
        {API_ORIGIN && <link rel="dns-prefetch" href={API_ORIGIN} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd)}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd)}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning>
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
