'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import PlotmintLogo from '@/components/PlotmintLogo';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  Eye,
  Library,
  Globe,
  Users,
  Trophy,
  Gem,
  Wand2,
  Clapperboard,
  X,
  Home,
  Search,
  Compass,
  MoreHorizontal,
  LogOut,
  User,
  ChevronRight,
  ListChecks,
  Calendar,
  Coffee,
  LayoutGrid,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import AvatarCustomizerModal from '@/components/AvatarCustomizerModal';

const StackedBarsIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Block 1 */}
    <g>
      <path d="M3 4L15 9L19 7L7 2Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 4V6L15 11V9Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M15 9V11L19 9V7Z" fill="currentColor" fillOpacity="0.8" />
    </g>
    {/* Block 2 */}
    <g>
      <path d="M3 10L15 15L19 13L7 8Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 10V12L15 17V15Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M15 15V17L19 15V13Z" fill="currentColor" fillOpacity="0.8" />
    </g>
    {/* Block 3 */}
    <g>
      <path d="M3 16L15 21L19 19L7 14Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 16V18L15 23V21Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M15 21V23L19 21V19Z" fill="currentColor" fillOpacity="0.8" />
    </g>
  </svg>
);


export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Mobile specific
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileBrowseOpen, setMobileBrowseOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    // Initial check
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileBrowseOpen(false);
    setMobileMoreOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setMobileBrowseOpen(false);
      setMobileMoreOpen(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  if (pathname?.startsWith('/watch')) return null;

  const navLinks = [
    { href: '/feed', label: 'Feed', icon: StackedBarsIcon },
    { href: '/upcoming', label: 'Upcoming', icon: Calendar },
    { href: '/must-watch', label: 'Must Watch', icon: Eye },
    { href: '/finder', label: 'Finder', icon: LayoutGrid },
    { href: '/mood', label: 'Mood', icon: Coffee },
    { href: '/search', label: 'Search', icon: Search },
  ];

  const moreLinks = [
    { href: '/groups', label: 'Groups', icon: Users },
    { href: '/collections', label: 'Collections', icon: Library },
    { href: '/gems', label: 'Gems', icon: Gem },
    { href: '/universe', label: 'Universe', icon: Globe },
    { href: '/predictions', label: 'Predict', icon: Trophy },
  ];

  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const isMoreActive = moreLinks.some(l => pathname === l.href);
  const isBrowseActive = pathname?.startsWith('/browse') || false;

  const categories = [
    { label: 'Category', icon: '/category-solid-svgrepo-com.svg', color: '#8B5CF6' },
    { label: 'Genre', icon: '/mask-svgrepo-com.svg', color: '#EC4899' },
    { label: 'Country', icon: '/globe-2-svgrepo-com.svg', color: '#3B82F6' },
    { label: 'Language', icon: '/language-svgrepo-com.svg', color: '#10B981' },
    { label: 'Family Friendly', icon: '/family-think-svgrepo-com.svg', color: '#F59E0B' },
    { label: 'Award Winners', icon: '/oscar-prize-statue-silhouette-svgrepo-com.svg', color: '#F43F5E' },
    { label: 'Plotmint Select', icon: '/badge-svgrepo-com.svg', color: '#8B5CF6' },
    { label: 'Anime', icon: '/anime-away-face-svgrepo-com.svg', color: '#EC4899' },
    { label: 'Franchise', icon: '/film-camera-svgrepo-com.svg', color: '#3B82F6' },
  ];

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  const handleCategoryNav = (label: string) => {
    switch (label) {
      case 'Category': router.push('/browse/category'); break;
      case 'Genre': router.push('/browse/genre'); break;
      case 'Country': router.push('/browse/country'); break;
      case 'Language': router.push('/browse/language'); break;
      case 'Anime': router.push('/browse/anime'); break;
      case 'Family Friendly': router.push('/browse/family'); break;
      case 'Award Winners': router.push('/browse/awards'); break;
      case 'Moctale Select': router.push('/catalog/trending'); break;
      case 'Franchise': router.push('/browse/franchise'); break;
      default: router.push(`/mood?concept=${encodeURIComponent(label)}`);
    }
    setMobileMenuOpen(false);
  };

  // Bottom tab bar items
  const bottomTabs = [
    { id: 'home', label: 'Home', icon: Home, href: '/' },
    { id: 'search', label: 'Search', icon: Search, href: '/search' },
    { id: 'browse', label: 'Browse', icon: Compass, href: null },
    { id: 'more', label: 'Menu', icon: MoreHorizontal, href: null },
  ];

  return (
    <>
      {/* ════════════════════════════════
          DESKTOP NAV (hidden on mobile)
      ════════════════════════════════ */}
      <header
        className="desktop-nav"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 100,
          transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease',
          background: scrolled ? 'rgba(10, 10, 12, 0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(28px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(28px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
          boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '76px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0 }}>
            <PlotmintLogo size="desktop" />
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 32, position: 'relative', height: '100%' }}>
            {/* Browse dropdown */}
            <div 
              style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }} 
              onMouseEnter={() => { setBrowseOpen(true); setHoveredTab('browse'); }} 
              onMouseLeave={() => { setBrowseOpen(false); setHoveredTab(null); }}
            >
              <button 
                onClick={() => router.push('/browse/category')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '6px 2px', 
                  fontSize: 15, 
                  fontWeight: (isBrowseActive || browseOpen) ? 700 : 500, 
                  color: (isBrowseActive || browseOpen) ? '#ffffff' : hoveredTab === 'browse' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)', 
                  background: 'transparent', 
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  height: '100%',
                  transition: 'color 0.2s ease',
                }}
              >
                <motion.div
                  animate={{
                    scale: (isBrowseActive || browseOpen) ? 1.06 : hoveredTab === 'browse' ? 1.08 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Compass size={22} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                </motion.div>

                <AnimatePresence initial={false}>
                  {(isBrowseActive || browseOpen) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0, x: -6 }}
                      animate={{ opacity: 1, width: 'auto', x: 0 }}
                      exit={{ opacity: 0, width: 0, x: -6 }}
                      transition={{
                        width: { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 },
                        opacity: { duration: 0.2, ease: 'easeOut' },
                        x: { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 },
                      }}
                      style={{ overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '-0.2px' }}
                    >
                      Browse <ChevronDown size={13} style={{ transform: browseOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Floating tooltip for inactive */}
                <AnimatePresence>
                  {hoveredTab === 'browse' && !isBrowseActive && !browseOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.92 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% - 10px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '5px 11px',
                        background: 'rgba(15, 15, 20, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 8,
                        backdropFilter: 'blur(16px)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        zIndex: 1100,
                      }}
                    >
                      Browse
                    </motion.div>
                  )}
                </AnimatePresence>

                {isBrowseActive && (
                  <motion.div
                    layoutId="desktop-active-nav-indicator"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: -4,
                      right: -4,
                      height: 28,
                      pointerEvents: 'none',
                      overflow: 'visible',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.7 }}
                  >
                    {/* Subtle curved ambient glow */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '5%',
                        right: '5%',
                        height: '100%',
                        background: 'radial-gradient(ellipse at bottom, rgba(168, 85, 247, 0.45) 0%, rgba(147, 51, 234, 0.15) 50%, transparent 80%)',
                        filter: 'blur(3px)',
                      }}
                    />
                    {/* Bottom glowing line */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2.5,
                        borderRadius: '3px 3px 0 0',
                        background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #9333ea 100%)',
                        boxShadow: '0 -2px 10px rgba(168, 85, 247, 0.85), 0 0 18px rgba(147, 51, 234, 0.5)',
                      }}
                    />
                  </motion.div>
                )}
              </button>

              <AnimatePresence>
                {browseOpen && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }}
                    style={{ position: 'absolute', top: 'calc(100% - 6px)', left: -60, width: 440, padding: 24, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(32px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 1000 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, color: 'white', letterSpacing: '-0.2px' }}>Browse By</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {categories.map((cat) => (
                        <button key={cat.label} onClick={() => { setBrowseOpen(false); handleCategoryNav(cat.label); }}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, color: 'var(--text-dim)', cursor: 'pointer', transition: 'all 0.3s' }}>
                          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ 
                              width: 22, height: 22, 
                              backgroundColor: cat.color,
                              maskImage: `url(${cat.icon})`,
                              WebkitMaskImage: `url(${cat.icon})`,
                              maskRepeat: 'no-repeat',
                              maskPosition: 'center',
                              maskSize: 'contain',
                              WebkitMaskSize: 'contain'
                            }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Nav Links */}
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const isHovered = hoveredTab === link.href;
              const IconComp = link.icon;

              return (
                <div
                  key={link.href}
                  style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={() => setHoveredTab(link.href)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  <Link
                    href={link.href}
                    style={{
                      position: 'relative',
                      padding: '6px 2px',
                      textDecoration: 'none',
                      fontSize: 15,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#ffffff' : isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'transparent',
                      border: 'none',
                      height: '100%',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: isActive ? 1.06 : isHovered ? 1.08 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <IconComp size={22} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                    </motion.div>
                    
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, width: 0, x: -6 }}
                          animate={{ opacity: 1, width: 'auto', x: 0 }}
                          exit={{ opacity: 0, width: 0, x: -6 }}
                          transition={{
                            width: { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 },
                            opacity: { duration: 0.2, ease: 'easeOut' },
                            x: { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 },
                          }}
                          style={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            letterSpacing: '-0.2px',
                          }}
                        >
                          {link.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {isActive && (
                      <motion.div
                        layoutId="desktop-active-nav-indicator"
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: -4,
                          right: -4,
                          height: 28,
                          pointerEvents: 'none',
                          overflow: 'visible',
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.7 }}
                      >
                        {/* Subtle curved ambient glow */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: '5%',
                            right: '5%',
                            height: '100%',
                            background: 'radial-gradient(ellipse at bottom, rgba(168, 85, 247, 0.45) 0%, rgba(147, 51, 234, 0.15) 50%, transparent 80%)',
                            filter: 'blur(3px)',
                          }}
                        />
                        {/* Bottom glowing line */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 2.5,
                            borderRadius: '3px 3px 0 0',
                            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #9333ea 100%)',
                            boxShadow: '0 -2px 10px rgba(168, 85, 247, 0.85), 0 0 18px rgba(147, 51, 234, 0.5)',
                          }}
                        />
                      </motion.div>
                    )}
                  </Link>

                  {/* Micro Tooltip for inactive hover */}
                  <AnimatePresence>
                    {isHovered && !isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.92 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% - 10px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          padding: '5px 11px',
                          background: 'rgba(15, 15, 20, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 8,
                          backdropFilter: 'blur(16px)',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          zIndex: 1100,
                        }}
                      >
                        {link.label}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* More dropdown */}
            <div 
              style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }} 
              onMouseEnter={() => { setMoreOpen(true); setHoveredTab('more'); }} 
              onMouseLeave={() => { setMoreOpen(false); setHoveredTab(null); }}
            >
              <button style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '6px 2px', 
                fontSize: 15, 
                fontWeight: (isMoreActive || moreOpen) ? 700 : 500, 
                color: (isMoreActive || moreOpen) ? '#fff' : hoveredTab === 'more' ? '#fff' : 'rgba(255, 255, 255, 0.5)', 
                background: 'transparent', 
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                height: '100%',
                transition: 'color 0.2s ease',
              }}>
                <motion.div
                  animate={{
                    scale: (isMoreActive || moreOpen) ? 1.06 : hoveredTab === 'more' ? 1.08 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MoreHorizontal size={22} strokeWidth={2.3} style={{ transform: moreOpen ? 'scale(1.15)' : 'none', transition: 'transform 0.3s' }} />
                </motion.div>

                <AnimatePresence initial={false}>
                  {(isMoreActive || moreOpen) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0, x: -6 }}
                      animate={{ opacity: 1, width: 'auto', x: 0 }}
                      exit={{ opacity: 0, width: 0, x: -6 }}
                      transition={{
                        width: { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 },
                        opacity: { duration: 0.2, ease: 'easeOut' },
                        x: { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 },
                      }}
                      style={{ overflow: 'hidden', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}
                    >
                      More
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Floating tooltip for inactive */}
                <AnimatePresence>
                  {hoveredTab === 'more' && !isMoreActive && !moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.92 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% - 10px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '5px 11px',
                        background: 'rgba(15, 15, 20, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 8,
                        backdropFilter: 'blur(16px)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        zIndex: 1100,
                      }}
                    >
                      More
                    </motion.div>
                  )}
                </AnimatePresence>

                {isMoreActive && (
                  <motion.div
                    layoutId="desktop-active-nav-indicator"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: -4,
                      right: -4,
                      height: 28,
                      pointerEvents: 'none',
                      overflow: 'visible',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.7 }}
                  >
                    {/* Subtle curved ambient glow */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '5%',
                        right: '5%',
                        height: '100%',
                        background: 'radial-gradient(ellipse at bottom, rgba(168, 85, 247, 0.45) 0%, rgba(147, 51, 234, 0.15) 50%, transparent 80%)',
                        filter: 'blur(3px)',
                      }}
                    />
                    {/* Bottom glowing line */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2.5,
                        borderRadius: '3px 3px 0 0',
                        background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #9333ea 100%)',
                        boxShadow: '0 -2px 10px rgba(168, 85, 247, 0.85), 0 0 18px rgba(147, 51, 234, 0.5)',
                      }}
                    />
                  </motion.div>
                )}
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                    transition={{ duration: 0.2 }}
                    style={{ 
                      position: 'absolute', 
                      top: 'calc(100% - 6px)', 
                      right: 0, 
                      width: 220, 
                      padding: '12px 8px', 
                      background: 'rgba(10,10,10,0.95)', 
                      backdropFilter: 'blur(32px)', 
                      borderRadius: 18, 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)', 
                      zIndex: 1000 
                    }}
                  >
                    {moreLinks.map((link) => (
                      <Link 
                        key={link.href} 
                        href={link.href} 
                        onClick={() => setMoreOpen(false)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 12, 
                          padding: '10px 14px', 
                          borderRadius: 12,
                          color: pathname === link.href ? '#fff' : 'var(--text-dim)', 
                          textDecoration: 'none', 
                          fontSize: 13, 
                          fontWeight: 600, 
                          transition: 'all 0.2s', 
                          background: pathname === link.href ? 'rgba(255,255,255,0.06)' : 'transparent' 
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = pathname === link.href ? 'rgba(255,255,255,0.06)' : 'transparent';
                          e.currentTarget.style.color = pathname === link.href ? '#fff' : 'var(--text-dim)';
                        }}
                      >
                        <div style={{
                          padding: 8,
                          borderRadius: 8,
                          background: pathname === link.href ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.03)',
                          color: pathname === link.href ? 'var(--primary)' : 'inherit'
                        }}>
                          <link.icon size={16} strokeWidth={2.5} />
                        </div>
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label={`${user.name}'s account menu`}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    padding: 0,
                    border: '2px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 8,
                    overflow: 'hidden',
                    background: '#151515',
                  }}
                >
                  <Avatar
                    src={user.avatar_url}
                    seed={user.id || user.username || user.name}
                    name={user.name}
                    size={38}
                    decorative
                  />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      style={{ 
                        position: 'absolute', right: 0, top: 48, 
                        minWidth: 240, borderRadius: 24, 
                        background: 'rgba(12, 12, 12, 0.85)',
                        backdropFilter: 'blur(32px)',
                        WebkitBackdropFilter: 'blur(32px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                        zIndex: 1000,
                        padding: 8
                      }}
                    >
                      {/* User Info Header */}
                      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.3px' }}>{user.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{user.email}</div>
                      </div>

                      {/* Dropdown Links */}
                      <DropdownItem icon={<User size={16} />} label="My Profile" href="/profile" onClick={() => setMenuOpen(false)} />
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); setIsAvatarModalOpen(true); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px', color: 'rgba(255,255,255,0.7)',
                          background: 'transparent', border: 'none', fontSize: 14, fontWeight: 600,
                          borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
                          marginBottom: 2, textAlign: 'left',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                      >
                        <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
                          <Avatar
                            src={user.avatar_url}
                            seed={user.id || user.username || user.name}
                            size={18}
                            decorative
                          />
                        </div>
                        Customize Avatar
                      </button>
                      <DropdownItem icon={<Library size={16} />} label="My Collections" href="/collections" onClick={() => setMenuOpen(false)} />
                      <DropdownItem icon={<ListChecks size={16} />} label="Movie Finder" href="/finder" onClick={() => setMenuOpen(false)} />
                      <DropdownItem icon={<Wand2 size={16} />} label="Movie Moods" href="/mood" onClick={() => setMenuOpen(false)} />
                      
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 8px' }} />
                      
                      <button 
                        onClick={() => { setMenuOpen(false); logout(); }} 
                        style={{ 
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12, 
                          padding: '12px 16px', color: '#f43f5e', background: 'transparent', 
                          border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                          borderRadius: 16, transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
                <Link href="/login" className="btn-ghost" style={{ padding: '8px 18px', fontSize: 14 }}>Login</Link>
                <Link href="/register" className="btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>Sign Up</Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* ════════════════════════════════
          MOBILE TOP BAR
      ════════════════════════════════ */}
      <header className="mobile-top-bar" style={{
        background: scrolled ? 'rgba(8, 8, 8, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '100%' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <PlotmintLogo size="mobile" />
          </Link>
          {user ? (
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label={`${user.name}'s mobile menu`}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                padding: 0,
                background: '#151515',
              }}
            >
              <Avatar
                src={user.avatar_url}
                seed={user.id || user.username || user.name}
                name={user.name}
                size={36}
                decorative
              />
            </button>
          ) : (
            <Link href="/login" style={{
              padding: '7px 16px', borderRadius: 99,
              background: 'var(--primary, #e11d48)',
              color: 'white', fontWeight: 700, fontSize: 13,
              textDecoration: 'none',
            }}>
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ════════════════════════════════
          MOBILE BOTTOM TAB BAR
      ════════════════════════════════ */}
      <nav className="mobile-bottom-bar">
        <div className="mobile-tab-pill">
          {bottomTabs.map((tab) => {
            const isActive =
              tab.id === 'home' ? pathname === '/' :
                tab.id === 'search' ? pathname === '/search' :
                  tab.id === 'browse' ? mobileMenuOpen && mobileBrowseOpen :
                    tab.id === 'more' ? mobileMenuOpen && !mobileBrowseOpen : false;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.href) {
                    router.push(tab.href);
                    setMobileMenuOpen(false);
                  } else if (tab.id === 'browse') {
                    setMobileMenuOpen(true);
                    setMobileBrowseOpen(true);
                    setMobileMoreOpen(false);
                  } else if (tab.id === 'more') {
                    setMobileMenuOpen(true);
                    setMobileBrowseOpen(false);
                    setMobileMoreOpen(false);
                  }
                }}
                className={`mobile-tab-btn ${isActive ? 'active' : ''}`}
              >
                <span className="mobile-tab-icon-wrap">
                  <tab.icon size={22} strokeWidth={2.2} />
                </span>
                <span className="mobile-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 200,
              }}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 201,
                background: 'rgba(10, 10, 10, 0.97)',
                backdropFilter: 'blur(40px)',
                borderRadius: '28px 28px 0 0',
                border: '1px solid rgba(255,255,255,0.08)',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
              </div>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px 16px' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
                  {mobileBrowseOpen ? '🎭 Browse By' : '✨ Explore'}
                </span>
                <button
                  onClick={() => {
                    if (mobileBrowseOpen) {
                      setMobileBrowseOpen(false);
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {mobileBrowseOpen ? <ChevronLeft size={16} /> : <X size={16} />}
                </button>
              </div>

              {/* Scrollable content */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 40px' }}>
                <AnimatePresence mode="wait">
                  {/* ── BROWSE PANEL ── */}
                  {mobileBrowseOpen ? (
                    <motion.div key="browse"
                      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {categories.map((cat, i) => (
                          <motion.button
                            key={cat.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => handleCategoryNav(cat.label)}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center',
                              gap: 10, padding: '18px 8px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: 18, cursor: 'pointer',
                              color: 'rgba(255,255,255,0.7)',
                              position: 'relative', overflow: 'hidden',
                            }}
                          >
                            {/* glow accent */}
                            <div style={{
                              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                              width: 60, height: 2, borderRadius: 99,
                              background: cat.color, opacity: 0.6,
                            }} />
                            <div style={{
                              width: 44, height: 44, borderRadius: 14,
                              background: `${cat.color}18`,
                              border: `1px solid ${cat.color}33`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <div style={{ 
                                width: 20, height: 20, 
                                backgroundColor: cat.color,
                                maskImage: `url(${cat.icon})`,
                                WebkitMaskImage: `url(${cat.icon})`,
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center',
                                maskSize: 'contain',
                                WebkitMaskSize: 'contain'
                              }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
                              {cat.label}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    /* ── MAIN MENU PANEL ── */
                    <motion.div key="main"
                      initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.22 }}
                    >
                      {/* Quick Links */}
                      <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>Quick Nav</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {navLinks.map((link, i) => (
                            <motion.div key={link.href}
                              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <Link href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '14px 16px',
                                  background: pathname === link.href ? 'rgba(225,29,72,0.12)' : 'rgba(255,255,255,0.03)',
                                  border: pathname === link.href ? '1px solid rgba(225,29,72,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                  borderRadius: 16, textDecoration: 'none',
                                  color: pathname === link.href ? '#fff' : 'rgba(255,255,255,0.6)',
                                }}
                              >
                                <link.icon size={18} strokeWidth={2.2} style={{ color: pathname === link.href ? 'var(--primary, #e11d48)' : 'inherit' }} />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{link.label}</span>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Browse Button */}
                      <motion.button
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        onClick={() => setMobileBrowseOpen(true)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '16px 20px', marginBottom: 20,
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))',
                          border: '1px solid rgba(139,92,246,0.25)',
                          borderRadius: 18, cursor: 'pointer', color: 'white',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Compass size={18} strokeWidth={2.2} style={{ color: '#a78bfa' }} />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Browse All</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Category · Genre · Country +6</div>
                          </div>
                        </div>
                        <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      </motion.button>

                      {/* More Links */}
                      <div style={{ marginBottom: 24 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>More</p>
                        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                          {moreLinks.map((link, i) => (
                            <motion.div key={link.href}
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.25 + i * 0.04 }}
                            >
                              <Link href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '15px 18px', textDecoration: 'none',
                                  color: pathname === link.href ? '#fff' : 'rgba(255,255,255,0.65)',
                                  borderBottom: i < moreLinks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                  background: pathname === link.href ? 'rgba(225,29,72,0.08)' : 'transparent',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                  <link.icon size={17} strokeWidth={2} />
                                  <span style={{ fontSize: 14, fontWeight: 500 }}>{link.label}</span>
                                </div>
                                <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.2)' }} />
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* User section */}
                      {user ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                          style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                          <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#151515' }}>
                              <Avatar
                                src={user.avatar_url}
                                seed={user.id || user.username || user.name}
                                name={user.name}
                                size={38}
                                decorative
                              />
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{user.name}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user.email}</div>
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => { setMobileMenuOpen(false); setIsAvatarModalOpen(true); }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          >
                            <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
                              <Avatar
                                src={user.avatar_url}
                                seed={user.id || user.username || user.name}
                                size={22}
                                decorative
                              />
                            </div>
                            Customize Avatar
                          </button>
                          <button
                            onClick={() => { setMobileMenuOpen(false); logout(); }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'transparent', border: 'none', color: '#f43f5e', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                          style={{ display: 'flex', gap: 10 }}>
                          <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                            style={{ flex: 1, textAlign: 'center', padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                            Login
                          </Link>
                          <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                            style={{ flex: 1, textAlign: 'center', padding: '14px', borderRadius: 14, background: 'var(--primary, #e11d48)', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                            Sign Up
                          </Link>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════
          SCOPED MOBILE STYLES
      ════════════════════════════════ */}
      <style>{`
        /* Show/hide desktop vs mobile */
        .desktop-nav { display: flex; }
        .mobile-top-bar { display: none; }
        .mobile-bottom-bar { display: none; }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }

          /* Top bar */
          .mobile-top-bar {
            display: block;
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 60px;
            z-index: 100;
          }

          /* Bottom tab bar container (floating & transparent) */
          .mobile-bottom-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 150;
            padding: 10px 16px max(14px, env(safe-area-inset-bottom));
            background: transparent;
            pointer-events: none;
          }

          /* Liquid Glass Floating Pill */
          .mobile-tab-pill {
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 4px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
            backdrop-filter: blur(28px) saturate(190%);
            -webkit-backdrop-filter: blur(28px) saturate(190%);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 999px;
            padding: 5px;
            width: 100%;
            max-width: 360px;
            box-shadow: 
              0 16px 36px -6px rgba(0, 0, 0, 0.7),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.35),
              inset 0 -1px 2px 0 rgba(0, 0, 0, 0.4);
          }

          .mobile-tab-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            padding: 7px 4px;
            border: 1px solid transparent;
            background: transparent;
            color: rgba(255, 255, 255, 0.55);
            cursor: pointer;
            border-radius: 999px;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }

          .mobile-tab-btn.active {
            color: #ffffff;
            background: linear-gradient(135deg, rgba(225, 29, 72, 0.4) 0%, rgba(180, 10, 50, 0.25) 100%);
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 
              0 4px 16px rgba(225, 29, 72, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
          }

          .mobile-tab-btn.active .mobile-tab-icon-wrap {
            color: #ffffff;
            filter: drop-shadow(0 0 6px rgba(225, 29, 72, 0.8));
          }

          .mobile-tab-icon-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
          }

          .mobile-tab-btn.active .mobile-tab-icon-wrap {
            transform: translateY(-1px);
          }

          .mobile-tab-label {
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.02em;
            line-height: 1;
          }

          /* Content padding handled by pages directly to allow hero sections to touch the top */
          body {
            padding-bottom: calc(84px + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      {/* Avatar Customizer Modal */}
      {isAvatarModalOpen && (
        <AvatarCustomizerModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      )}
    </>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────

function NavSvgIcon({
  svg,
  icon: IconComponent,
  size = 22,
  className,
  style,
}: {
  svg?: string;
  icon?: any;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (svg === '/svgs/browse.svg') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity={0.3} />
      </svg>
    );
  }
  if (svg === '/svgs/upcoming-svgrepo-com.svg') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="8" cy="14" r="1.1" fill="currentColor" />
        <circle cx="12" cy="14" r="1.1" fill="currentColor" />
        <circle cx="16" cy="14" r="1.1" fill="currentColor" />
        <circle cx="8" cy="17.5" r="1.1" fill="currentColor" />
        <circle cx="12" cy="17.5" r="1.1" fill="currentColor" />
      </svg>
    );
  }
  if (svg === '/svgs/eye-monster-svgrepo-com.svg') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3.2" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      </svg>
    );
  }
  if (svg === '/svgs/finder-svgrepo-com.svg') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
        <path d="m10.5 7.5 7.5-3 2 4-7.5 3z" />
        <path d="m6.5 12.5 4-1.5-1.5-3.5-4 1.5a1.5 1.5 0 0 0-.9 1.9l.5 1.2a1.5 1.5 0 0 0 1.9.9z" />
        <line x1="12" y1="12" x2="8" y2="21" />
        <line x1="12" y1="12" x2="16" y2="21" />
        <line x1="12" y1="12" x2="12" y2="21" />
      </svg>
    );
  }
  if (svg === '/svgs/mood-svgrepo-com.svg') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    );
  }
  if (svg) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          width: size,
          height: size,
          display: 'inline-block',
          backgroundColor: 'currentColor',
          maskImage: `url(${svg})`,
          WebkitMaskImage: `url(${svg})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }
  if (IconComponent) {
    return <IconComponent size={size} strokeWidth={2.3} style={{ flexShrink: 0, ...style }} />;
  }
  return null;
}

function DropdownItem({ icon, label, href, onClick }: any) {
  return (
    <Link href={href} onClick={onClick} style={{ 
      display: 'flex', alignItems: 'center', gap: 12, 
      padding: '12px 16px', color: 'rgba(255,255,255,0.7)', 
      textDecoration: 'none', fontSize: 14, fontWeight: 600,
      borderRadius: 16, transition: 'all 0.2s',
      marginBottom: 2
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
      }}
    >
      <div style={{ color: 'rgba(255,255,255,0.4)' }}>{icon}</div>
      {label}
    </Link>
  );
}