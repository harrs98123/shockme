import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MovieDetailHero from '@/components/MovieDetailHero';
import CastSection from '@/components/CastSection';
import DebateSection from '@/components/DebateSection';
import ExplanationEngine from '@/components/ExplanationEngine';
import AlternateEnding from '@/components/AlternateEnding';
import MoctaleMeter from '@/components/MoctaleMeter';
import SeasonsSection from '@/components/SeasonsSection';
import WatchOrderPanel from '@/components/WatchOrderPanel';
import { absoluteUrl, buildTvSeriesJsonLd, jsonLdScript, posterAbsoluteUrl, toDescription } from '@/lib/seo';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchTV(id: string) {
  try {
    const res = await fetch(`${API_BASE}/movies/${id}?media_type=tv`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
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
  const tv = await fetchTV(id);
  if (!tv) return { title: 'Series not found' };

  const title = tv.name || tv.title || 'Untitled';
  const year = (tv.first_air_date || '').slice(0, 4);
  const pageTitle = year ? `${title} (${year})` : title;
  const description = toDescription(
    tv.overview,
    `Watch trailers, ratings, cast info, and community reviews for ${title} on plotmint.`
  );
  const image = posterAbsoluteUrl(tv.poster_path, 'w780');
  const path = `/tv/${id}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'video.tv_show',
      title: pageTitle,
      description,
      url: absoluteUrl(path),
      images: image ? [{ url: image, width: 780, height: 1170, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function TVPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tv = await fetchTV(id);

  if (!tv) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildTvSeriesJsonLd(tv, `/tv/${id}`))}
      />
      <MovieDetailHero movie={tv} />
      
      {tv.credits?.cast && tv.credits.cast.length > 0 && (
        <CastSection cast={tv.credits.cast} />
      )}

      {/* ── Seasons Section ─────────────────────────────── */}
      {tv.seasons && tv.seasons.length > 0 && (
        <SeasonsSection seasons={tv.seasons} seriesId={tv.id} seriesName={tv.name || tv.title} />
      )}

      {/* ── Community: Moctale Meter + Debates ─────────────── */}
      <div className="container" style={{ padding: '60px 24px' }}>
        <MoctaleMeter movieId={tv.id} mediaType="tv" />
        
        <div style={{ marginTop: '40px' }}>
          <DebateSection movieId={tv.id} mediaType="tv" />
        </div>
      </div>

      <div className="container" style={{ padding: '0 24px 60px' }}>
        <WatchOrderPanel movieId={tv.id} mediaType="tv" />
        <ExplanationEngine movieId={tv.id} mediaType="tv" />
      </div>

      {/* ── Alternate Ending AI ────────────────────────── */}
      <AlternateEnding movieId={tv.id} mediaType="tv" />
    </>
  );
}
