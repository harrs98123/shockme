import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MovieDetailHero from '@/components/MovieDetailHero';
import CastSection from '@/components/CastSection';
import DebateSection from '@/components/DebateSection';
import ExplanationEngine from '@/components/ExplanationEngine';
import AlternateEnding from '@/components/AlternateEnding';
import MoctaleMeter from '@/components/MoctaleMeter';
import VerdictBattleSection from '@/components/VerdictBattle';
import WatchOrderPanel from '@/components/WatchOrderPanel';
import CommunityPosts from '@/components/CommunityPosts';
import { absoluteUrl, buildMovieJsonLd, jsonLdScript, posterAbsoluteUrl, toDescription } from '@/lib/seo';
import { BACKEND_FETCH_HEADERS } from '@/lib/backendFetch';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchMovie(id: string) {
  try {
    const res = await fetch(`${API_BASE}/movies/${id}`, { next: { revalidate: 300 }, headers: BACKEND_FETCH_HEADERS });
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
  const movie = await fetchMovie(id);
  if (!movie) return { title: 'Movie not found' };

  const title = movie.title || movie.name || 'Untitled';
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const pageTitle = year ? `${title} (${year})` : title;
  const description = toDescription(
    movie.overview,
    `Watch trailers, ratings, cast info, and community reviews for ${title} on plotmint.`
  );
  const image = posterAbsoluteUrl(movie.poster_path, 'w780');
  const path = `/movie/${id}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'video.movie',
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

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await fetchMovie(id);

  if (!movie) notFound();

  const releaseDate = movie.release_date || movie.first_air_date;
  const isUpcoming = releaseDate ? new Date(releaseDate) > new Date() : false;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildMovieJsonLd(movie, `/movie/${id}`))}
      />
      <div className="bg-black">
        <MovieDetailHero movie={movie} />

        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <CastSection cast={movie.credits.cast} />
        )}

        {/* ── Community Sections: Hidden for Upcoming Movies ────────────────── */}
        {!isUpcoming && (
          <div className="container" style={{ padding: '60px 24px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] xl:grid-cols-[65%_35%] gap-12 items-start">

              {/* Left Column: Moctale Meter (Reviews) & Debates */}
              <div className="flex flex-col gap-12">
                <MoctaleMeter movieId={movie.id} mediaType="movie" />
                <DebateSection movieId={movie.id} mediaType="movie" />
              </div>

              {/* Right Column: AI & Extras (Compact) */}
              <div className="flex flex-col gap-12">
                <WatchOrderPanel movieId={movie.id} mediaType="movie" />
                <ExplanationEngine movieId={movie.id} mediaType="movie" />
                <VerdictBattleSection movieId={movie.id} mediaType="movie" />
                <AlternateEnding movieId={movie.id} mediaType="movie" />
              </div>

            </div>
            
            {/* ─── Community Posts (New Social Hub) ───────────────────────── */}
            <div className="mt-12">
              <CommunityPosts movieId={movie.id} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

