'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Mail, User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import TurnstileWidget from '@/components/TurnstileWidget';
import PlotmintLogo from '@/components/PlotmintLogo';

function LoginForm() {
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
    setError('Security verification could not connect to Cloudflare. Click the bypass link below if blocked.');
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
    return <LoginLoadingUI />;
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
      login(res.data.access_token, res.data.user, res.data.refresh_token);

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
      <div className="flex w-full flex-col items-center justify-center p-4 sm:p-6 lg:w-[45%] border-l border-white/[0.08] bg-[#050507] z-20 overflow-y-auto">
        <div className="mb-4 text-center select-none">
          <Link href="/" className="cursor-pointer inline-block transition-transform hover:scale-105">
            <PlotmintLogo size="medium" />
          </Link>
        </div>

        <div className="w-full max-w-[390px] animate-in fade-in zoom-in duration-300">
          <div className="relative rounded-2xl sm:rounded-[1.75rem] bg-[#0e0e12]/80 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/[0.08]">
            <div className="text-center mb-5">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">Welcome Back</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Sign in to your plotmint account</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 py-2.5 px-3.5 text-center text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Username / Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                    {loginId.includes('@') ? <Mail size={15} /> : <User size={15} />}
                  </div>
                  <input
                    type="text"
                    placeholder="Enter username or email"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 pl-9 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:bg-white/[0.06] focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Password</label>
                  <Link href="/forgot-password" className="text-[10px] font-semibold text-zinc-400 hover:text-red-400 transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 pl-9 pr-9 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:bg-white/[0.06] focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Turnstile Widget */}
              <div className="flex justify-center pt-1">
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
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-2.5 sm:py-3 font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(225,29,72,0.35)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-[11px] font-medium text-zinc-400">
                  Don't have an account? <Link href="/register" className="font-bold text-red-400 hover:text-red-300 hover:underline underline-offset-4 ml-1 transition-colors">Sign Up</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginLoadingUI() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-white font-sans items-center justify-center">
      <div className="flex items-center space-x-2">
        <Loader2 className="animate-spin" size={20} />
        <span>Loading...</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingUI />}>
      <LoginForm />
    </Suspense>
  );
}
