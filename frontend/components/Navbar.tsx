'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  LayoutGrid,
  Theater,
  Globe,
  Languages,
  Users,
  Trophy,
  Award,
  Sparkles,
  Clapperboard,
  X,
  Home,
  Search,
  Compass,
  MoreHorizontal,
  LogOut,
  User,
  ChevronRight,
} from 'lucide-react';


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
    { href: '/upcoming', label: 'Upcoming', icon: Clapperboard },
    { href: '/must-watch', label: 'Must Watch', icon: Theater },
    { href: '/mood', label: 'Mood', icon: Sparkles },
    { href: '/search', label: 'Search', icon: LayoutGrid },
  ];

  const moreLinks = [
    { href: '/groups', label: 'Groups', icon: Users },
    { href: '/collections', label: 'Collections', icon: Theater },
    { href: '/gems', label: 'Gems', icon: Award },
    { href: '/universe', label: 'Universe', icon: Globe },
    { href: '/predictions', label: 'Predict', icon: Trophy },
  ];

  const categories = [
    { label: 'Category', icon: '/category-solid-svgrepo-com.svg', color: '#8B5CF6' },
    { label: 'Genre', icon: '/mask-svgrepo-com.svg', color: '#EC4899' },
    { label: 'Country', icon: '/globe-2-svgrepo-com.svg', color: '#3B82F6' },
    { label: 'Language', icon: '/language-svgrepo-com.svg', color: '#10B981' },
    { label: 'Family Friendly', icon: '/family-think-svgrepo-com.svg', color: '#F59E0B' },
    { label: 'Award Winners', icon: '/oscar-prize-statue-silhouette-svgrepo-com.svg', color: '#F43F5E' },
    { label: 'Moctale Select', icon: '/badge-svgrepo-com.svg', color: '#8B5CF6' },
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
          background: scrolled ? 'rgba(10, 10, 10, 0.82)' : 'transparent',
          backdropFilter: scrolled ? 'blur(28px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(28px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
          boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        {/* … original desktop nav content kept intact … */}
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '76px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0 }}>
            <motion.span 
              whileHover={{ scale: 1.02 }}
              style={{ 
                fontSize: 28, 
                fontFamily: 'system-ui, -apple-system, sans-serif', 
                fontWeight: 900, 
                background: 'linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #7C3AED 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1.5px', 
                display: 'flex', 
                alignItems: 'baseline',
                textTransform: 'lowercase',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '1.2em', lineHeight: 0.8 }}>s</span>
              <span style={{ fontSize: '0.9em' }}>h</span>
              <span style={{ fontSize: '0.8em' }}>o</span>
              <span style={{ fontSize: '1.05em' }}>c</span>
              <span style={{ fontSize: '1.25em', lineHeight: 0.8 }}>k</span>
              <span style={{ fontSize: '0.85em' }}>m</span>
              <span style={{ fontSize: '1.15em' }}>e</span>
              <motion.span 
                animate={{ 
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ 
                  width: 6, height: 6, borderRadius: '50%', 
                  background: '#A855F7', marginLeft: 2,
                  boxShadow: '0 0 10px #A855F7'
                }} 
              />
            </motion.span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Browse dropdown */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setBrowseOpen(true)} onMouseLeave={() => setBrowseOpen(false)}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 18px', fontSize: 15, fontWeight: 600, color: browseOpen ? '#fff' : 'var(--text-dim)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Browse <ChevronDown size={14} style={{ transform: browseOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
              </button>
              <AnimatePresence>
                {browseOpen && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }}
                    style={{ position: 'absolute', top: '100%', left: -100, width: 440, padding: 24, background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(32px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', zIndex: 1000 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'white' }}>Browse By</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {categories.map((cat) => (
                        <button key={cat.label} onClick={() => { setBrowseOpen(false); handleCategoryNav(cat.label); }}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, color: 'var(--text-dim)', cursor: 'pointer', transition: 'all 0.3s' }}>
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
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} style={{ position: 'relative', padding: '8px 14px', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: pathname === link.href ? '#fff' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <link.icon size={16} strokeWidth={2.5} />
                {link.label}
                {pathname === link.href && <motion.div layoutId="nav-indicator" style={{ position: 'absolute', bottom: -4, left: 10, right: 10, height: 3, borderRadius: 2, backgroundColor: 'var(--primary)', boxShadow: '0 0 12px var(--primary-glow)' }} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
              </Link>
            ))}

            {/* More dropdown */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setMoreOpen(true)} onMouseLeave={() => setMoreOpen(false)}>
              <button style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 5, 
                padding: '8px 14px', 
                fontSize: 14, 
                fontWeight: 600, 
                color: moreOpen ? '#fff' : 'var(--text-dim)', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}>
                More <MoreHorizontal size={14} style={{ transform: moreOpen ? 'scale(1.2)' : 'none', transition: 'transform 0.3s' }} />
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
                      top: '100%', 
                      right: 0, 
                      width: 220, 
                      padding: '12px 8px', 
                      background: 'rgba(10,10,10,0.85)', 
                      backdropFilter: 'blur(32px)', 
                      borderRadius: 18, 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
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
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #b0070f)', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                  {initials}
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
                      <DropdownItem icon={<Theater size={16} />} label="My Collections" href="/collections" onClick={() => setMenuOpen(false)} />
                      <DropdownItem icon={<Sparkles size={16} />} label="Movie Moods" href="/mood" onClick={() => setMenuOpen(false)} />
                      
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
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ 
              fontSize: 24, 
              fontWeight: 900, 
              background: 'linear-gradient(135deg, #C084FC 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px', 
              display: 'flex', 
              alignItems: 'baseline',
              textTransform: 'lowercase'
            }}>
              <span style={{ fontSize: '1.2em', lineHeight: 0.8 }}>s</span>
              <span style={{ fontSize: '0.9em' }}>h</span>
              <span style={{ fontSize: '0.8em' }}>o</span>
              <span style={{ fontSize: '1.05em' }}>c</span>
              <span style={{ fontSize: '1.25em', lineHeight: 0.8 }}>k</span>
              <span style={{ fontSize: '0.85em' }}>m</span>
              <span style={{ fontSize: '1.15em' }}>e</span>
            </span>
          </Link>
          {user ? (
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary, #e11d48), #b0070f)',
                border: '2px solid rgba(255,255,255,0.15)',
                color: 'white', fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {initials}
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
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
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
                            <Compass size={18} style={{ color: '#a78bfa' }} />
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
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary, #e11d48), #b0070f)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{user.name}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user.email}</div>
                            </div>
                          </Link>
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

          /* Bottom tab bar */
          .mobile-bottom-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 150;
            padding: 12px 16px max(20px, env(safe-area-inset-bottom));
            background: rgba(8,8,8,0.92);
            backdrop-filter: blur(32px);
            -webkit-backdrop-filter: blur(32px);
            border-top: 1px solid rgba(255,255,255,0.07);
          }

          /* Floating pill */
          .mobile-tab-pill {
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 99px;
            padding: 6px;
            width: 100%;
            max-width: 360px;
          }

          .mobile-tab-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            padding: 8px 4px;
            border: none;
            background: transparent;
            color: rgba(255,255,255,0.4);
            cursor: pointer;
            border-radius: 99px;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }

          .mobile-tab-btn.active {
            color: white;
            background: rgba(225,29,72,0.2);
          }

          .mobile-tab-btn.active .mobile-tab-icon-wrap {
            color: var(--primary, #e11d48);
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
    </>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────

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