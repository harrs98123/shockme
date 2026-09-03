'use client';

import React, { useState, useMemo } from 'react';
import type { AvatarProps } from './Avatar.types';
import { generateDiceBearDataUri } from './dicebear';

/**
 * Reusable Avatar Component
 *
 * - Renders uploaded image `src` if provided and valid.
 * - Falls back to a deterministic DiceBear avatar when `src` is missing or fails to load.
 * - Uses `seed` (user ID, username, etc.) to ensure the avatar is always stable and deterministic.
 */
export default function Avatar({
  src,
  seed,
  name,
  size = 40,
  dicebearStyle = 'lorelei',
  backgroundColor,
  radius = 50,
  scale = 100,
  rotate = 0,
  flip = false,
  className = '',
  style,
  alt,
  decorative = false,
  onError,
  ...rest
}: AvatarProps) {
  // Track failed src URL without triggering effects during render
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Determine effective seed: seed > name > 'cinephile'
  const effectiveSeed = useMemo(() => {
    if (seed !== undefined && seed !== null && String(seed).trim() !== '') {
      return String(seed).trim();
    }
    if (name && name.trim() !== '') {
      return name.trim();
    }
    return 'cinephile';
  }, [seed, name]);

  // Determine which image source to display
  const hasValidUploadedSrc = Boolean(
    src &&
    typeof src === 'string' &&
    src.trim().length > 0 &&
    failedSrc !== src
  );

  // Most avatars have an uploaded `src` and never need the DiceBear fallback —
  // skip generating (and SVG-serializing) it until it's actually the thing on
  // screen, rather than computing it unconditionally on every render.
  const dicebearDataUri = useMemo(() => {
    if (hasValidUploadedSrc) return null;
    return generateDiceBearDataUri({
      seed: effectiveSeed,
      styleName: dicebearStyle,
      size,
      radius,
      scale,
      rotate,
      flip,
      backgroundColor,
    });
  }, [hasValidUploadedSrc, effectiveSeed, dicebearStyle, size, radius, scale, rotate, flip, backgroundColor]);

  const displaySrc = hasValidUploadedSrc ? (src as string) : (dicebearDataUri as string);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (src) {
      setFailedSrc(src);
    }
    if (onError) {
      onError(e);
    }
  };

  // Accessibility
  const computedAlt = decorative ? '' : (alt || (name ? `${name}'s avatar` : 'User avatar'));

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={displaySrc}
      alt={computedAlt}
      aria-hidden={decorative ? 'true' : undefined}
      width={size}
      height={size}
      onError={handleImageError}
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 object-cover ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius === 50 ? '50%' : `${radius}px`,
        ...style,
      }}
      {...rest}
    />
  );
}
