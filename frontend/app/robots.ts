import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt is the polite half of the crawler policy — `proxy.ts` enforces the
 * same rules at the edge for anything that ignores this file.
 *
 * The site's internal link graph is unbounded (movie → cast → person →
 * filmography → more movies), and every previously-unseen detail URL a crawler
 * touches renders a page and writes a new ISR cache entry. Left open, that
 * turned into 66K generated `/movie/[id]` pages against 585 real cache reads.
 * So: search engines are welcomed but throttled, AI/SEO scrapers are refused,
 * and infinite-parameter routes (search, catalog filters) are off-limits to
 * everyone.
 */

/** Crawlers that consume renders and send no traffic back. */
const DISALLOWED_AGENTS = [
  // AI training / retrieval crawlers
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'CCBot',
  'cohere-ai',
  'Bytespider',
  'Amazonbot',
  'meta-externalagent',
  'FacebookBot',
  'Diffbot',
  'ImagesiftBot',
  'Timpibot',
  'omgili',
  'YouBot',
  'PetalBot',
  'AI2Bot',
  'FirecrawlAgent',
  // SEO backlink crawlers — pure cost, no upside
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'BLEXBot',
  'DataForSeoBot',
  'MegaIndex',
  'SeekportBot',
  'serpstatbot',
  'Barkrowler',
  'ZoominfoBot',
  'sistrix',
  'Screaming Frog SEO Spider',
];

/**
 * Routes with no indexing value that are expensive or unbounded to crawl.
 * `/search` and `/catalog` in particular have an infinite query-parameter
 * space, which is a classic crawl trap.
 */
const DISALLOWED_PATHS = [
  '/admin',
  '/admin/*',
  '/api/*',
  '/mod',
  '/mod/*',
  '/search',
  '/search/*',
  '/catalog/*',
  '/finder',
  '/swipe',
  '/feed',
  '/groups',
  '/groups/*',
  '/profile',
  '/profile/*',
  '/user/*',
  '/verify',
  '/login',
  '/register',
  '/forgot-password',
  // Query-string variants of otherwise-indexable pages: crawling `?page=2`
  // style permutations multiplies renders without adding unique content.
  '/*?*',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Search engines we want indexing the site. The crawl delay spreads their
      // requests out so a burst can't drain the crawl budget enforced in
      // proxy.ts (which would show up as 429s in Search Console).
      {
        userAgent: ['Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot', 'YandexBot'],
        allow: '/',
        disallow: DISALLOWED_PATHS,
        crawlDelay: 5,
      },

      // Everything else that behaves: same paths, slower.
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
        crawlDelay: 10,
      },

      // Refused outright.
      {
        userAgent: DISALLOWED_AGENTS,
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
