import type { Metadata } from 'next';
import CatalogClient from '@/components/CatalogClient';
import { CATALOG_TYPE_MAP } from '@/lib/catalogTypes';
import { absoluteUrl } from '@/lib/seo';

// The catalog types are a fixed, known set and the page shell is fully static
// (the client component fetches its list in the browser). Prerender every
// known variant at build time so this route serves from the CDN instead of a
// function; an unknown type still renders on-demand.
export const dynamicParams = true;

export function generateStaticParams(): { type: string }[] {
  return Object.keys(CATALOG_TYPE_MAP).map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const config = CATALOG_TYPE_MAP[type];
  const path = `/catalog/${type}`;

  const title = config?.title || 'Discover';
  const description = config?.description || 'Discover movies and shows on plotmint.';

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      title,
      description,
      url: absoluteUrl(path),
    },
  };
}

export default function CatalogPage() {
  return <CatalogClient />;
}
