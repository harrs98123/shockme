import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

// Content Security Policy directives
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + Cloudflare Turnstile widget
  // unsafe-eval is needed by React in DEV mode only (never used in production)
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://challenges.cloudflare.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://screenscape.me`,
  // Styles: self + inline (needed for many CSS-in-JS patterns)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://challenges.cloudflare.com",
  // Images: self + TMDB + Cloudinary + Google avatars + data URIs
  "img-src 'self' data: blob: https://image.tmdb.org https://res.cloudinary.com https://lh3.googleusercontent.com https://ui-avatars.com https://challenges.cloudflare.com",
  // Fonts
  "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
  // API calls: self + backend + Render + TMDB API + Cloudflare Turnstile
  `connect-src 'self' http://localhost:8000 ws://localhost:3000 ${isDev ? "ws://localhost:* http://localhost:*" : ""} ${apiUrl} https://shockme-1.onrender.com https://*.onrender.com https://*.render.com wss://*.onrender.com https://api.themoviedb.org https://challenges.cloudflare.com https://res.cloudinary.com https://api.cloudinary.com https://screenscape.me`,
  // Frames: only Cloudflare Turnstile and our local streaming proxy
  "frame-src https://vidsrc.to https://www.youtube.com https://youtube.com https://challenges.cloudflare.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://screenscape.me http://localhost:8000 https://*.onrender.com",
  // No plugins
  "object-src 'none'",
  // Prevent forms submitting to external sites
  "form-action 'self'",
  // Lock base URL
  "base-uri 'self'",
  // Upgrade HTTP to HTTPS in production
  !isDev ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

const securityHeaders = [
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // DNS prefetch for performance
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Stop leaking referrer info to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser feature access
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // HSTS — only fully effective over HTTPS
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // XSS protection (legacy browser fallback)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Content Security Policy
  { key: "Content-Security-Policy", value: cspDirectives },
];

const nextConfig: NextConfig = {
  // There are sibling lockfiles further up the drive (E:\all projects\...), so
  // Next was inferring the wrong workspace root and tracing far too many files
  // into each serverless function — bigger bundles, slower cold starts, more
  // Fluid CPU. Pin the root to this project.
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),

  // Enable Brotli/gzip compression
  compress: true,

  // Auto-memoizes components/hooks, cutting unnecessary re-renders across
  // the many framer-motion-heavy client components without manual useMemo/useCallback.
  reactCompiler: true,

  experimental: {
    // Only bundle the modules actually imported from these packages instead of
    // pulling in the whole library graph — meaningfully shrinks client JS.
    optimizePackageImports: ['framer-motion', 'radix-ui', 'react-markdown'],

    // Re-enable the client-side Router Cache (off by default since v15). Within
    // these windows, back/forward and repeat navigations are served from the
    // browser's cache instead of firing a fresh RSC request to a Vercel
    // function — fewer invocations and less origin transfer per session.
    staleTimes: {
      dynamic: 180,
      static: 300,
    },
  },

  // Image handling. `unoptimized` routes every <Image> straight to its source
  // (TMDB / Cloudinary already serve correctly-sized, CDN-cached derivatives),
  // so Vercel's Image Optimization pipeline is never invoked — that line item
  // and its cache-writes stay at zero. Do NOT flip this back on without a plan
  // for the per-transformation cost.
  images: {
    unoptimized: true,
    qualities: [75, 100],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
    ],
  },

  // Security headers on all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/category',
        destination: '/browse/category',
        permanent: true,
      },
    ];
  },

  // Disable the X-Powered-By: Next.js header
  poweredByHeader: false,
};

export default nextConfig;
