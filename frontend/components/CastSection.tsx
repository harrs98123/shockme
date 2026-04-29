'use client';

import Image from 'next/image';
import { CastMember } from '@/lib/types';
import { posterUrl } from '@/lib/api';
import Link from 'next/link';

interface Props {
  cast: CastMember[];
}

export default function CastSection({ cast }: Props) {
  const visible = cast?.slice(0, 20) || [];
  if (!visible.length) return null;

  return (
    <section className="py-12 bg-black overflow-hidden">
      <div className="container">
        <h2 className="text-xl font-black mb-8 tracking-tight flex items-center gap-3">
          <span className="opacity-70">🎭</span> Full Cast
        </h2>

        <div className="flex gap-6 md:gap-8 overflow-x-auto pb-8 scrollbar-none snap-x px-2 scroll-row">
          {visible.map((member) => (
            <Link
              key={member.id}
              href={`/person/${member.id}`}
              className="flex-shrink-0 w-28 md:w-36 flex flex-col items-center text-center snap-start group cursor-pointer"
            >
              {/* Profile Image Circle */}
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white/5 hover:border-purple-500/50 transition-all duration-500 mb-4 shadow-2xl group cursor-pointer bg-white/5 grayscale-[10%] hover:grayscale-0">
                {member.profile_path ? (
                  <Image
                    src={posterUrl(member.profile_path, 'w185')}
                    alt={member.name}
                    fill
                    sizes="(max-width: 768px) 96px, 128px"
                    className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-700">
                    <span className="text-3xl">🎭</span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10 group-hover:ring-purple-500/30 transition-all" />
              </div>

              {/* Name & Character */}
              <div className="space-y-1">
                <h3 className="text-xs md:text-base font-extrabold text-white leading-tight tracking-tight line-clamp-1">
                  {member.name}
                </h3>
                <p className="text-[10px] md:text-sm font-medium text-white/40 leading-tight line-clamp-2">
                  {member.character}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
