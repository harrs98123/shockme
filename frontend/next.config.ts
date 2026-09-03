import type { NextConfig } from "next";

import path from 'path';

const isDev = process.env.NODE_ENV === "development";
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

// Localhost origins belong in the CSP only while developing. Shipping them in
// production widens `connect-src`/`frame-src` for every visitor and lets a
// script injected into the page talk to (or frame) anything listening on the
// victim's own machine, so they are gated behind `isDev`.
const devOrigins = isDev
  ? "http://localhost:8000 http://localhost:* ws://localhost:*"
  : "";

// Content Security Policy directives.
//
// `'unsafe-inline'` in script-src is unavoidable here: the detail pages emit
// schema.org JSON-LD via dangerouslySetInnerHTML and Next.js emits inline
// hydration scripts. The nonce alternative requires per-request rendering,
// which would defeat the ISR caching these routes depend on.
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://challenges.cloudflare.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://screenscape.me`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://challenges.cloudflare.com",
  "img-src 'self' data: blob: https://image.tmdb.org https://res.cloudinary.com https://lh3.googleusercontent.com https://ui-avatars.com https://challenges.cloudflare.com",
  "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  `connect-src 'self' ${devOrigins} ${apiUrl} https://shockme-1.onrender.com https://*.onrender.com https://*.render.com wss://*.onrender.com https://api.themoviedb.org https://challenges.cloudflare.com https://res.cloudinary.com https://api.cloudinary.com https://screenscape.me`,
  `frame-src https://vidsrc.to https://www.youtube.com https://youtube.com https://challenges.cloudflare.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://screenscape.me https://*.onrender.com ${devOrigins}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  // The modern replacement for X-Frame-Options; where both are present,
  // browsers honour this one.
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  !isDev ? "upgrade-insecure-requests" : "",
].filter(Boolean).map((d) => d.replace(/\s+/g, ' ').trim()).join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), midi=(), serial=(), bluetooth=(), browsing-topics=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // `1; mode=block` is deprecated and its filter has itself been a source of
  // vulnerabilities; `0` disables the legacy auditor and defers to the CSP.
  { key: "X-XSS-Protection", value: "0" },
  // Cuts the page off from cross-origin window references (Spectre / tabnabbing)
  // while still allowing OAuth and share popups to work.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "Content-Security-Policy", value: cspDirectives },
];

const nextConfig: NextConfig = {
  // Pin Turbopack root to current working directory
  turbopack: {
    root: path.resolve(process.cwd()),
  },

  // Enable gzip/Brotli compression
  compress: true,
  poweredByHeader: false,

  // How long the CDN may keep serving a stale ISR page while it revalidates in
  // the background. A long window means a cached page is re-fetched from the
  // origin far less often, which is what Fast Origin Transfer is billed on.
  expireTime: 31536000,

  // Efficient package import bundling
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', 'radix-ui'],
  },

  // Image handling
  images: {
    // Deliberately unoptimized: TMDB already serves correctly-sized posters,
    // and routing them through Vercel's optimizer would bill every variant.
    unoptimized: true,
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
      {
        // Routes with no indexing value. The header is belt-and-braces with the
        // robots.txt disallow: robots stops the crawl, this stops any URL that
        // leaks into an index some other way.
        source: "/:path(search|finder|swipe|feed|verify|login|register)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/:path(admin|mod|profile|groups)/:rest*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
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
};

export default nextConfig;
