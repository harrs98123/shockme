import { type NextRequest, NextResponse } from 'next/server';
import { detailPageLimiter, searchLimiter, modApiLimiter, checkRateLimit } from '@/lib/rateLimit';

// Protected routes that require auth
const PROTECTED: string[] = [];

// Scoped to exactly the routes that are expensive to render or call a
// paid/rate-limited third party — an explicit allowlist so this never runs
// on static assets, images, or the rest of the site.
export const config = {
  matcher: [
    '/movie/:path*',
    '/tv/:path*',
    '/person/:path*',
    '/collections/:path*',
    '/search',
    '/search/:path*',
    '/catalog/:path*',
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
}
