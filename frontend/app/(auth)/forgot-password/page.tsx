'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, Key, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'request' | 'verify' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [hollywood, setHollywood] = useState<string[]>([]);
  const [bollywood, setBollywood] = useState<string[]>([]);
  const [anime, setAnime] = useState<string[]>([]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch categorized posters from backend
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
        console.error('Failed to fetch posters:', err);
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

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-code', { email, code });
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, new_password: newPassword });
      setStep('success');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password');
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

      {/* Right side: Multi-step Flow */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-[45%] border-l border-white/5 bg-[#000000] z-20">
        <div className="mb-10 text-center select-none">
           <div className="flex items-center justify-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg border-2 border-white">
                <span className="text-lg font-black italic tracking-tighter">M</span>
              </div>
              <span className="text-xl font-black tracking-[0.2em] uppercase">MOCTALE</span>
           </div>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="glass rounded-[2rem] bg-[#121212]/30 p-8 shadow-2xl border border-white/10 overflow-hidden">
            <AnimatePresence mode="wait">
              {step === 'request' && (
                <motion.div 
                  key="request"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-100">Reset Password</h2>
                    <p className="text-xs text-zinc-500 mt-2">Enter your email to receive a 6-digit code.</p>
                  </div>
                  
                  {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 py-3 px-4 text-center text-[13px] text-red-500">{error}</div>}

                  <form onSubmit={handleRequestCode} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input 
                          type="email" 
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl bg-white/[0.03] border border-white/10 pl-11 pr-5 py-3.5 text-sm font-medium placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full rounded-full bg-zinc-200 py-3.5 font-bold text-black text-sm transition-all hover:bg-white active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-white/5"
                    >
                      {loading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                    
                    <div className="text-center pt-2">
                       <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest">
                         <ArrowLeft size={12} /> Back to Login
                       </Link>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 'verify' && (
                <motion.div 
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-100">Verify Code</h2>
                    <p className="text-xs text-zinc-500 mt-2">Enter the 6-digit code sent to <strong>{email}</strong></p>
                  </div>

                  {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 py-3 px-4 text-center text-[13px] text-red-500">{error}</div>}

                  <form onSubmit={handleVerifyCode} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 ml-1">Verification Code</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input 
                          type="text" 
                          placeholder="000000"
                          maxLength={6}
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="w-full rounded-xl bg-white/[0.03] border border-white/10 pl-11 pr-5 py-3.5 text-center text-lg font-black tracking-[0.5em] placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full rounded-full bg-zinc-200 py-3.5 font-bold text-black text-sm transition-all hover:bg-white active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-white/5"
                    >
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => setStep('request')}
                      className="w-full text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest text-center"
                    >
                      Resend Code
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 'reset' && (
                <motion.div 
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-100">New Password</h2>
                    <p className="text-xs text-zinc-500 mt-2">Almost there! Set your new password below.</p>
                  </div>

                  {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 py-3 px-4 text-center text-[13px] text-red-500">{error}</div>}

                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 ml-1">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-xl bg-white/[0.03] border border-white/10 pl-11 pr-5 py-3.5 text-sm font-medium placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"
                          required
                          minLength={6}
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

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full rounded-full bg-zinc-200 py-3.5 font-bold text-black text-sm transition-all hover:bg-white active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-white/5"
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center space-y-6 py-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                    <CheckCircle2 size={64} className="text-emerald-500 relative z-10" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-100">Password Reset!</h2>
                    <p className="text-xs text-zinc-500 mt-2">Redirecting you to login...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 flex items-center gap-3 select-none">
           <ShieldCheck size={16} className="text-emerald-500 opacity-50" />
           <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Secure Reset Protocol</span>
        </div>
      </div>
      
      {/* Animations */}
      <style jsx global>{`
        @keyframes scrollUp {
          from { transform: translateY(0); }
          to { transform: translateY(-33.33%); }
        }
        @keyframes scrollDown {
          from { transform: translateY(-33.33%); }
          to { transform: translateY(0); }
        }
        .glass {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </div>
  );
}
