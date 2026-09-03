import { createAvatar } from '@dicebear/core';
import * as lorelei from '@dicebear/lorelei';

import type { DiceBearConfigOptions, DiceBearStyleName, DiceBearStyleType } from './Avatar.types';

// ─── Style Loading ────────────────────────────────────────────────────────────
// `@dicebear/collection` re-exports all 19 style packages (SVG generators —
// ~150-260KB of source each) as one eager barrel import. `Avatar` renders on
// nearly every page (Navbar, comments, posts, cards…) and 99% of the time it
// only ever needs 'lorelei' — the default and only style anything in the app
// actually requests outside the avatar customizer. Bundling all 19 styles into
// every page's JS to serve that one case was pure dead weight.
//
// Only 'lorelei' is a static import, so it's always available synchronously
// (the render path in Avatar.tsx must never wait on a network request). Every
// other style loads on demand via `loadDiceBearStyle`, which the avatar
// customizer (the only place that renders every style, for the picker) awaits
// through `generateDiceBearDataUriAsync`.
type StyleLoader = () => Promise<DiceBearStyleType>;

const STYLE_LOADERS: Record<DiceBearStyleName, StyleLoader> = {
  lorelei: () => Promise.resolve(lorelei as unknown as DiceBearStyleType),
  loreleiNeutral: () => import('@dicebear/lorelei-neutral').then((m) => m as unknown as DiceBearStyleType),
  bottts: () => import('@dicebear/bottts').then((m) => m as unknown as DiceBearStyleType),
  botttsNeutral: () => import('@dicebear/bottts-neutral').then((m) => m as unknown as DiceBearStyleType),
  avataaars: () => import('@dicebear/avataaars').then((m) => m as unknown as DiceBearStyleType),
  avataaarsNeutral: () => import('@dicebear/avataaars-neutral').then((m) => m as unknown as DiceBearStyleType),
  thumbs: () => import('@dicebear/thumbs').then((m) => m as unknown as DiceBearStyleType),
  personas: () => import('@dicebear/personas').then((m) => m as unknown as DiceBearStyleType),
  notionists: () => import('@dicebear/notionists').then((m) => m as unknown as DiceBearStyleType),
  notionistsNeutral: () => import('@dicebear/notionists-neutral').then((m) => m as unknown as DiceBearStyleType),
  micah: () => import('@dicebear/micah').then((m) => m as unknown as DiceBearStyleType),
  openPeeps: () => import('@dicebear/open-peeps').then((m) => m as unknown as DiceBearStyleType),
  pixelArt: () => import('@dicebear/pixel-art').then((m) => m as unknown as DiceBearStyleType),
  adventurer: () => import('@dicebear/adventurer').then((m) => m as unknown as DiceBearStyleType),
  bigSmile: () => import('@dicebear/big-smile').then((m) => m as unknown as DiceBearStyleType),
  funEmoji: () => import('@dicebear/fun-emoji').then((m) => m as unknown as DiceBearStyleType),
  initials: () => import('@dicebear/initials').then((m) => m as unknown as DiceBearStyleType),
  shapes: () => import('@dicebear/shapes').then((m) => m as unknown as DiceBearStyleType),
  rings: () => import('@dicebear/rings').then((m) => m as unknown as DiceBearStyleType),
};

export const DEFAULT_AVATAR_STYLE: DiceBearStyleName = 'lorelei';

const loadedStyles = new Map<DiceBearStyleName, DiceBearStyleType>([
  ['lorelei', lorelei as unknown as DiceBearStyleType],
]);
const pendingLoads = new Map<DiceBearStyleName, Promise<DiceBearStyleType>>();

/** Fetches (and caches) a style's generator module. Safe to call repeatedly. */
export async function loadDiceBearStyle(styleName: DiceBearStyleName): Promise<DiceBearStyleType> {
  const cached = loadedStyles.get(styleName);
  if (cached) return cached;

  const pending = pendingLoads.get(styleName);
  if (pending) return pending;

  const loader = STYLE_LOADERS[styleName] ?? STYLE_LOADERS[DEFAULT_AVATAR_STYLE];
  const promise = loader()
    .then((style) => {
      loadedStyles.set(styleName, style);
      pendingLoads.delete(styleName);
      return style;
    })
    .catch((error) => {
      pendingLoads.delete(styleName);
      console.error('[DiceBear] Failed to load style:', styleName, error);
      return lorelei as unknown as DiceBearStyleType;
    });
  pendingLoads.set(styleName, promise);
  return promise;
}

