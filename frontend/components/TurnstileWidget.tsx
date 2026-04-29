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

  // Memoize callbacks to prevent re-renders
  const memoizedOnVerify = useCallback((token: string) => {
    onVerify(token);
  }, [onVerify]);

  const memoizedOnError = useCallback(() => {
    if (onError) onError();
  }, [onError]);

  const memoizedOnExpire = useCallback(() => {
    if (onExpire) onExpire();
  }, [onExpire]);

  useEffect(() => {
    const checkTurnstileLoaded = () => {
      if (typeof window !== 'undefined' && (window as any).turnstile) {
        setIsLoaded(true);
      } else {
        setTimeout(checkTurnstileLoaded, 100);
      }
    };

    checkTurnstileLoaded();
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAC0DzxiQGDlEQxfy';

    // Clear previous widget if exists
    if (widgetId) {
      (window as any).turnstile.remove(widgetId);
    }

    // Render new widget
    const id = (window as any).turnstile.render(containerRef.current, {
      sitekey,
      theme,
      size,
      callback: memoizedOnVerify,
      'error-callback': memoizedOnError,
      'expired-callback': memoizedOnExpire,
    });

    setWidgetId(id);

    return () => {
      if (id && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(id);
        } catch (error) {
          console.warn('Failed to remove Turnstile widget:', error);
        }
      }
    };
  }, [isLoaded, theme, size, memoizedOnVerify, memoizedOnError, memoizedOnExpire]);

  const reset = () => {
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
    <div className={`turnstile-container ${className}`}>
      <div ref={containerRef} className="cf-turnstile" />
      {!isLoaded && (
        <div className="flex items-center justify-center h-12 w-full bg-gray-900/50 border border-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
            <span className="text-xs text-gray-400">Verifying...</span>
          </div>
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
