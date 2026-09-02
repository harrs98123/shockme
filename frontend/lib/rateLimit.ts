import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Edge-safe, distributed rate limiting for the proxy (middleware) layer.
 *
 * Serverless/edge instances are ephemeral, so an in-memory Map can't track
 * request counts across them — this uses Upstash Redis's REST API instead
 * (fetch-based, works from the Edge runtime, no TCP connection needed).
 *
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN aren't configured,
 * rate limiting is disabled (fails open) rather than breaking the site —
 * see the deployment notes for how to provision these.
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

if (!redis && process.env.NODE_ENV === 'production') {
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set — ' +
    'edge rate limiting on movie/tv/person/collections/search/catalog routes is disabled.'
  );
}

function makeLimiter(requests: number, window: `${number} s` | `${number} m`): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
    prefix: 'ratelimit',
  });
}

// Detail pages (movie/tv/person/collections): generous enough for normal
// binge-browsing, but stops rapid numeric-ID enumeration by scrapers.
export const detailPageLimiter = makeLimiter(60, '60 s');

// Search & catalog/filter pages: moderate — typing/filtering is bursty
// but shouldn't sustain dozens of requests per second.
export const searchLimiter = makeLimiter(30, '60 s');

// /api/mod proxies a paid third-party moderation API — strict.
export const modApiLimiter = makeLimiter(10, '60 s');

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  try {
    return await limiter.limit(identifier);
  } catch (err) {
    // Fail open — an Upstash outage should never take the whole site down.
    console.error('[rate-limit] check failed, allowing request:', err);
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}
