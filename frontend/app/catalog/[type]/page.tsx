import type { Metadata } from 'next';
import CatalogClient from '@/components/CatalogClient';
import { CATALOG_TYPE_MAP } from '@/lib/catalogTypes';
import { absoluteUrl } from '@/lib/seo';

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
