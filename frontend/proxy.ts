import { type NextRequest, NextResponse } from 'next/server';
import { detailPageLimiter, searchLimiter, modApiLimiter, checkRateLimit } from '@/lib/rateLimit';

// Protected routes that require auth
const PROTECTED: string[] = [];

// Scoped to exactly the routes that are expensive to render or call a
// paid/rate-limited third party — an explicit allowlist so this never runs
// on static assets, images, or the rest of the site.
//
// The `missing` conditions make Vercel skip the Proxy invocation ENTIRELY for
// Next.js prefetch requests (Link hover/viewport prefetch) and RSC data
// fetches. Those must never burn the rate-limit budget, an Upstash round-trip,
// or a Fluid function invocation — only real top-level page loads and the
// `/api/mod` proxy do. This is the single biggest cut to Edge Requests,
// Function Invocations and Fluid Active CPU. `missing`/`has` entries must be
// inlined as literals so Next can statically analyse the matcher at build time.
export const config = {
  matcher: [
    {
      source: '/movie/:path*',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
        { type: 'header', key: 'sec-purpose', value: 'prefetch' },
      ],
    },
    {
      source: '/tv/:path*',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
        { type: 'header', key: 'sec-purpose', value: 'prefetch' },
      ],
    },
    {
      source: '/person/:path*',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
        { type: 'header', key: 'sec-purpose', value: 'prefetch' },
      ],
    },
    {
      source: '/collections/:path*',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
        { type: 'header', key: 'sec-purpose', value: 'prefetch' },
      ],
    },
    {
      source: '/search',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
        { type: 'header', key: 'sec-purpose', value: 'prefetch' },
      ],
    },
    {
      source: '/search/:path*',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
        { type: 'header', key: 'sec-purpose', value: 'prefetch' },
      ],
    },
    {
      source: '/catalog/:path*',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
        { type: 'header', key: 'sec-purpose', value: 'prefetch' },
      ],
    },
    '/api/mod',
  ],
};

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function rateLimit429(reset: number, limit: number, remaining: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return new NextResponse(
    JSON.stringify({ error: 'Too many requests. Please slow down and try again shortly.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(Math.max(0, remaining)),
      },
    }
  );
}

export async function proxy(request: NextRequest) {
  // Belt-and-suspenders for the matcher `missing` rules above. Next.js strips
  // its internal Flight headers (`rsc`, `next-router-prefetch`) from
  // `request.headers` inside Proxy, so the matcher is what actually stops those
  // — but browser-level prefetch hints still come through and are worth an
  // early exit before the Upstash round-trip.
  const purpose =
    request.headers.get('purpose') || request.headers.get('sec-purpose') || '';
  if (purpose.includes('prefetch')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('cinematch_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  let limiter = null;
  if (pathname === '/api/mod') {
    limiter = modApiLimiter;
  } else if (pathname.startsWith('/search') || pathname.startsWith('/catalog')) {
    limiter = searchLimiter;
  } else if (
    pathname.startsWith('/movie/') ||
    pathname.startsWith('/tv/') ||
    pathname.startsWith('/person/') ||
    pathname.startsWith('/collections/')
  ) {
    limiter = detailPageLimiter;
  }

  if (limiter) {
    const ip = getClientIp(request);
    const bucket = pathname.split('/')[1] || 'root';
    const { success, limit, remaining, reset } = await checkRateLimit(limiter, `${bucket}:${ip}`);
    if (!success) {
      return rateLimit429(reset, limit, remaining);
    }
  }

  return NextResponse.next();
}
