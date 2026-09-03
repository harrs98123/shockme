import { type NextRequest, NextResponse } from 'next/server';
import {
  detailPageLimiter,
  searchLimiter,
  modApiLimiter,
  searchCrawlLimiter,
  socialCrawlLimiter,
  globalCrawlLimiter,
  checkRateLimit,
} from '@/lib/rateLimit';
import { classifyUserAgent, isValidDetailPath } from '@/lib/botGate';

// Protected routes that require auth
const PROTECTED: string[] = [];

// Scoped to exactly the routes that are expensive to render or call a
// paid/rate-limited third party — an explicit allowlist so this never runs on
// static assets, images, or the rest of the site.
//
// These used to carry `missing` conditions so Vercel would skip the Proxy
// entirely for prefetch/RSC requests. That was a real invocation saving, but it
// was also a hole straight through the bot gate: any scraper that set
// `Sec-Purpose: prefetch` skipped this file completely and went on minting ISR
// cache entries. The prefetch fast-path now lives INSIDE `proxy()`, after the
// User-Agent check, so it still skips the Upstash round-trip without letting a
// header opt anyone out of the crawler rules.
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

/** Routes whose path shape is `/<section>/<numeric id>`. */
const DETAIL_PREFIXES = ['/movie/', '/tv/', '/person/', '/collections/'];

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

// Refusal for a crawler we do not serve. Returned from the edge, so Next.js
// never renders the page and no ISR cache entry is written — which is the
// entire point: a rendered 404 still costs an ISR write, while a proxy-level
// 403 costs nothing but a single edge request.
function botBlocked(reason: string): NextResponse {
  return new NextResponse('Forbidden: automated access to this route is not permitted.\n', {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Block-Reason': reason,
    },
  });
}

// Crawlers that are over budget get 429 with a long Retry-After rather than
// 403, because well-behaved search engines back off on 429 and come back later
// instead of dropping the URL from their index.
function crawlerThrottled(): NextResponse {
  return new NextResponse('Crawl budget exhausted. Please retry later.\n', {
    status: 429,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Retry-After': '3600',
      'X-Robots-Tag': 'noindex',
    },
  });
}

// Malformed id — refuse at the edge so the renderer never mints a cache entry.
function badPath(): NextResponse {
  return new NextResponse('Not found.\n', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
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

  const isDetail = DETAIL_PREFIXES.some((p) => pathname.startsWith(p));

  // ── 1. Reject malformed detail ids before anything renders ────────────────
  // `/movie/603` is fine; `/movie/603/reviews`, `/movie/abc` and
  // `/movie/99999999999` are enumeration noise. A rendered `notFound()` costs
  // an ISR write; this costs nothing.
  if (isDetail && !isValidDetailPath(pathname)) {
    return badPath();
  }

  // ── 2. Bot gate ───────────────────────────────────────────────────────────
  // Runs on every matched route, but the crawl BUDGET only applies to the
  // dynamic-param routes, which are the ones that mint new cache entries.
  const { klass, family } = classifyUserAgent(request.headers.get('user-agent'));

  if (klass === 'blocked') {
    return botBlocked(family);
  }

  // Prefetch / RSC navigation from a request that already cleared the bot gate.
  // Real browsers fetching the next page shouldn't spend rate-limit budget, but
  // this check deliberately sits AFTER `classifyUserAgent` so that setting a
  // prefetch header can't be used to skip it.
  const purpose =
    request.headers.get('purpose') || request.headers.get('sec-purpose') || '';
  if (purpose.includes('prefetch') || request.headers.get('next-router-prefetch')) {
    return NextResponse.next();
  }

  if (klass === 'search' || klass === 'social') {
    // Crawlers never need the paid moderation proxy or the search page.
    if (pathname === '/api/mod' || pathname.startsWith('/search')) {
      return botBlocked('crawler-on-restricted-route');
    }

    // Link unfurlers legitimately need /movie/<id> for Open Graph cards, and
    // search engines need it for indexing — but both are metered so neither can
    // walk the link graph into tens of thousands of cold renders.
    if (isDetail || pathname.startsWith('/catalog')) {
      const familyLimiter = klass === 'search' ? searchCrawlLimiter : socialCrawlLimiter;
      const [familyBudget, globalBudget] = await Promise.all([
        checkRateLimit(familyLimiter, `crawl:${klass}:${family}`),
        checkRateLimit(globalCrawlLimiter, 'crawl:all'),
      ]);
      if (!familyBudget.success || !globalBudget.success) {
        return crawlerThrottled();
      }
    }

    return NextResponse.next();
  }

  // ── 3. Per-IP limits for real browsers ────────────────────────────────────
  let limiter = null;
  if (pathname === '/api/mod') {
    limiter = modApiLimiter;
  } else if (pathname.startsWith('/search') || pathname.startsWith('/catalog')) {
    limiter = searchLimiter;
  } else if (isDetail) {
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
