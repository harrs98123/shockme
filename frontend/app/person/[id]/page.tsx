import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PersonProfileClient from '@/components/PersonProfileClient';
import { PersonDetails } from '@/lib/types';
import { absoluteUrl, buildPersonJsonLd, jsonLdScript, posterAbsoluteUrl, toDescription } from '@/lib/seo';
import { BACKEND_FETCH_HEADERS } from '@/lib/backendFetch';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Filmography changes rarely; a day-long window keeps Vercel from regenerating
// and re-transferring this route hourly for every crawled person id.
export const revalidate = 86400;
export const dynamicParams = true;

// Empty list — nothing is prebuilt — but declaring this opts the route into
// full-route ISR (static shell cached at the CDN, regenerated on the
// revalidate interval) instead of rendering in a function on every request.
export function generateStaticParams(): { id: string }[] {
  return [];
}

async function fetchPerson(id: string): Promise<PersonDetails | null> {
  try {
    const res = await fetch(`${API_BASE}/movies/person/${id}`, { next: { revalidate }, headers: BACKEND_FETCH_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.error) return null;
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
  const person = await fetchPerson(id);
  if (!person) return { title: 'Person not found' };

  const description = toDescription(
    person.biography,
    `${person.name}'s filmography, biography, and credits — known for ${person.known_for_department}.`
  );
  const image = posterAbsoluteUrl(person.profile_path, 'w500');
  const path = `/person/${id}`;

  return {
    title: person.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'profile',
      title: person.name,
      description,
      url: absoluteUrl(path),
      images: image ? [{ url: image, width: 500, height: 750, alt: person.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: person.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await fetchPerson(id);

  if (!person) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildPersonJsonLd(person, `/person/${id}`))}
      />
      <PersonProfileClient person={person} />
    </>
  );
}
