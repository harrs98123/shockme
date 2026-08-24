'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Check, X, Loader2, User, AtSign, Mail, Lock, KeyRound, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import TurnstileWidget from '@/components/TurnstileWidget';
import PlotmintLogo from '@/components/PlotmintLogo';

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const getInfinite = (list: string[]) => {
    if (list.length === 0) return Array(12).fill("");
    return [...list, ...list, ...list];
  };

  const col1Posters = useMemo(() => getInfinite(hollywood), [hollywood]);
  const col2Posters = useMemo(() => getInfinite(bollywood), [bollywood]);
  const col3Posters = useMemo(() => getInfinite(anime), [anime]);

  const passwordChecks = useMemo(() => ({
    hasMinLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/.test(password),
    hasNumber: /\d/.test(password),
  }), [password]);

  const passedChecksCount = useMemo(() => {
    return Object.values(passwordChecks).filter(Boolean).length;
  }, [passwordChecks]);

  const isPasswordValid = passedChecksCount === 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (usernameAvailable === false) {
      setError("Please choose an available username");
      return;
    }

    if (!passwordChecks.hasMinLength) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!passwordChecks.hasUpper) {
      setError("Password must contain at least one uppercase letter (A-Z).");
      return;
    }
    if (!passwordChecks.hasSymbol) {
      setError("Password must contain at least one unique symbol (e.g. @, #, $, !).");
      return;
    }
    if (!passwordChecks.hasNumber) {
      setError("Password must contain at least one number (0-9).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
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

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-[#050505] text-white font-sans items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin text-red-500" size={24} />
          <span className="text-zinc-400 text-sm">Loading Plotmint...</span>
        </div>
      </div>
    );
  }

  // Don't render if user is logged in
  if (user) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-white font-sans">
      {/* Left side: Infinite Scrolling Poster Wall */}
      <div className="relative hidden w-[55%] overflow-hidden lg:flex select-none">
        <div className="flex w-full gap-5 px-5 py-8 opacity-75">
          <div className="flex-1 space-y-5" style={{ animation: 'scrollUp 50s linear infinite' }}>
            {col1Posters.map((src, i) => (
              <div key={`col1-${i}`} className="aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl">
                {src ? <img src={src} alt="" className="h-full w-full object-cover transition-opacity duration-1000" /> : <div className="h-full w-full bg-white/5 animate-pulse" />}
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-5" style={{ animation: 'scrollDown 60s linear infinite' }}>
            {col2Posters.map((src, i) => (
              <div key={`col2-${i}`} className="aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl">
                {src ? <img src={src} alt="" className="h-full w-full object-cover transition-opacity duration-1000" /> : <div className="h-full w-full bg-white/5 animate-pulse" />}
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-5" style={{ animation: 'scrollUp 80s linear infinite' }}>
            {col3Posters.map((src, i) => (
              <div key={`col3-${i}`} className="aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl">
                {src ? <img src={src} alt="" className="h-full w-full object-cover transition-opacity duration-1000" /> : <div className="h-full w-full bg-white/5 animate-pulse" />}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/30 to-[#000000] z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 z-10" />
      </div>

      {/* Right side: Modern Register Form */}
      <div className="flex w-full flex-col items-center justify-center p-4 sm:p-6 lg:w-[45%] border-l border-white/[0.08] bg-[#050507] z-20 overflow-y-auto">
        <div className="mb-3 text-center select-none">
          <Link href="/" className="cursor-pointer inline-block transition-transform hover:scale-105">
            <PlotmintLogo size="medium" />
          </Link>
        </div>

        <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-300">
          <div className="relative rounded-2xl sm:rounded-[1.75rem] bg-[#0e0e12]/80 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/[0.08]">
            <div className="text-center mb-3.5">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">Create Account</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Join plotmint to discover and track movies</p>
            </div>

            {error && (
              <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 py-2 px-3 text-center text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl bg-white/[0.03] border border-white/10 pl-8 pr-3 py-2.5 text-xs sm:text-sm font-medium text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:bg-white/[0.06] focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Username</label>
                  <div className="relative">
                    <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      className={`w-full rounded-xl bg-white/[0.03] border pl-8 pr-8 py-2.5 text-xs sm:text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none transition-all ${
                        usernameAvailable === true ? 'border-emerald-500/50 focus:border-emerald-500' :
                        usernameAvailable === false ? 'border-red-500/50 focus:border-red-500' :
                        'border-white/10 focus:border-red-500/50'
                      }`}
                      required
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                      {checkingUsername && <Loader2 size={13} className="animate-spin text-zinc-500" />}
                      {!checkingUsername && usernameAvailable === true && <Check size={14} className="text-emerald-400" />}
                      {!checkingUsername && usernameAvailable === false && <X size={14} className="text-red-400" />}
                    </div>
                  </div>
                </div>
              </div>

              {usernameAvailable === false && suggestions.length > 0 && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest ml-1 text-red-400">Username taken, try:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.slice(0, 3).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setUsername(s)}
                        className="rounded-md bg-white/[0.05] border border-white/10 px-2 py-0.5 text-[10px] font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 pl-8 pr-3 py-2.5 text-xs sm:text-sm font-medium text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:bg-white/[0.06] focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Password</label>
                  {password.length > 0 && (
                    <span className={`text-[10px] font-semibold ${isPasswordValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isPasswordValid ? 'Strong' : `${passedChecksCount}/4 requirements`}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full rounded-xl bg-white/[0.03] border pl-8 pr-9 py-2.5 text-xs sm:text-sm font-medium text-white placeholder:text-zinc-600 focus:bg-white/[0.06] focus:outline-none transition-all ${
                      password.length > 0
                        ? isPasswordValid
                          ? 'border-emerald-500/50 focus:border-emerald-500'
                          : 'border-white/15 focus:border-amber-500/50'
                        : 'border-white/10 focus:border-red-500/50'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Compact Modern Password Criteria Pills */}
                {password.length > 0 && !isPasswordValid && (
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                      passwordChecks.hasMinLength ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.02] border-white/5 text-zinc-500'
                    }`}>
                      {passwordChecks.hasMinLength ? <Check size={11} className="shrink-0 text-emerald-400" /> : <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />}
                      <span>8+ characters</span>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                      passwordChecks.hasUpper ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.02] border-white/5 text-zinc-500'
                    }`}>
                      {passwordChecks.hasUpper ? <Check size={11} className="shrink-0 text-emerald-400" /> : <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />}
                      <span>1 uppercase (A-Z)</span>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                      passwordChecks.hasSymbol ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.02] border-white/5 text-zinc-500'
                    }`}>
                      {passwordChecks.hasSymbol ? <Check size={11} className="shrink-0 text-emerald-400" /> : <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />}
                      <span>1 symbol (!@#$%)</span>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                      passwordChecks.hasNumber ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.02] border-white/5 text-zinc-500'
                    }`}>
                      {passwordChecks.hasNumber ? <Check size={11} className="shrink-0 text-emerald-400" /> : <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />}
                      <span>1 number (0-9)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Confirm Password</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-xl bg-white/[0.03] border pl-8 pr-9 py-2.5 text-xs sm:text-sm font-medium text-white placeholder:text-zinc-600 focus:bg-white/[0.06] focus:outline-none transition-all ${
                      confirmPassword.length > 0
                        ? password === confirmPassword
                          ? 'border-emerald-500/50 focus:border-emerald-500'
                          : 'border-rose-500/50 focus:border-rose-500'
                        : 'border-white/10 focus:border-red-500/50'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Turnstile Widget */}
              <div className="flex justify-center pt-0.5">
                <TurnstileWidget
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                  theme="dark"
                  size="normal"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || checkingUsername || usernameAvailable === false || !turnstileToken || (password.length > 0 && !isPasswordValid) || (confirmPassword.length > 0 && password !== confirmPassword)}
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-2.5 sm:py-3 font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(225,29,72,0.35)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Sign Up</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="text-center pt-0.5">
                <p className="text-[11px] font-medium text-zinc-400">
                  Already have an account? <Link href="/login" className="font-bold text-red-400 hover:text-red-300 hover:underline underline-offset-4 ml-1 transition-colors">Sign In</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
