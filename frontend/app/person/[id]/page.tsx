'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Film,
  Star,
  User,
  Globe,
  Link as LinkIcon
} from 'lucide-react';
import { publicApi, posterUrl } from '@/lib/api';
import { PersonDetails } from '@/lib/types';

export default function PersonPage() {
  const { id } = useParams();
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    publicApi.getPersonDetails(id as string)
      .then(data => {
        if (data.error) setError(data.error);
        else setPerson(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const socialLinks = useMemo(() => {
    if (!person?.external_ids) return [];
    const links = [];
    if (person.external_ids.instagram_id) {
      links.push({ icon: <Globe size={18} />, url: `https://instagram.com/${person.external_ids.instagram_id}`, label: 'Instagram' });
    }
    if (person.external_ids.twitter_id) {
      links.push({ icon: <LinkIcon size={18} />, url: `https://twitter.com/${person.external_ids.twitter_id}`, label: 'Twitter' });
    }
    if (person.external_ids.imdb_id) {
      links.push({ icon: <span className="font-black text-[10px]">IMDb</span>, url: `https://imdb.com/name/${person.external_ids.imdb_id}`, label: 'IMDb' });
    }
    return links;
  }, [person]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-6">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
          <User size={32} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Something went wrong</h1>
        <p className="text-white/40 mb-8 max-w-md text-center">{error || 'We couldn\'t find the profile you were looking for.'}</p>
        <Link href="/" className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">Return Home</Link>
      </div>
    );
  }

  const sortedFilmography = [...person.filmography].sort((a, b) => {
    const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
    const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 selection:bg-blue-500/30">

      {/* ── Minimal Header Section (Matching Image) ───────────────────────── */}
      <div className="relative w-full pt-32 pb-24 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131b2f] via-[#050505] to-[#050505]">

        <div className="container relative z-10 px-6 md:px-12">

          {/* Navigation */}
          <div className="absolute top-0 left-6 md:left-12 flex items-center justify-between w-full">
            <Link href="/" className="flex items-center gap-3 text-white/50 hover:text-white transition-all group">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all group-hover:-translate-x-1">
                <ChevronLeft size={18} />
              </div>
              <span className="font-bold text-xs tracking-widest uppercase hidden md:block">Back</span>
            </Link>
          </div>

          {/* Profile Layout */}
          <div className="flex flex-col md:flex-row items-center md:items-center gap-8 mt-12">

            {/* Circular Profile Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring', damping: 20 }}
              className="relative shrink-0"
            >
              <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-2xl ring-1 ring-white/10">
                {person.profile_path ? (
                  <Image
                    src={posterUrl(person.profile_path, 'h632')}
                    alt={person.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                    <User size={64} className="text-white/10" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Name & Details */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
              >
                {person.name}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex gap-12"
              >
                {person.birthday && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-white/50">Born</span>
                    <p className="text-sm font-semibold text-white">
                      {new Date(person.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {person.place_of_birth && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-white/50">Birthplace</span>
                    <p className="text-sm font-semibold text-white">
                      {person.place_of_birth}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Social Links Sub-row */}
              {socialLinks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 mt-8"
                >
                  {socialLinks.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/60 hover:text-white"
                      title={s.label}
                    >
                      {s.icon}
                    </a>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Grid ─────────────────────────────────────────────────── */}
      <div className="container px-6 md:px-12 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-16">

          {/* Main Content: Bio & Works */}
          <div className="space-y-20">

            {/* Biography */}
            <section>
              <h2 className="text-2xl font-bold mb-6 tracking-tight text-white/90">Biography</h2>
              <div className="text-lg leading-relaxed text-white/60 space-y-6 font-normal">
                {person.biography ? (
                  person.biography.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))
                ) : (
                  <p>A full biography is not available for this individual yet.</p>
                )}
              </div>
            </section>

            {/* Filmography Visual Grid */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-white/90">
                  Filmography
                </h2>
                <span className="text-xs text-white/40 font-medium">
                  {person.filmography.length} Credits
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-10 gap-x-6">
                {sortedFilmography.map((item, idx) => (
                  <motion.div
                    key={`${item.id}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: (idx % 4) * 0.1 }}
                    className="group"
                  >
                    <Link href={`/${item.media_type}/${item.id}`} className="block">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#111] border border-white/5 transition-all duration-500 group-hover:border-white/20">
                        {item.poster_path ? (
                          <Image
                            src={posterUrl(item.poster_path, 'w500')}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 20vw"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center opacity-20">
                            <Film size={32} className="mb-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.title}</span>
                          </div>
                        )}

                        {/* Rating Overlay */}
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold flex items-center gap-1">
                          <Star size={10} className="text-yellow-500 fill-yellow-500" />
                          {item.vote_average.toFixed(1)}
                        </div>
                      </div>

                      <div className="mt-4 space-y-1">
                        <h3 className="font-semibold text-sm leading-tight text-white/90 group-hover:text-white transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-white/40">
                          <span>{item.release_date ? item.release_date.slice(0, 4) : 'TBA'}</span>
                          {item.character && (
                            <>
                              <span className="w-1 h-1 bg-white/20 rounded-full" />
                              <span className="truncate max-w-[120px] text-white/60">{item.character}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar / Info */}
          <div className="space-y-8">
            <div className="space-y-8">
              <div>
                <p className="text-[11px] font-medium text-white/50 mb-1">Main Department</p>
                <p className="text-sm font-semibold text-white/90">{person.known_for_department}</p>
              </div>

              {person.deathday && (
                <div>
                  <p className="text-[11px] font-medium text-white/50 mb-1">Passed Away</p>
                  <p className="text-sm font-semibold text-white/90">{new Date(person.deathday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              )}

              {/* Additional Images */}
              {person.images && person.images.length > 1 && (
                <div className="pt-8 border-t border-white/5">
                  <p className="text-[11px] font-medium text-white/50 mb-4">Gallery</p>
                  <div className="grid grid-cols-3 gap-2">
                    {person.images.slice(1, 7).map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[#111]">
                        <Image
                          src={posterUrl(img.file_path, 'w185')}
                          alt=""
                          fill
                          className="object-cover opacity-60 hover:opacity-100 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}