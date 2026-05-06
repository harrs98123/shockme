'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Turnstile } from '@marsidev/react-turnstile';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Media } from '@/lib/types';
import { backdropUrl, posterUrl, releaseYear } from '@/lib/api';
import FavoriteButton from './FavoriteButton';
import WatchlistButton from './WatchlistButton';
import WatchedButton from './WatchedButton';
import StarRating from './StarRating';
import AddToCollectionButton from './AddToCollectionButton';
import WhereToWatch from './WhereToWatch';
import { Bell, ShieldCheck, Trash2, Star, Users, Globe, Languages, Activity } from 'lucide-react';
import { InterestInfo, MustWatch } from '@/lib/types';
import api, { adminApi, publicApi } from '@/lib/api';
import VibeChart from './VibeChart';
import dynamic from 'next/dynamic';

const StealthPlayer = dynamic(() => import('./TelemetryAnalyzer'), { ssr: false });


interface Props {
  movie: Media;
}

export default function MovieDetailHero({ movie }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isTV = !movie.title && !!movie.name;
  const title = movie.title || movie.name || 'Untitled';
  const mediaType = isTV ? 'tv' : 'movie';
  const dateStr = movie.release_date || movie.first_air_date;
  const year = releaseYear(dateStr);
  const director = movie.credits?.crew?.find((c) => c.job === 'Director' || c.job === 'Executive Producer');
  const language = 'English';

  const isUpcoming = dateStr ? new Date(dateStr) > new Date() : false;
  const [isInterested, setIsInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(0);

  const trailer = movie.videos?.results?.find(
    (v: any) => v.type === 'Trailer' && v.site === 'YouTube' && (v.name.toLowerCase().includes('official') || v.name.toLowerCase().includes('main'))
  ) || movie.videos?.results?.find(
    (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
  ) || movie.videos?.results?.find(
    (v: any) => (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip') && v.site === 'YouTube'
  );

  const [isAdmin, setIsAdmin] = useState(false);
  const [isInMustWatch, setIsInMustWatch] = useState(false);
  const [isUpdatingMW, setIsUpdatingMW] = useState(false);
  const [playTrailer, setPlayTrailer] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isUnlockedSecret, setIsUnlockedSecret] = useState(false);
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [provisionedToken, setProvisionedToken] = useState<string | null>(null);
  const [customTrailerUrl, setCustomTrailerUrl] = useState<string | null>(null);
  const secretInputRef = useRef<HTMLInputElement>(null);
  const [keyBuffer, setKeyBuffer] = useState('');

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Don't capture if we are already typing in the secret input
      if (document.activeElement === secretInputRef.current) return;

      const newBuffer = (keyBuffer + e.key.toLowerCase()).slice(-4);
      setKeyBuffer(newBuffer);

      if (newBuffer === 'aman') {
        const verboseLogging = process.env.NEXT_PUBLIC_SYSTEM_VERBOSE_LOGGING !== 'false';

        if (!verboseLogging) {
          setShowSecretInput(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [keyBuffer]);

  useEffect(() => {
    if (showSecretInput && secretInputRef.current) {
      secretInputRef.current.focus();
    }
  }, [showSecretInput]);

  useEffect(() => {
    setIsUnlockedSecret(localStorage.getItem('cinematch_pirate_unlocked') === '1');
    const userStr = localStorage.getItem('cinematch_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setIsAdmin(!!u.is_admin);

      // If admin, check if this movie is already in Must Watch
      if (u.is_admin) {
        adminApi.getMustWatch()
          .then((list: MustWatch[]) => {
            const found = list.some(mw => mw.movie_id === movie.id);
            setIsInMustWatch(found);
          })
          .catch(err => console.error("Failed to check Must Watch status", err));
      }
    }

    // Fetch custom info (trailer, etc.)
    publicApi.getCustomInfo(movie.id)
      .then(data => {
        if (data.trailer_url) setCustomTrailerUrl(data.trailer_url);
      })
      .catch(err => {});

    // Auto-provision stealth token if already unlocked
    const unlocked = localStorage.getItem('cinematch_pirate_unlocked') === '1';
    if (unlocked) {
      const tmdbId = (movie as any).movie_id || movie.id;
      api.post('/telemetry/provision', {
        id: tmdbId,
        media_type: mediaType
      }).then(res => {
        if (res.data?.token) setProvisionedToken(res.data.token);
      }).catch(() => {
        // If provision fails (token expired or unauthorized), lock the feature
        localStorage.removeItem('cinematch_pirate_unlocked');
        setIsUnlockedSecret(false);
      });
    }
  }, [movie.id, mediaType]);

  const handleMustWatchToggle = async () => {
    if (!isAdmin) return;
    setIsUpdatingMW(true);
    try {
      if (isInMustWatch) {
        await adminApi.removeMustWatch(movie.id);
        setIsInMustWatch(false);
      } else {
        await adminApi.addMustWatch(movie);
        setIsInMustWatch(true);
      }
    } catch (err) {
      console.error("Failed to toggle Must Watch", err);
    } finally {
      setIsUpdatingMW(false);
    }
  };

  useEffect(() => {
    if (isUpcoming) {
      const fetchInterest = async () => {
        const user = localStorage.getItem('cinematch_user');
        const userId = user ? JSON.parse(user).id : null;
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        try {
          const res = await fetch(`${API_BASE}/interests/${movie.id}${userId ? `?user_id=${userId}` : ''}`);
          if (res.ok) {
            const data: InterestInfo = await res.json();
            setIsInterested(data.user_interested);
            setInterestCount(data.count);
          }
        } catch (err) {
          console.error('Failed to fetch interest info:', err);
        }
      };
      fetchInterest();
    }
  }, [movie.id, isUpcoming]);

  const handleInterestToggle = async () => {
    const token = localStorage.getItem('cinematch_token');
    if (!token) {
      alert("Please log in to express interest.");
      return;
    }

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/interests/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          movie_id: movie.id,
          media_type: mediaType,
          title: title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          release_date: dateStr
        })
      });
      if (res.ok) {
        const data: InterestInfo = await res.json();
        setIsInterested(data.user_interested);
        setInterestCount(data.count);
      }
    } catch (err) {
      console.error('Failed to toggle interest:', err);
    }
  };

  const handleTelemetrySync = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = (e.target as HTMLInputElement).value;

      try {
        // Use priority TMDB ID extraction
        const tmdbId = (movie as any).movie_id || movie.id;
        
        // 1. Provision an encrypted token first
        const provisionRes = await api.post('/telemetry/provision', {
          id: tmdbId,
          media_type: mediaType
        });
        
        const token = provisionRes.data?.token;

        // 2. Perform sync with the provisioned token and cloaked fields
        const isDev = process.env.NODE_ENV === 'development';
        const res = await api.post('/telemetry/sync', {
          cid: tmdbId,
          sid: code,
          stk: isDev ? 'DEV_PASS' : (turnstileToken || 'DEV_PASS')
        });

        if (res.data?.status === 'synchronized') {
          localStorage.setItem('cinematch_pirate_unlocked', '1');
          setProvisionedToken(token);
          setIsUnlockedSecret(true);
          setShowSecretInput(false);
          setTurnstileToken(null);
          // Auto-open player after success
          setIsPlayerOpen(true);
        }
      } catch (err: any) {
        const detail = err.response?.data?.detail || "System rejected diagnostic request.";
        alert(`SYNC ERROR: ${detail}\nCheck system logs for telemetry density requirements.`);
      }
      (e.target as HTMLInputElement).value = '';
    }
  };

  return (
    <section style={{ background: '#000', color: '#fff', position: 'relative' }}>

      {/* 1. Backdrop / Trailer Section (Widescreen) */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: (isUpcoming || playTrailer) ? '16/9' : '21/7', overflow: 'hidden', backgroundColor: '#000', transition: 'aspect-ratio 0.5s ease' }}>
        {customTrailerUrl ? (
          <video
            src={customTrailerUrl}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ) : (isUpcoming || playTrailer) && trailer ? (
          <iframe
            src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=0&controls=1&loop=${isUpcoming ? '1' : '0'}&playlist=${trailer.key}&rel=0&modestbranding=1&hl=en&vq=hd1080&hd=1`}
            title="Movie Trailer"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100vw',
              height: '56.25vw', // 16:9 ratio
              transform: 'translate(-50%, -50%)',
              border: 'none',
            }}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        ) : (
          <Image
            src={backdropUrl(movie.backdrop_path, 'original')}
            alt={title}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
        )}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: isUpcoming
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,1) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: (isUpcoming || playTrailer) ? 'none' : 'auto'
        }}>

          {/* Play Icon Overlay & Watch Movie Unlock */}
          {!isUpcoming && !playTrailer && (
            <div className="flex flex-col md:flex-row items-center gap-8">
              {trailer && (
                <motion.div
                  onClick={() => setPlayTrailer(true)}
                  whileHover={{ scale: 1.1 }}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                  title="Play Trailer"
                >
                  <div style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '22px solid white', marginLeft: 6 }} />
                </motion.div>
              )}

              {isUnlockedSecret && (
                <motion.button
                  onClick={() => setIsPlayerOpen(true)}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    backgroundColor: '#8B5CF6', // Purple
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Activity size={18} />
                  Access Feed
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>


      {/* 2. Content Section */}
      <div className="container relative z-10 -mt-20 lg:-mt-28 pb-24 lg:pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-8 lg:gap-12 items-start">

          {/* Column 1: Poster */}
          <div className="w-56 lg:w-full mx-auto lg:mx-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0 lg:sticky lg:top-24">
            <Image
              src={posterUrl(movie.poster_path, 'w500')}
              alt={title}
              width={220}
              height={330}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Column 2: Main Info & Content */}
          <div className="flex flex-col gap-10 min-w-0">
            {/* Header Info */}
            <div className="pt-4 lg:pt-8">
              <p className="text-white/60 text-sm font-medium mb-2 uppercase tracking-wide">
                {isTV ? 'Series' : 'Movie'} • {year} • {isTV ? `${movie.episode_run_time?.[0] || 45}m per ep` : (movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '2h 15m')}
              </p>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black mb-10 tracking-tight leading-tight">
                {title}
              </h1>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">Directed By</span>
                  <span className="text-base font-bold text-white line-clamp-1">
                    {movie.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">Country</span>
                  <span className="text-base font-bold text-white">
                    {movie.production_countries?.[0]?.name || movie.origin_country?.[0] || 'United States'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">Language</span>
                  <span className="text-base font-bold text-white">
                    {movie.spoken_languages?.[0]?.english_name || movie.original_language?.toUpperCase() || 'English'}
                  </span>
                </div>
                <div
                  className="flex flex-col gap-1"
                  style={{ cursor: 'default' }}
                >
                  <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">Age Rating</span>
                  <span className="text-base font-bold text-white select-none">
                    {(() => {
                      if (isTV) return movie.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'US')?.rating || 'TV-MA';
                      return movie.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US')?.release_dates?.find((rd: any) => rd.certification)?.certification || 'PG-13';
                    })()}
                  </span>
                </div>
              </div>

              {/* Secret Input Bar (conditionally rendered) */}
              <AnimatePresence>
                {showSecretInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: -24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="mb-8 overflow-hidden"
                  >
                    <div className="flex flex-col gap-3">
                      <input
                        ref={secretInputRef}
                        type="password"
                        autoComplete="new-password"
                        data-nosnippet
                        placeholder="System terminal..."
                        onKeyDown={handleTelemetrySync}
                        className="w-[200px] bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-white/30 backdrop-blur-md"
                      />
                      <div className="scale-[0.8] origin-left">
                        <Turnstile
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                          onSuccess={(token) => setTurnstileToken(token)}
                          options={{ theme: 'dark' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Watch Providers */}
              {movie['watch/providers'] && (
                <div className="max-w-md">
                  <WhereToWatch
                    movieId={movie.id}
                    watchProviders={movie['watch/providers']}
                    minimal={true}
                    title={title}
                  />
                </div>
              )}

              {/* Mobile-only Core Actions */}
              <div className="lg:hidden mt-8 flex flex-col gap-4">
                {!isUpcoming ? (
                  <>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <StarRating movieId={movie.id} media_type={mediaType} />
                    </div>
                    <WatchedButton movie={movie} variant="purple" />
                  </>
                ) : (
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-3">
                    <div className="text-3xl font-black text-purple-500">{interestCount}</div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-[2px]">Interested</div>
                    <button
                      onClick={handleInterestToggle}
                      className={`w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-3 transition-all ${isInterested
                        ? 'bg-transparent text-purple-400 border border-purple-500/50'
                        : 'bg-purple-600 text-white border border-purple-400/30'
                        }`}
                    >
                      <Bell size={18} fill={isInterested ? 'currentColor' : 'none'} />
                      {isInterested ? 'INTERESTED' : 'NOTIFY ME'}
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {!isUpcoming && <FavoriteButton movie={movie} variant="dark" />}
                  <WatchlistButton movie={movie} variant="dark" />
                </div>
              </div>
            </div>

            {/* Overview Section */}
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
              <h2 className="text-2xl font-extrabold mb-4 font-heading">Overview</h2>
              <p className="text-lg lg:text-xl leading-relaxed text-white/70 max-w-3xl mb-8">
                {movie.overview}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-3">
                {movie.genres?.map((g) => (
                  <div
                    key={g.id}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-semibold hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
                  >
                    {g.name}
                  </div>
                ))}
                {movie.genres?.some(g => g.name === 'Family') && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm font-semibold shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <Users size={16} />
                    Family Friendly
                  </div>
                )}
              </div>
            </div>

            {/* Screenshots Gallery */}
            {movie.images?.backdrops && movie.images.backdrops.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
                <h3 className="text-xl font-extrabold mb-6 tracking-tight font-heading">Screenshots</h3>
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-none snap-x mask-fade-right">
                  {movie.images.backdrops.slice(0, 15).map((img, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02, y: -4 }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedImage(backdropUrl(img.file_path, 'original'))}
                      className="relative shrink-0 w-72 md:w-80 aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-xl cursor-pointer bg-white/5 snap-start"
                    >
                      <Image
                        src={backdropUrl(img.file_path, 'w500')}
                        alt={`Screenshot ${i + 1}`}
                        fill
                        sizes="320px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Actions & Rating Sidebar */}
          <div className="hidden lg:flex flex-col gap-6 w-full md:max-w-xs mx-auto lg:mx-0 lg:sticky lg:top-24">
            {!isUpcoming ? (
              <div className="flex flex-col gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <StarRating movieId={movie.id} media_type={mediaType} />
                </div>
                <WatchedButton movie={movie} variant="purple" />
              </div>
            ) : (
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-3">
                <div className="text-3xl font-black text-purple-500">{interestCount}</div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-[2px]">People are Interested</div>
                <button
                  onClick={handleInterestToggle}
                  className={`w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-3 transition-all ${isInterested
                    ? 'bg-transparent text-purple-400 border border-purple-500/50'
                    : 'bg-purple-600 text-white border border-purple-400/30 shadow-lg shadow-purple-500/20'
                    }`}
                >
                  <Bell size={18} fill={isInterested ? 'currentColor' : 'none'} />
                  {isInterested ? 'INTERESTED' : 'NOTIFY ME'}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              {!isUpcoming && <FavoriteButton movie={movie} variant="dark" />}
              <WatchlistButton movie={movie} variant="dark" />
            </div>

            <AddToCollectionButton movie={movie} showRankButton={true} />

            {/* Admin Controls */}
            {isAdmin && (
              <div className="mt-2 pt-4 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={handleMustWatchToggle}
                  disabled={isUpdatingMW}
                  className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-3 transition-all ${isInMustWatch
                    ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                    : 'bg-white/5 text-white/70 border border-white/10'
                    }`}
                >
                  {isInMustWatch ? <Trash2 size={16} /> : <Star size={16} />}
                  {isInMustWatch ? 'REMOVE FROM MUST WATCH' : 'ADD TO MUST WATCH'}
                </button>
                <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  <ShieldCheck size={10} /> ADMIN PRIVILEGES
                </div>
              </div>
            )}

            {movie.genres && movie.genres.length > 0 && (
              <div className="animate-in fade-in duration-1000 delay-300">
                <VibeChart genres={movie.genres} />
              </div>
            )}
          </div>

          {/* Mobile-only secondary actions & Vibe Chart at the bottom */}
          <div className="lg:hidden flex flex-col gap-6">
            <AddToCollectionButton movie={movie} showRankButton={true} />

            {isAdmin && (
              <div className="mt-2 pt-4 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={handleMustWatchToggle}
                  disabled={isUpdatingMW}
                  className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-3 transition-all ${isInMustWatch
                    ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                    : 'bg-white/5 text-white/70 border border-white/10'
                    }`}
                >
                  {isInMustWatch ? <Trash2 size={16} /> : <Star size={16} />}
                  {isInMustWatch ? 'REMOVE FROM MUST WATCH' : 'ADD TO MUST WATCH'}
                </button>
              </div>
            )}

            {movie.genres && movie.genres.length > 0 && (
              <VibeChart genres={movie.genres} />
            )}
          </div>
        </div>
      </div>

      {/* 5. Full Screen Stealth Player Modal */}
      <AnimatePresence>
        {isPlayerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              backgroundColor: '#000',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'default',
              overflow: 'hidden'
            }}
          >

            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: 'absolute',
                top: 30,
                right: 30,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                width: 44,
                height: 44,
                borderRadius: '50%',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 2010,
                backdropFilter: 'blur(20px)'
              }}
              onClick={() => {
                setIsPlayerOpen(false);
                document.body.style.overflow = 'auto'; // Restore scroll
              }}
            >
              ✕
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <StealthPlayer token={provisionedToken} />
            </motion.div>

            <style>{`
              @keyframes pulse {
                0% { transform: scale(0.9); opacity: 0.5; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(0.9); opacity: 0.5; }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              backgroundColor: 'rgba(0,0,0,0.95)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              cursor: 'zoom-out'
            }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: 'absolute',
                top: 30,
                right: 30,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                width: 50,
                height: 50,
                borderRadius: '50%',
                fontSize: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1001
              }}
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '1400px', maxHeight: '80vh' }}>
                <Image
                  src={selectedImage!}
                  alt="Fullscreen screenshot"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
