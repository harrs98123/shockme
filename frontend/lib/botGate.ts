/**
 * User-Agent classification for the proxy (edge) layer.
 *
 * WHY THIS EXISTS
 * ---------------
 * `/movie/[id]`, `/tv/[id]` and `/person/[id]` are ISR routes with
 * `dynamicParams = true`: the first request for any id that isn't already in
 * the cache renders the page in a function and writes a new cache entry
 * (HTML + RSC payload ≈ 2 ISR writes, ~45 KB of Fast Origin Transfer).
 *
 * The site's internal link graph is effectively unbounded — a movie links to
 * ~20 cast members, each person links to their whole filmography, each of
 * those links back to more cast. A crawler that walks it will happily mint
 * tens of thousands of cold cache entries that no human ever reads. That is
 * exactly what happened: 66K unique `/movie/[id]` paths generated against 585
 * actual cache reads, which blew the 200K/month ISR write budget.
 *
 * Search engines are worth paying for (they send traffic back). AI training
 * scrapers and SEO backlink crawlers are not — they cost renders and return
 * nothing. This module sorts the two apart so the proxy can 403 the second
 * group *before* Next.js renders anything.
 */

export type BotClass =
  | 'human'      // normal browser — no crawler gating
  | 'search'     // Googlebot & friends — allowed, but on a crawl budget
  | 'social'     // link-unfurlers (Slack/Discord/WhatsApp) — small budget
  | 'blocked';   // scrapers, AI trainers, headless tooling — 403

/**
 * Crawlers we want indexing the site. Kept deliberately short: every entry
 * here is granted a budget of cold renders per hour.
 */
const SEARCH_BOTS: [RegExp, string][] = [
  [/googlebot|google-inspectiontool|storebot-google/i, 'google'],
  [/bingbot|adidxbot|bingpreview/i, 'bing'],
  [/duckduckbot|duckduckgo/i, 'duckduckgo'],
  // Applebot (Siri/Spotlight) — but NOT Applebot-Extended, which is the
  // AI-training opt-in token and is matched by the blocklist below first.
  [/applebot/i, 'apple'],
  [/yandexbot|yandex\.com\/bots/i, 'yandex'],
  [/baiduspider/i, 'baidu'],
  [/(^|[^a-z])slurp/i, 'yahoo'],
];

/**
 * Link preview / unfurl bots. They fetch a handful of specific URLs that a
 * human just shared, so they get a small shared budget rather than a 403 —
 * blocking them would break Open Graph cards on social posts.
 */
const SOCIAL_BOTS =
  /twitterbot|facebookexternalhit|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|slack-imgproxy|redditbot|pinterest|skypeuripreview|embedly|iframely|vkshare|nuzzel|quora link preview|bitlybot|flipboard|tumblr|mastodon|bluesky|opengraph/i;

/**
 * Named crawlers we refuse: AI training/retrieval bots that don't send traffic
 * back, and SEO backlink crawlers (Ahrefs, Semrush, …) that are pure cost.
 *
 * Tested BEFORE the search list, so `Applebot-Extended` and `Google-Extended`
 * land here even though the patterns above would otherwise match them.
 */
const BLOCKED_BOTS =
  /applebot-extended|google-extended|scrapy|firecrawl|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic-ai|perplexitybot|perplexity-user|ccbot|cohere-ai|cohere-training-data-crawler|bytespider|bytedance|amazonbot|meta-externalagent|meta-externalfetcher|facebookbot|imagesift|diffbot|timpibot|omgili|youbot|petalbot|ai2bot|magpie-crawler|webzio|semrushbot|ahrefsbot|ahrefssiteaudit|mj12bot|dotbot|blexbot|megaindex|seekport|serpstatbot|barkrowler|zoominfobot|dataforseo|sistrix|screaming frog|linkdexbot|seokicks|rogerbot|exabot|gigabot|sogou|yeti|coccocbot|netcraft|nutch|heritrix/i;

/**
 * Raw HTTP clients, headless browsers and security scanners — the shape of
 * scraping tooling rather than a named crawler.
 *
 * Deliberately tested AFTER the search and social lists: several legitimate
 * unfurlers embed a client library name in their User-Agent (LinkedInBot ships
 * `Apache-HttpClient`), and blocking on that substring first would break Open
 * Graph previews.
 */
const HTTP_TOOLING =
  /python-requests|python-urllib|aiohttp|httpx|go-http-client|node-fetch|axios\/|okhttp|java\/|jakarta|libwww-perl|lwp::|guzzlehttp|curl\/|wget\/|winhttp|apache-httpclient|restsharp|postmanruntime|insomnia|headlesschrome|phantomjs|selenium|puppeteer|playwright|httrack|crawler4j|zgrab|masscan|nmap|nuclei|sqlmap|nikto|wpscan|censys|internetmeasurement|expanse|leakix/i;

/**
 * Generic "this smells like automation" fallback, applied only when the UA
 * matched none of the lists above. Keeps unknown/no-name crawlers off the
 * expensive routes without needing to enumerate every one of them.
 */
const GENERIC_BOT = /bot\b|bot\/|spider|crawler|crawl\b|scraper|fetcher|archiver|indexer|monitor|preview|validator|checker|analyzer|feedparser|rss|slurp|robot/i;

/** A real browser always announces itself as Mozilla/5.0 with a platform. */
const BROWSER_HINT = /mozilla\/5\.0.*(windows nt|macintosh|x11|linux|android|iphone|ipad|cros)/i;

export interface BotVerdict {
  klass: BotClass;
  /** Stable bucket name for the crawl-budget key (e.g. "google"). */
  family: string;
}

export function classifyUserAgent(ua: string | null): BotVerdict {
  const agent = (ua || '').trim();

  // No User-Agent at all is never a real browser. Scrapers and vulnerability
  // scanners routinely send none.
  if (agent.length === 0) return { klass: 'blocked', family: 'empty-ua' };

  // Absurdly short or absurdly long UAs are spoofing/fuzzing artifacts.
  if (agent.length < 12 || agent.length > 512) {
    return { klass: 'blocked', family: 'malformed-ua' };
  }

  if (BLOCKED_BOTS.test(agent)) return { klass: 'blocked', family: 'scraper' };

  for (const [pattern, family] of SEARCH_BOTS) {
    if (pattern.test(agent)) return { klass: 'search', family };
  }

  if (SOCIAL_BOTS.test(agent)) return { klass: 'social', family: 'social' };

  if (HTTP_TOOLING.test(agent)) return { klass: 'blocked', family: 'http-tooling' };

  if (GENERIC_BOT.test(agent)) return { klass: 'blocked', family: 'unknown-bot' };

  // Anything that doesn't look like a browser at this point isn't one.
  if (!BROWSER_HINT.test(agent)) return { klass: 'blocked', family: 'non-browser' };

  return { klass: 'human', family: 'human' };
}

/**
 * TMDB ids are plain positive integers well under 10 million. Anything else on
 * a detail route is enumeration noise, a path-traversal probe, or a stray
 * crawler artifact — and must never reach the renderer, because even a
 * `notFound()` result gets written to the ISR cache.
 */
const VALID_ID = /^[1-9]\d{0,7}$/;

export function isValidDetailPath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  // ["movie", "603"] — exactly two segments, second must be a sane id.
  if (segments.length !== 2) return false;
  return VALID_ID.test(segments[1]);
}
