'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  /**
   * Everything here — including whatever Client Components a Server Component
   * parent passed in — stays un-rendered (and their JS chunks + any
   * mount-time data fetches un-fetched) until this section scrolls near the
   * viewport. React never reconciles `children` while `visible` is false, so
   * the browser has no reason to load the modules behind it yet.
   */
  children: ReactNode;
  /** How far below the viewport to start loading. Default: a healthy head start so content is ready before it's scrolled into view. */
  rootMargin?: string;
  /** Reserves layout space before the real content mounts, to avoid a scroll-jump once it does. */
  minHeight?: number | string;
  className?: string;
}

/**
 * Defers mounting `children` until the wrapping element is within
 * `rootMargin` of the viewport. Built for below-the-fold sections (community
 * widgets, comment threads, secondary panels) that are client-rendered and
 * fetch their own data — sections that render nothing meaningful in SSR HTML
 * anyway, so there's no SEO cost to deferring them, only a JS/network cost
 * saved on initial page load.
 */
export default function LazyMount({ children, rootMargin = '600px', minHeight, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // No IntersectionObserver support (very old browser) — start visible rather
  // than setting state synchronously inside the effect below to get there.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={className} style={minHeight && !visible ? { minHeight } : undefined}>
      {visible ? children : null}
    </div>
  );
}
