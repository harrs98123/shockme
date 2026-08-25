import { createAvatar } from '@dicebear/core';
import {
  lorelei,
  loreleiNeutral,
  bottts,
  botttsNeutral,
  avataaars,
  avataaarsNeutral,
  thumbs,
  personas,
  notionists,
  notionistsNeutral,
  micah,
  openPeeps,
  pixelArt,
  adventurer,
  bigSmile,
  funEmoji,
  initials,
  shapes,
  rings,
} from '@dicebear/collection';

import type { DiceBearConfigOptions, DiceBearStyleName, DiceBearStyleType } from './Avatar.types';

// ─── Style Registry ──────────────────────────────────────────────────────────
export const DICEBEAR_STYLES: Record<DiceBearStyleName, DiceBearStyleType> = {
  lorelei: lorelei as unknown as DiceBearStyleType,
  loreleiNeutral: loreleiNeutral as unknown as DiceBearStyleType,
  bottts: bottts as unknown as DiceBearStyleType,
  botttsNeutral: botttsNeutral as unknown as DiceBearStyleType,
  avataaars: avataaars as unknown as DiceBearStyleType,
  avataaarsNeutral: avataaarsNeutral as unknown as DiceBearStyleType,
  thumbs: thumbs as unknown as DiceBearStyleType,
  personas: personas as unknown as DiceBearStyleType,
  notionists: notionists as unknown as DiceBearStyleType,
  notionistsNeutral: notionistsNeutral as unknown as DiceBearStyleType,
  micah: micah as unknown as DiceBearStyleType,
  openPeeps: openPeeps as unknown as DiceBearStyleType,
  pixelArt: pixelArt as unknown as DiceBearStyleType,
  adventurer: adventurer as unknown as DiceBearStyleType,
  bigSmile: bigSmile as unknown as DiceBearStyleType,
  funEmoji: funEmoji as unknown as DiceBearStyleType,
  initials: initials as unknown as DiceBearStyleType,
  shapes: shapes as unknown as DiceBearStyleType,
  rings: rings as unknown as DiceBearStyleType,
};

export const DEFAULT_AVATAR_STYLE: DiceBearStyleName = 'lorelei';

// ─── In-Memory Avatar Cache ──────────────────────────────────────────────────
const avatarCache = new Map<string, string>();
const MAX_CACHE_SIZE = 1000;

function getCacheKey(options: DiceBearConfigOptions): string {
  return JSON.stringify({
    s: options.seed,
    style: options.styleName || DEFAULT_AVATAR_STYLE,
    bg: options.backgroundColor,
    r: options.radius,
    sc: options.scale,
    rot: options.rotate,
    fl: options.flip,
    sz: options.size,
  });
}

/**
 * Generates a deterministic DiceBear avatar as a safe Data URI (SVG / UTF-8 Data URL).
 */
export function generateDiceBearDataUri(options: DiceBearConfigOptions): string {
  const seed = String(options.seed || 'default-user').trim();
  const styleName = options.styleName || DEFAULT_AVATAR_STYLE;
  const style = options.customStyle || DICEBEAR_STYLES[styleName] || lorelei;

  const cacheKey = getCacheKey({ ...options, seed, styleName });
  const cached = avatarCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const avatar = createAvatar(style, {
      seed,
      size: options.size,
      radius: options.radius ?? 50,
      scale: options.scale,
      rotate: options.rotate,
      flip: options.flip,
      backgroundColor: options.backgroundColor,
    });

    const dataUri = avatar.toDataUri();

    if (avatarCache.size >= MAX_CACHE_SIZE) {
      const firstKey = avatarCache.keys().next().value;
      if (firstKey) avatarCache.delete(firstKey);
    }

    avatarCache.set(cacheKey, dataUri);
    return dataUri;
  } catch (error) {
    console.error('[DiceBear] Error generating avatar for seed:', seed, error);
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23222"><rect width="100" height="100" rx="50"/><text x="50" y="55" fill="%23fff" font-size="36" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">${seed.slice(0, 2).toUpperCase()}</text></svg>`;
  }
}

/**
 * Generates a deterministic DiceBear avatar as raw SVG string.
 */
export function generateDiceBearSvg(options: DiceBearConfigOptions): string {
  const seed = String(options.seed || 'default-user').trim();
  const styleName = options.styleName || DEFAULT_AVATAR_STYLE;
  const style = options.customStyle || DICEBEAR_STYLES[styleName] || lorelei;

  try {
    const avatar = createAvatar(style, {
      seed,
      size: options.size,
      radius: options.radius ?? 50,
      scale: options.scale,
      rotate: options.rotate,
      flip: options.flip,
      backgroundColor: options.backgroundColor,
    });

    return avatar.toString();
  } catch (error) {
    console.error('[DiceBear] Error generating SVG for seed:', seed, error);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#222"><circle cx="50" cy="50" r="50"/><text x="50" y="55" fill="#fff" font-size="36" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">${seed.slice(0, 2).toUpperCase()}</text></svg>`;
  }
}

/**
 * Utility helper to determine avatar source URL:
 * Returns uploaded `src` if non-empty, otherwise returns generated DiceBear avatar.
 */
export function getAvatarSrc(
  src?: string | null,
  seed?: string | number | null,
  name?: string | null,
  styleName: DiceBearStyleName = DEFAULT_AVATAR_STYLE
): string {
  if (src && typeof src === 'string' && src.trim().length > 0) {
    return src;
  }
  const effectiveSeed = seed != null && String(seed).trim() !== '' ? String(seed) : (name || 'anonymous');
  return generateDiceBearDataUri({ seed: effectiveSeed, styleName });
}