/** Synchronously available styles right now — 'lorelei' plus anything already loaded. */
export function isDiceBearStyleReady(styleName: DiceBearStyleName): boolean {
  return loadedStyles.has(styleName);
}

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

function setCache(key: string, value: string) {
  if (avatarCache.size >= MAX_CACHE_SIZE) {
    const firstKey = avatarCache.keys().next().value;
    if (firstKey) avatarCache.delete(firstKey);
  }
  avatarCache.set(key, value);
}

function renderAvatar(style: DiceBearStyleType, seed: string, options: DiceBearConfigOptions) {
  return createAvatar(style, {
    seed,
    size: options.size,
    radius: options.radius ?? 50,
    scale: options.scale,
    rotate: options.rotate,
    flip: options.flip,
    backgroundColor: options.backgroundColor,
  });
}

function fallbackSvgDataUri(seed: string): string {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23222"><rect width="100" height="100" rx="50"/><text x="50" y="55" fill="%23fff" font-size="36" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">${seed.slice(0, 2).toUpperCase()}</text></svg>`;
}

/**
 * Generates a deterministic DiceBear avatar as a safe Data URI (SVG / UTF-8 Data URL).
 *
 * Synchronous by design — `Avatar.tsx` calls this on every render and must
 * never block on a network request. If `styleName` hasn't been loaded yet
 * (anything but 'lorelei', before `loadDiceBearStyle` resolves it), this
 * renders with 'lorelei' as an immediate placeholder rather than waiting; use
 * `generateDiceBearDataUriAsync` when the exact style must be correct
 * up front (e.g. the style picker).
 */
export function generateDiceBearDataUri(options: DiceBearConfigOptions): string {
  const seed = String(options.seed || 'default-user').trim();
  const styleName = options.styleName || DEFAULT_AVATAR_STYLE;
  const requestedStyle = options.customStyle || loadedStyles.get(styleName);
  // True whenever we're about to substitute 'lorelei' because the requested
  // style hasn't loaded yet — that result must NOT be cached under the real
  // style's key, or the correct render (once the style arrives) would never
  // win the cache lookup and the placeholder would stick forever.
  const isPlaceholder = !requestedStyle;
  const style = requestedStyle || (lorelei as unknown as DiceBearStyleType);

  const cacheKey = getCacheKey({ ...options, seed, styleName });
  if (!isPlaceholder) {
    const cached = avatarCache.get(cacheKey);
    if (cached) return cached;
  }

  try {
    const dataUri = renderAvatar(style, seed, options).toDataUri();
    if (!isPlaceholder) setCache(cacheKey, dataUri);
    return dataUri;
  } catch (error) {
    console.error('[DiceBear] Error generating avatar for seed:', seed, error);
    return fallbackSvgDataUri(seed);
  }
}

/**
 * Async counterpart of `generateDiceBearDataUri` that loads the requested
 * style on demand first, so the result is always the correct style rather
 * than the 'lorelei' placeholder. Use this wherever the user is actively
 * choosing/previewing a non-default style (the avatar customizer).
 */
export async function generateDiceBearDataUriAsync(options: DiceBearConfigOptions): Promise<string> {
  const seed = String(options.seed || 'default-user').trim();
  const styleName = options.styleName || DEFAULT_AVATAR_STYLE;
  const style = options.customStyle || (await loadDiceBearStyle(styleName));

  const cacheKey = getCacheKey({ ...options, seed, styleName });
  const cached = avatarCache.get(cacheKey);
  if (cached) return cached;

  try {
    const dataUri = renderAvatar(style, seed, options).toDataUri();
    setCache(cacheKey, dataUri);
    return dataUri;
  } catch (error) {
    console.error('[DiceBear] Error generating avatar for seed:', seed, error);
    return fallbackSvgDataUri(seed);
  }
}

/**
 * Generates a deterministic DiceBear avatar as raw SVG string. Only ever
 * called (today) from the avatar customizer's own preview/export paths,
 * which already hold a loaded style via `loadDiceBearStyle` — kept
 * synchronous to match, with the same 'lorelei' placeholder behavior as
 * `generateDiceBearDataUri` if the style isn't loaded yet.
 */
export function generateDiceBearSvg(options: DiceBearConfigOptions): string {
  const seed = String(options.seed || 'default-user').trim();
  const styleName = options.styleName || DEFAULT_AVATAR_STYLE;
  const style = options.customStyle || loadedStyles.get(styleName) || (lorelei as unknown as DiceBearStyleType);

  try {
    return renderAvatar(style, seed, options).toString();
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
