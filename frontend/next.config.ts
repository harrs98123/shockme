import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy directives
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + Cloudflare Turnstile widget
  // unsafe-eval is needed by React in DEV mode only (never used in production)
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://challenges.cloudflare.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://screenscape.me`,
  // Styles: self + inline (needed for many CSS-in-JS patterns)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Images: self + TMDB + Cloudinary + Google avatars + data URIs
  "img-src 'self' data: blob: https://image.tmdb.org https://res.cloudinary.com https://lh3.googleusercontent.com https://ui-avatars.com",
  // Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  // API calls: self + backend + TMDB API + Cloudflare Turnstile
  // In dev allow localhost backend; in prod this should be your production domain
  `connect-src 'self' http://localhost:8000 ws://localhost:3000 ${isDev ? "ws://localhost:* http://localhost:*" : ""} https://api.themoviedb.org https://challenges.cloudflare.com https://res.cloudinary.com https://api.cloudinary.com https://screenscape.me`,
  // Frames: only Cloudflare Turnstile and our local streaming proxy
  "frame-src https://vidsrc.to https://www.youtube.com https://youtube.com https://challenges.cloudflare.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://screenscape.me http://localhost:8000",
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
  // Enable Brotli/gzip compression
  compress: true,

  // Optimized image handling
  images: {
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

  // Disable the X-Powered-By: Next.js header
  poweredByHeader: false,
};

export default nextConfig;
