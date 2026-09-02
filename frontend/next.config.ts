import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

// Content Security Policy directives
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://challenges.cloudflare.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://screenscape.me`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://challenges.cloudflare.com",
  "img-src 'self' data: blob: https://image.tmdb.org https://res.cloudinary.com https://lh3.googleusercontent.com https://ui-avatars.com https://challenges.cloudflare.com",
  "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
  `connect-src 'self' http://localhost:8000 ws://localhost:3000 ${isDev ? "ws://localhost:* http://localhost:*" : ""} ${apiUrl} https://shockme-1.onrender.com https://*.onrender.com https://*.render.com wss://*.onrender.com https://api.themoviedb.org https://challenges.cloudflare.com https://res.cloudinary.com https://api.cloudinary.com https://screenscape.me`,
  "frame-src https://vidsrc.to https://www.youtube.com https://youtube.com https://challenges.cloudflare.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://screenscape.me http://localhost:8000 https://*.onrender.com",
  "object-src 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  !isDev ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Content-Security-Policy", value: cspDirectives },
];

const nextConfig: NextConfig = {
  // Pin Turbopack root to current project
  turbopack: {
    root: '.',
  },

  // Enable gzip/Brotli compression
  compress: true,
  poweredByHeader: false,

  // Efficient package import bundling
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', 'radix-ui'],
  },

  // Image handling
  images: {
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
