import React from 'react';
import type { Options as DiceBearCoreOptions, Style } from '@dicebear/core';

export type DiceBearStyleName =
  | 'lorelei'
  | 'loreleiNeutral'
  | 'bottts'
  | 'botttsNeutral'
  | 'avataaars'
  | 'avataaarsNeutral'
  | 'thumbs'
  | 'personas'
  | 'notionists'
  | 'notionistsNeutral'
  | 'micah'
  | 'openPeeps'
  | 'pixelArt'
  | 'adventurer'
  | 'bigSmile'
  | 'funEmoji'
  | 'initials'
  | 'shapes'
  | 'rings';

export type DiceBearStyleType = Style<Record<string, unknown>>;

export interface DiceBearConfigOptions extends Partial<DiceBearCoreOptions> {
  seed: string;
  styleName?: DiceBearStyleName;
  customStyle?: DiceBearStyleType;
}

export interface AvatarProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /**
   * Optional custom/uploaded image URL. If provided and valid, renders this image.
   * If not provided or fails to load, falls back to deterministic DiceBear avatar.
   */
  src?: string | null;

  /**
   * Deterministic seed for DiceBear avatar (user ID, username, email, or unique string).
   */
  seed?: string | number | null;

  /**
   * User display name, used for generating alt text and fallback seed.
   */
  name?: string | null;

  /**
   * Pixel dimensions for width and height (square avatar). Default: 40.
   */
  size?: number;

  /**
   * DiceBear style to use. Default: 'lorelei'.
   */
  dicebearStyle?: DiceBearStyleName;

  /**
   * Background color palette (hex array without #, e.g. ['b6e3f4', 'c0aede']).
   */
  backgroundColor?: string[];

  /**
   * Border radius in percent (0-50). Default: 50 (circular).
   */
  radius?: number;

  /**
   * Scale factor for the avatar character (0-200). Default: 100.
   */
  scale?: number;

  /**
   * Rotation in degrees (0-360). Default: 0.
   */
  rotate?: number;

  /**
   * Flip horizontally. Default: false.
   */
  flip?: boolean;

  /**
   * Additional CSS classes.
   */
  className?: string;

  /**
   * Inline styles.
   */
  style?: React.CSSProperties;

  /**
   * Accessible alt text. If not provided, defaults to `${name || 'User'}'s avatar`.
   */
  alt?: string;

  /**
   * If true, marks the avatar as decorative (`aria-hidden="true"` and empty alt).
   * Useful when displayed directly next to visible user name text.
   */
  decorative?: boolean;
}
