'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Check, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import TurnstileWidget from '@/components/TurnstileWidget';

export default function RegisterPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  const [hollywood, setHollywood] = useState<string[]>([]);
  const [bollywood, setBollywood] = useState<string[]>([]);
  const [anime, setAnime] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/profile');
    }
  }, [user, isLoading, router]);

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
        const hollywoodTask = api.get('/movies/discover', { params: { with_origin_country: 'US', sort_by: 'popularity.desc', page: 1 } });
        const bollywoodTask = api.get('/movies/discover', { params: { with_origin_country: 'IN', with_original_language: 'hi', sort_by: 'popularity.desc', page: 1 } });
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

  // Debounced username check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await api.get('/auth/check-username', { params: { username } });
        setUsernameAvailable(res.data.available);
        setSuggestions(res.data.suggestions || []);
      } catch (err) {
        console.error('Failed to check username');
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const getInfinite = (list: string[]) => {
    if (list.length === 0) return Array(12).fill("");
    return [...list, ...list, ...list];
  };

  const col1Posters = useMemo(() => getInfinite(hollywood), [hollywood]);
  const col2Posters = useMemo(() => getInfinite(bollywood), [bollywood]);
  const col3Posters = useMemo(() => getInfinite(anime), [anime]);

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

  const calculateStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 5) strength += 1;
    if (pass.length > 7) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    return Math.min(strength, 4);
  };

  const strength = calculateStrength(password);
  const strengthColors = ['bg-zinc-800', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (usernameAvailable === false) {
      setError("Please choose a different username");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the security verification");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', { name, username, email, password, turnstile_token: turnstileToken });
      login(res.data.access_token, res.data.user);
      router.push('/profile');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred during registration');
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

      {/* Right side: Modern Register Form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-[45%] border-l border-white/5 bg-[#000000] z-20 overflow-y-auto">
        <div className="mb-8 text-center select-none mt-auto lg:mt-0 pt-10 lg:pt-0">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg border-2 border-white">
              <span className="text-lg font-black italic tracking-tighter">M</span>
            </div>
            <span className="text-xl font-black tracking-[0.2em] uppercase">MOCTALE</span>
          </div>
        </div>

        <div className="w-full max-w-[400px] animate-in fade-in zoom-in duration-500">
          <div className="glass rounded-[2rem] bg-[#121212]/30 p-8 shadow-2xl border border-white/10">
            <h2 className="mb-6 text-center text-xl font-bold tracking-tight text-zinc-100">Create Account</h2>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 py-3 px-4 text-center text-[13px] text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-5 py-3 text-sm font-medium placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 ml-1">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Choose a unique username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    className={`w-full rounded-xl bg-white/[0.03] border px-5 py-3 text-sm font-medium placeholder:text-zinc-600 focus:bg-white/[0.06] focus:outline-none transition-all duration-300 ${usernameAvailable === true ? 'border-emerald-500/50' :
                      usernameAvailable === false ? 'border-red-500/50' : 'border-white/10'
                      }`}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {checkingUsername && <Loader2 size={16} className="animate-spin text-zinc-500" />}
                    {!checkingUsername && usernameAvailable === true && <Check size={16} className="text-emerald-500" />}
                    {!checkingUsername && usernameAvailable === false && <X size={16} className="text-red-500" />}
                  </div>
                </div>

                {usernameAvailable === false && suggestions.length > 0 && (
                  <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 text-red-500/80">Username taken</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setUsername(s)}
                          className="rounded-full bg-white/[0.05] border border-white/10 px-3 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-5 py-3 text-sm font-medium placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-5 py-3 text-sm font-medium placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex gap-1.5 mt-2 px-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${strength >= i ? strengthColors[strength] : 'bg-zinc-800'} transition-colors`} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 ml-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-5 py-3 text-sm font-medium placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"
                  required
                />
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
                disabled={loading || checkingUsername || usernameAvailable === false || !turnstileToken}
                className="w-full rounded-full bg-zinc-200 py-3.5 font-bold text-black text-sm transition-all hover:bg-white active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-white/5"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <div className="text-center pt-2">
                <p className="text-[12px] font-medium text-zinc-500">
                  Already have an account? <Link href="/login" className="font-bold text-zinc-100 hover:underline underline-offset-4 ml-1">Sign In</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
