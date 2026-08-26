'use client';

import React from 'react';
import { Film, Clapperboard, EyeOff, Camera, Skull, HelpCircle, Flame } from 'lucide-react';

const SARCASTIC_TAKES = [
  {
    icon: '🍿',
    tag: 'Budget Depleted',
    quote: 'Spent 99% of the budget on catering, zero left for a poster.',
    sub: 'Director swears the script is good though.',
    accent: '#f43f5e',
  },
  {
    icon: '🌀',
    tag: 'Nolan Dimension',
    quote: 'Poster got lost inside the 5th dimensional tesseract.',
    sub: 'Hans Zimmer organ intensifies in background.',
    accent: '#a855f7',
  },
  {
    icon: '💤',
    tag: 'Lens Cap On',
    quote: 'Cameraman forgot to remove the lens cap for the promo shoot.',
    sub: 'Still nominated for Best Cinematography.',
    accent: '#fbbf24',
  },
  {
    icon: '✂️',
    tag: 'Censor Board',
    quote: 'Poster deemed too controversial for human eyes.',
    sub: 'Requires a signature from Tarantino to unlock.',
    accent: '#ef4444',
  },
  {
    icon: '🎨',
    tag: 'A24 Abstract',
    quote: 'Too deep, elevated & abstract for a traditional poster.',
    sub: 'Just pretend there is a goat in the middle.',
    accent: '#10b981',
  },
  {
    icon: '🎭',
    tag: 'Plot Twist',
    quote: 'Plot twist: The real poster was the friends we made along the way.',
    sub: 'Directed by M. Night Shyamalan.',
    accent: '#38bdf8',
  },
  {
    icon: '💸',
    tag: 'Vanity Trailer',
    quote: 'Budget spent on the lead actor\'s personal smoothie chef.',
    sub: 'Poster scheduled for release in 2049.',
    accent: '#ec4899',
  },
  {
    icon: '🤷‍♂️',
    tag: 'IMDb Resigned',
    quote: 'IMDb left the chat after reading the opening scene.',
    sub: 'Even Rotten Tomatoes gave up scoring.',
    accent: '#8b5cf6',
  },
];

interface SarcasticPosterFallbackProps {
  title?: string;
  itemCount?: number;
  className?: string;
  seed?: string | number;
}

export function getSarcasticTake(seed: string | number = 0) {
  let num = 0;
  if (typeof seed === 'number') {
    num = Math.abs(seed);
  } else {
    for (let i = 0; i < seed.length; i++) {
      num += seed.charCodeAt(i);
    }
  }
  return SARCASTIC_TAKES[num % SARCASTIC_TAKES.length];
}

export default function SarcasticPosterFallback({
  title,
  itemCount,
  className = '',
  seed = 0,
}: SarcasticPosterFallbackProps) {
  const take = getSarcasticTake(title || seed);

  return (
    <div
      className={`relative w-full h-full min-h-[180px] flex flex-col justify-between p-4 sm:p-5 overflow-hidden select-none ${className}`}
      style={{
        background: 'linear-gradient(145deg, #13131a 0%, #09090d 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Background Accent Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20"
        style={{ background: take.accent }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-15"
        style={{ background: take.accent }}
      />

      {/* Top Header Tag */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md"
          style={{
            background: `${take.accent}15`,
            color: take.accent,
            borderColor: `${take.accent}30`,
          }}
        >
          <span>{take.icon}</span>
          <span>{take.tag}</span>
        </div>

        {itemCount !== undefined && (
          <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
            {itemCount} {itemCount === 1 ? 'film' : 'films'}
          </span>
        )}
      </div>

      {/* Middle Sarcastic Punchline */}
      <div className="relative z-10 my-auto py-3 text-center">
        <div className="text-2xl sm:text-3xl mb-2 drop-shadow-md select-none transform hover:scale-110 transition-transform inline-block">
          {take.icon}
        </div>
        <p className="text-xs sm:text-[13px] font-bold text-white/90 leading-snug tracking-tight px-1">
          "{take.quote}"
        </p>
        <p className="text-[10px] font-medium text-white/40 mt-1.5 line-clamp-1 italic">
          {take.sub}
        </p>
      </div>

      {/* Bottom Title Bar */}
      {title && (
        <div className="relative z-10 pt-2 border-t border-white/[0.06]">
          <p className="text-[11px] font-extrabold text-white/70 truncate text-left">
            🎬 {title}
          </p>
        </div>
      )}
    </div>
  );
}
