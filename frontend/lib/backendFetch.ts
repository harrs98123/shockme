/**
 * Headers for server-side (Server Component / route handler) fetches to the
 * backend API. The backend's bot-blocker middleware rejects requests with an
 * empty or bot-like User-Agent — Node's fetch sends no User-Agent by default,
 * so without this header these calls would be blocked as "no browser UA".
 *
 * Do NOT use this for client-side (browser) requests — the browser sets its
 * own User-Agent and it can't be overridden there anyway.
 */
import { SITE_URL } from '@/lib/seo';

export const BACKEND_FETCH_HEADERS: Record<string, string> = {
  'User-Agent': `PlotMint-SSR/1.0 (+${SITE_URL})`,
};
