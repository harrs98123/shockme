'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlotmintLogo from '@/components/PlotmintLogo';
import {
  Film,
  Compass,
  Tv,
  Users,
  Trophy,
  Gem,
  Globe,
  Send,
  Check,
  Calendar,
  Layers,
  Search,
  Flame,
  Shuffle,
  Radio,
  Clapperboard,
  Coffee,
  Eye,
  SlidersHorizontal,
  Tag,
  Download,
  Smartphone,
} from 'lucide-react';

const GithubIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const TwitterIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const StackedBarsIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <g>
      <path d="M3 4L15 9L19 7L7 2Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 4V6L15 11V9Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M15 9V11L19 9V7Z" fill="currentColor" fillOpacity="0.8" />
    </g>
    <g>
      <path d="M3 10L15 15L19 13L7 8Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 10V12L15 17V15Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M15 15V17L19 15V13Z" fill="currentColor" fillOpacity="0.8" />
    </g>
    <g>
      <path d="M3 16L15 21L19 19L7 14Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 16V18L15 23V21Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M15 21V23L19 21V19Z" fill="currentColor" fillOpacity="0.8" />
    </g>
  </svg>
);

const AndroidIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003 0-.551.4482-.9993.9993-.9993.551 0 .9993.4483.9993.9993 0 .5517-.4483 1.0003-.9993 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003 0-.551.4482-.9993.9993-.9993.5511 0 .9993.4483.9993.9993 0 .5517-.4482 1.0003-.9993 1.0003m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125c-1.8533 0-3.5902.2866-5.1368.8247L4.8409 5.4467a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3438 14.6589 0 18.7917h24c-.3438-4.1328-2.6889-7.605-6.1185-9.4703" />
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
    }, 4000);
  };

  const navigationColumns = [
    {
      title: 'Discover & Watch',
      icon: Compass,
      links: [
        { label: 'Cinephile Feed', href: '/feed', badge: 'Live Pulse', icon: StackedBarsIcon },
        { label: 'Must Watch', href: '/must-watch', badge: 'Top Rated', icon: Eye },
        { label: 'Upcoming Radar', href: '/upcoming', badge: 'Countdown', icon: Calendar },
        { label: 'Movie Finder', href: '/finder', icon: SlidersHorizontal },
        { label: 'Mood Matcher', href: '/mood', icon: Coffee },
        { label: 'Swipe Cinema', href: '/swipe', badge: 'Tinder Mode', icon: Shuffle },
        { label: 'Android App', href: '/android.apk', badge: 'APK v1.0', icon: Smartphone, download: 'android.apk' },
      ],
    },
    {
      title: 'Community & Squads',
      icon: Users,
      links: [
        { label: 'Watch Parties', href: '/watch-parties', badge: 'Sync', icon: Tv },
        { label: 'Cinephile Groups', href: '/groups', icon: Users },
        { label: 'Curated Collections', href: '/collections', icon: Layers },
        { label: 'Tier List Maker', href: '/tierlist', icon: Trophy },
        { label: 'Box Office Predictions', href: '/predictions', icon: Flame },
      ],
    },
    {
      title: 'Universes & Deep Dive',
      icon: Clapperboard,
      links: [
        { label: 'Cinematic Universe', href: '/universe', icon: Globe },
        { label: 'Hidden Gems', href: '/gems', badge: 'Curated', icon: Gem },
        { label: 'TV Series Explorer', href: '/tv', icon: Tv },
        { label: 'Master Catalog', href: '/catalog', icon: Film },
        { label: 'Search & Deep Cast', href: '/search', icon: Search },
      ],
    },
  ];

  const popularTopics = [
    { label: 'Christopher Nolan', href: '/search?q=Christopher+Nolan' },
    { label: 'A24 Masterpieces', href: '/collections' },
    { label: 'Cyberpunk & Sci-Fi', href: '/finder?genre=878' },
    { label: 'Psychological Thrillers', href: '/finder?genre=53' },
    { label: 'Studio Ghibli', href: '/search?q=Studio+Ghibli' },
    { label: 'Neo-Noir', href: '/finder' },
    { label: 'Quentin Tarantino', href: '/search?q=Quentin+Tarantino' },
    { label: 'Mind-Bending Endings', href: '/feed' },
  ];

  return (
    <footer className="relative mt-auto border-t border-white/[0.08] bg-[#08080b] text-white overflow-hidden select-none">
      {/* ── Ambient Background Glow Effects ── */}
      <div
        className="pointer-events-none absolute -top-40 left-1/4 h-[350px] w-[500px] -translate-x-1/2 rounded-full opacity-15 blur-[140px]"
        style={{ background: 'radial-gradient(circle, #e50914 0%, #a855f7 50%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-10 h-[300px] w-[400px] rounded-full opacity-10 blur-[130px]"
        style={{ background: 'radial-gradient(circle, #38bdf8 0%, #34d399 60%, transparent 80%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* ── Top Section: Cinephile Dispatch Newsletter Banner ── */}
        <div className="relative mb-16 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111116] p-8 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="lg:col-span-6 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                <span>The Cinephile Dispatch</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Never Miss a <span className="text-[#E50914]">Masterpiece</span>
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
                Get weekly secret screenings, hot community takes, trending watch parties, and algorithmic hidden gems delivered to your inbox.
              </p>
            </div>

            {/* Right Form - Solid Action Button (No Gradients) */}
            <div className="lg:col-span-6">
              <form onSubmit={handleSubscribe} className="relative flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="email"
                    placeholder="Enter your cinephile email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={subscribed}
                    className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-3.5 text-sm text-white placeholder-neutral-500 backdrop-blur-md transition-all focus:border-white/30 focus:bg-black/70 focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-60"
                  />
                </div>

                {/* Solid High-Contrast Button */}
                <button
                  type="submit"
                  disabled={subscribed}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-black transition-all cursor-pointer ${subscribed
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                      : 'bg-white text-black hover:bg-neutral-200 active:scale-95 shadow-md shadow-white/10'
                    }`}
                >
                  {subscribed ? (
                    <>
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Subscribed!</span>
                    </>
                  ) : (
                    <>
                      <span>Join Dispatch</span>
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Stats Ticker */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  500,000+ Movies
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  Live Sync Parties
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E50914]" />
                  Real-time Feed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Navigation Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/[0.07]">
          {/* Brand Info & Tagline (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="inline-block focus:outline-none">
              <PlotmintLogo size="large" />
            </Link>

            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              The next-generation social platform for film lovers. Discover what to watch next, curate custom tier lists, host live watch parties, and debate cinema with a global community.
            </p>

            {/* Live Operational Status Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-neutral-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>All Systems Operational</span>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-400">TMDB API v3 Synced</span>
            </div>

            {/* Download Android APK Button in Footer Brand Column */}
            <div className="pt-2">
              <a
                href="/android.apk"
                download="android.apk"
                className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-neutral-200 backdrop-blur-md transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/[0.08] hover:text-white hover:shadow-[0_0_20px_rgba(0,229,153,0.15)] active:scale-95 cursor-pointer"
              >
                <AndroidIcon size={14} className="text-[#00E599] transition-transform duration-200 group-hover:scale-110" />
                <span className="text-white group-hover:text-emerald-200 transition-colors">Get Plotmint for Android</span>
                <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 group-hover:bg-[#00E599]/15 group-hover:text-[#00E599]">APK</span>
              </a>
            </div>

            {/* Social Icons - Solid Glass Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              {[
                { label: 'GitHub', icon: GithubIcon, href: 'https://github.com' },
                { label: 'Twitter / X', icon: TwitterIcon, href: 'https://twitter.com' },
                { label: 'Instagram', icon: InstagramIcon, href: 'https://instagram.com' },
                { label: 'Discussions', icon: Users, href: '/feed' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-400 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white hover:scale-105 active:scale-95"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links Columns */}
          {navigationColumns.map((column) => (
            <div key={column.title} className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-300">
                <column.icon className="h-3.5 w-3.5 text-[#E50914]" />
                <span>{column.title}</span>
              </h4>
              <ul className="space-y-2.5 text-sm">
                {column.links.map((link: any) => (
                  <li key={link.label}>
                    {link.download ? (
                      <a
                        href={link.href}
                        download={link.download}
                        className="group flex items-center justify-between py-1 text-emerald-400 transition-colors hover:text-emerald-300 font-medium"
                      >
                        <span className="flex items-center gap-2">
                          {link.icon && (
                            <link.icon className="h-3.5 w-3.5 text-emerald-400 transition-transform group-hover:scale-110" />
                          )}
                          <span>{link.label}</span>
                        </span>
                        {link.badge && (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="group flex items-center justify-between py-1 text-neutral-400 transition-colors hover:text-white"
                      >
                        <span className="flex items-center gap-2">
                          {link.icon && (
                            <link.icon className="h-3.5 w-3.5 text-neutral-500 transition-transform group-hover:scale-110 group-hover:text-red-400" />
                          )}
                          <span>{link.label}</span>
                        </span>
                        {link.badge && (
                          <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[10px] font-bold text-neutral-300 group-hover:border-red-500/30 group-hover:text-red-400 transition-colors">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Quick Topic & Genre Radar Bar ── */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-400">
            <Tag className="h-3.5 w-3.5 text-[#E50914]" />
            <span>Trending Radars:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {popularTopics.map((topic) => (
              <Link
                key={topic.label}
                href={topic.href}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-neutral-400 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                {topic.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
