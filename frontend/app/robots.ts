import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Pages that must never be indexed (profile, auth, search, groups)
        // use a `noindex` meta tag instead of a disallow here — that lets
        // crawlers actually see the directive rather than being blocked
        // from reading the page at all. Only true dead-ends are disallowed:
        disallow: ['/admin', '/admin/*', '/api/*'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
