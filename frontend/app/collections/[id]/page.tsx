import type { Metadata } from 'next';
import CollectionDetailClient from '@/components/CollectionDetailClient';
import { absoluteUrl, posterAbsoluteUrl, toDescription } from '@/lib/seo';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CollectionPreview {
  name: string;
  description: string | null;
  is_public: boolean;
  cover_poster: string | null;
  item_count: number;
}

// Unauthenticated preview fetch, purely for metadata/OG tags — mirrors what a
// logged-out crawler would see. Private collections simply fall back to
// generic metadata below; the client component still fetches the full,
// auth-aware collection data for actual rendering.
async function fetchCollectionPreview(id: string): Promise<CollectionPreview | null> {
  try {
    const res = await fetch(`${API_BASE}/collections/${id}`, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.is_public) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const collection = await fetchCollectionPreview(id);
  const path = `/collections/${id}`;

  if (!collection) {
    return {
      title: 'Collection',
      alternates: { canonical: path },
    };
  }

  const description = toDescription(
    collection.description,
    `A curated collection of ${collection.item_count} titles on plotmint.`
  );
  const image = posterAbsoluteUrl(collection.cover_poster, 'w500');

  return {
    title: collection.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      title: collection.name,
      description,
      url: absoluteUrl(path),
      images: image ? [{ url: image, width: 500, height: 750, alt: collection.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: collection.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionDetailClient id={id} />;
}
