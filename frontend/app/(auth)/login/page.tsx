'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Mail, User, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import TurnstileWidget from '@/components/TurnstileWidget';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isLoading } = useAuth();

  // ALL hooks must be declared before any conditional returns
  const [hollywood, setHollywood] = useState<string[]>([]);
  const [bollywood, setBollywood] = useState<string[]>([]);
  const [anime, setAnime] = useState<string[]>([]);

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // Memoize Turnstile callbacks to prevent re-renders
  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setError('Security verification failed. Please try again.');
    setTurnstileToken('');
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken('');
  }, []);

  // Fetch categorized posters from backend (optional, doesn't block form)
  useEffect(() => {
    async function fetchPosters() {
      try {
        const hollywoodTask = api.get('/movies/discover', {
          params: { with_origin_country: 'US', sort_by: 'popularity.desc', page: 1 }
        });
        const bollywoodTask = api.get('/movies/discover', {
          params: { with_origin_country: 'IN', with_original_language: 'hi', sort_by: 'popularity.desc', page: 1 }
        });
        const animeTask = api.get('/movies/anime', { params: { page: 1 } });

        const [hollywoodRes, bollywoodRes, animeRes] = await Promise.all([hollywoodTask, bollywoodTask, animeTask]);

        const getPaths = (results: any[]) => (results || [])
          .filter((m: any) => !!m.poster_path)
          .map((m: any) => `https://image.tmdb.org/t/p/w500${m.poster_path}`);

        setHollywood(getPaths(hollywoodRes.data?.results));
        setBollywood(getPaths(bollywoodRes.data?.results));
        setAnime(getPaths(animeRes.data?.results));
      } catch (err) {
        console.log('Posters not available, using placeholders');
        // Set empty arrays so the form still works without posters
        setHollywood([]);
        setBollywood([]);
        setAnime([]);
      }
    }
    fetchPosters();
  }, []);

  const getInfinite = (list: string[]) => {
    if (list.length === 0) return Array(12).fill("");
    return [...list, ...list, ...list];
  };

  const col1Posters = useMemo(() => getInfinite(hollywood), [hollywood]);
  const col2Posters = useMemo(() => getInfinite(bollywood), [bollywood]);
  const col3Posters = useMemo(() => getInfinite(anime), [anime]);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      const from = searchParams?.get('from') || '/profile';
      router.push(from);
    }
  }, [user, isLoading, router, searchParams]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-white font-sans items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render if user is logged in
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!turnstileToken) {
      setError('Please complete the security verification');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', { login_id: loginId, password, turnstile_token: turnstileToken });
      login(res.data.access_token, res.data.user);

      const from = searchParams?.get('from') || '/profile';
      router.push(from);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid identification or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-white font-sans">
      {/* Left side: Infinite Scrolling Poster Wall */}
      <div className="relative hidden w-[55%] overflow-hidden lg:flex select-none">
        <div className="flex w-full gap-5 px-5 py-8 opacity-80">
          <div className="flex-1 space-y-5" style={{ animation: 'scrollUp 50s linear infinite' }}>
            {col1Posters.map((src, i) => (
              <div key={`col1-${i}`} className="aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 shadow-2xl">
                {src ? <img src={src} alt="" className="h-full w-full object-cover transition-opacity duration-1000" /> : <div className="h-full w-full bg-white/5 animate-pulse" />}
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-5" style={{ animation: 'scrollDown 60s linear infinite' }}>
            {col2Posters.map((src, i) => (
              <div key={`col2-${i}`} className="aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 shadow-2xl">
                {src ? <img src={src} alt="" className="h-full w-full object-cover transition-opacity duration-1000" /> : <div className="h-full w-full bg-white/5 animate-pulse" />}
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-5" style={{ animation: 'scrollUp 80s linear infinite' }}>
            {col3Posters.map((src, i) => (
              <div key={`col3-${i}`} className="aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 shadow-2xl">
                {src ? <img src={src} alt="" className="h-full w-full object-cover transition-opacity duration-1000" /> : <div className="h-full w-full bg-white/5 animate-pulse" />}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/20 to-[#000000] z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 z-10" />
      </div>

      {/* Right side: Modern Login Form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-[45%] border-l border-white/5 bg-[#000000] z-20 overflow-y-auto">
        <div className="mb-10 text-center select-none mt-auto lg:mt-0 pt-10 lg:pt-0">
          <div className="flex items-center justify-center">
            <span style={{ 
              fontSize: 32, 
              fontFamily: 'var(--font-poppins, Poppins)', 
              fontWeight: 900, 
              color: 'white', 
              letterSpacing: '-1.5px', 
              display: 'flex', 
              alignItems: 'baseline',
              textTransform: 'lowercase'
            }}>
              <span style={{ fontSize: '1.3em', color: '#e11d48', lineHeight: 0.8 }}>s</span>
              <span style={{ fontSize: '0.9em' }}>h</span>
              <span style={{ fontSize: '0.75em', opacity: 0.9 }}>o</span>
              <span style={{ fontSize: '1.1em' }}>c</span>
              <span style={{ fontSize: '1.4em', color: '#e11d48', lineHeight: 0.8 }}>k</span>
              <span style={{ fontSize: '0.85em' }}>m</span>
              <span style={{ fontSize: '1.2em' }}>e</span>
            </span>
          </div>
        </div>

        <div className="w-full max-w-[370px] animate-in fade-in zoom-in duration-500">
          <div className="glass rounded-[2rem] bg-[#121212]/30 p-8 shadow-2xl border border-white/10">
            <h2 className="mb-8 text-center text-xl font-bold tracking-tight text-zinc-100">Login</h2>

            {error && (
              <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 py-3 px-4 text-center text-[13px] text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 ml-1">Username / Email</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter username or email"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 pl-12 pr-5 py-3.5 text-sm font-medium placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    {loginId.includes('@') ? <Mail size={18} /> : <User size={18} />}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-5 py-3.5 text-sm font-medium placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Turnstile Widget */}
              <div className="flex justify-center">
                <TurnstileWidget 
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                  theme="dark"
                  size="normal"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className="w-full rounded-full bg-zinc-200 py-3.5 font-bold text-black text-sm transition-all hover:bg-white active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-white/5"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              <div className="flex flex-col items-center gap-4 pt-2">
                <Link href="/forgot-password" title="Forgot Password? Reset it here" className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest">
                  Forgot Password?
                </Link>
                
                <p className="text-[12px] font-medium text-zinc-500">
                  Don't have an account? <Link href="/register" className="font-bold text-zinc-100 hover:underline underline-offset-4 ml-1">Sign Up</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
