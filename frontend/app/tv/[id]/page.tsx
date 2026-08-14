import { notFound } from 'next/navigation';
import MovieDetailHero from '@/components/MovieDetailHero';
import CastSection from '@/components/CastSection';
import DebateSection from '@/components/DebateSection';
import ExplanationEngine from '@/components/ExplanationEngine';
import AlternateEnding from '@/components/AlternateEnding';
import MoctaleMeter from '@/components/MoctaleMeter';
import SeasonsSection from '@/components/SeasonsSection';
import WatchOrderPanel from '@/components/WatchOrderPanel';

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
