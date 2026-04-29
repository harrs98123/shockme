import { notFound } from 'next/navigation';
import MovieDetailHero from '@/components/MovieDetailHero';
import CastSection from '@/components/CastSection';
import DebateSection from '@/components/DebateSection';
import ExplanationEngine from '@/components/ExplanationEngine';
import AlternateEnding from '@/components/AlternateEnding';
import MoctaleMeter from '@/components/MoctaleMeter';
import VerdictBattleSection from '@/components/VerdictBattle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchMovie(id: string) {
  try {
    const res = await fetch(`${API_BASE}/movies/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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
                <ExplanationEngine movieId={movie.id} mediaType="movie" />
                <VerdictBattleSection movieId={movie.id} mediaType="movie" />
                <AlternateEnding movieId={movie.id} mediaType="movie" />
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}

