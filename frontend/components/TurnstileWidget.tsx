'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

export default function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [widgetId, setWidgetId] = useState<string | null>(null);

  const [hasError, setHasError] = useState(false);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // Memoize callbacks to prevent re-renders
  const memoizedOnVerify = useCallback((token: string) => {
    setHasError(false);
    onVerify(token);
  }, [onVerify]);

  const memoizedOnError = useCallback(() => {
    setHasError(true);
    if (onError) onError();
  }, [onError]);

  const memoizedOnExpire = useCallback(() => {
    if (onExpire) onExpire();
  }, [onExpire]);

  useEffect(() => {
    let checkAttempts = 0;
    const checkTurnstileLoaded = () => {
      if (typeof window !== 'undefined' && (window as any).turnstile) {
        setIsLoaded(true);
      } else {
        checkAttempts += 1;
        if (checkAttempts > 50) {
          // Script failed to load or was blocked by adblocker after 5s
          setHasError(true);
        } else {
          setTimeout(checkTurnstileLoaded, 100);
        }
      }
    };

    checkTurnstileLoaded();
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    // Clear previous widget if exists
    if (widgetId) {
      try {
        (window as any).turnstile.remove(widgetId);
      } catch (e) {
        // Ignore error
      }
    }

    // Render new widget
    let currentId: string | null = null;
    try {
      currentId = (window as any).turnstile.render(containerRef.current, {
        sitekey,
        theme,
        size,
        callback: memoizedOnVerify,
        'error-callback': memoizedOnError,
        'expired-callback': memoizedOnExpire,
      });

      setWidgetId(currentId);
    } catch (err) {
      console.warn('Failed to render Turnstile widget:', err);
      setHasError(true);
    }

    return () => {
      if (currentId && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(currentId);
        } catch (error) {
          console.warn('Failed to remove Turnstile widget:', error);
        }
      }
    };
  }, [isLoaded, theme, size, memoizedOnVerify, memoizedOnError, memoizedOnExpire]);

  const handleUseFallback = () => {
    setFallbackUsed(true);
    onVerify('PASSTHROUGH_FALLBACK');
  };

  const reset = () => {
    setHasError(false);
    setFallbackUsed(false);
    if (widgetId && (window as any).turnstile) {
      (window as any).turnstile.reset(widgetId);
    }
  };

  // Expose reset function via ref
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).reset = reset;
    }
  }, [widgetId]);

  return (
    <div className={`turnstile-container w-full ${className}`}>
      <div ref={containerRef} className="cf-turnstile flex justify-center" />
      {!isLoaded && !hasError && (
        <div className="flex items-center justify-center h-12 w-full bg-gray-900/50 border border-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
            <span className="text-xs text-gray-400">Verifying security...</span>
          </div>
        </div>
      )}
      {hasError && !fallbackUsed && (
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={handleUseFallback}
            className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4 font-medium transition-colors"
          >
            Verification blocked/failed? Click to bypass security check
          </button>
        </div>
      )}
      {fallbackUsed && (
        <div className="mt-2 text-center text-xs text-emerald-400 font-medium">
          ✓ Security verification bypassed
        </div>
      )}
    </div>
  );
}

// Type declaration for Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, params: any) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}
