'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Dices,
  Palette,
  Check,
  Camera,
  Upload,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CldUploadWidget } from 'next-cloudinary';
import {
  generateDiceBearDataUri,
  loadDiceBearStyle,
  DEFAULT_AVATAR_STYLE,
} from '@/components/Avatar/dicebear';
import type { DiceBearStyleName } from '@/components/Avatar/Avatar.types';
import toast from '@/lib/toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAvatarUpdated?: (newAvatarUrl: string) => void;
}

interface StyleOption {
  id: DiceBearStyleName;
  name: string;
}

interface CloudinaryUploadResult {
  info?: {
    secure_url?: string;
  };
}

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'lorelei', name: 'Lorelei' },
  { id: 'avataaars', name: 'Avataaars' },
  { id: 'bottts', name: 'Bottts' },
  { id: 'personas', name: 'Personas' },
  { id: 'notionists', name: 'Notionist' },
  { id: 'micah', name: 'Micah' },
  { id: 'pixelArt', name: 'Pixel Art' },
  { id: 'adventurer', name: 'Adventurer' },
  { id: 'bigSmile', name: 'Big Smile' },
  { id: 'funEmoji', name: 'Fun Emoji' },
  { id: 'thumbs', name: 'Thumbs' },
  { id: 'openPeeps', name: 'Peeps' },
];

const COLOR_PALETTES = [
  { name: 'Dark Void', color: '#121216', hex: ['121216'] },
  { name: 'Crimson', color: '#e50914', hex: ['2e0d11', 'e50914'] },
  { name: 'Violet', color: '#8b5cf6', hex: ['1f1033', '8b5cf6'] },
  { name: 'Cyan', color: '#06b6d4', hex: ['0a2540', '06b6d4'] },
  { name: 'Amber', color: '#f59e0b', hex: ['331a00', 'f59e0b'] },
  { name: 'Emerald', color: '#10b981', hex: ['062c1e', '10b981'] },
  { name: 'Pastel', color: '#c0aede', hex: ['ffd1dc', 'c0aede'] },
  { name: 'Light', color: '#ffffff', hex: ['ffffff'] },
];

const RANDOM_SEEDS = [
  'BladeRunner',
  'NeoMatrix',
  'CinemaBuff',
  'Interstellar',
  'Oppenheimer',
  'Godfather',
  'PulpFiction',
  'Dune',
  'Kubrick',
  'SpiritedAway',
  'Whiplash',
  'LaLaLand',
];

export default function AvatarCustomizerModal({ isOpen, onClose, onAvatarUpdated }: Props) {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'dicebear' | 'upload'>('dicebear');
  const [styleName, setStyleName] = useState<DiceBearStyleName>(DEFAULT_AVATAR_STYLE);
  const [seed, setSeed] = useState(user?.username || user?.name || 'Cinephile');
  const [selectedPalette, setSelectedPalette] = useState<string[]>(['121216']);
  const [scale, setScale] = useState(100);
  const [rotate, setRotate] = useState(0);
  const [flip, setFlip] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  // The style picker grid below renders a live thumbnail per option, so as
  // soon as the (already lazily-mounted) modal opens, fetch every style it
  // offers. Each is its own chunk (see components/Avatar/dicebear.ts) — until
  // they land, `generateDiceBearDataUri` below draws the 'lorelei' style as a
  // placeholder, then this flips and everything redraws in the right style.
  const [stylesReady, setStylesReady] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    Promise.all(STYLE_OPTIONS.map((opt) => loadDiceBearStyle(opt.id))).then(() => {
      if (!cancelled) setStylesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Generate live DiceBear data URI
  const liveDicebearUri = useMemo(() => {
    return generateDiceBearDataUri({
      seed,
      styleName,
      size: 160,
      radius: 50,
      scale,
      rotate,
      flip,
      backgroundColor: selectedPalette,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, styleName, scale, rotate, flip, selectedPalette, stylesReady]);

  // Preview source depending on tab
  const previewSrc = activeTab === 'upload' && customPhotoUrl ? customPhotoUrl : liveDicebearUri;

  const handleRollDice = () => {
    const randomSeed = RANDOM_SEEDS[Math.floor(Math.random() * RANDOM_SEEDS.length)] + '_' + Math.floor(Math.random() * 900 + 100);
    setSeed(randomSeed);
  };

  const handleSaveAvatar = async () => {
    if (!user) return;
    setSaving(true);

    const newAvatarUrl = activeTab === 'upload' && customPhotoUrl ? customPhotoUrl : liveDicebearUri;

    try {
      const res = await api.patch('/auth/profile', {
        avatar_url: newAvatarUrl,
      });

      updateUser(res.data);

      if (onAvatarUpdated) {
        onAvatarUpdated(newAvatarUrl);
      }

      // canvas-confetti only fires here, on a successful save — load it on
      // demand instead of shipping it in every page that can render this modal.
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#E50914', '#8B5CF6', '#F59E0B'],
        });
      });

      toast.success('Avatar updated successfully!');
      onClose();
    } catch (err: unknown) {
      console.error('Failed to update avatar:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Failed to save avatar.';
      toast.error(errorMessage || 'Failed to save avatar.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await api.patch('/auth/profile', {
        avatar_url: '',
      });
      updateUser(res.data);
      if (onAvatarUpdated) onAvatarUpdated('');
      setCustomPhotoUrl('');
      toast.info('Avatar reset to default.');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset avatar.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            background: '#0d0d11',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: 28,
            width: '100%',
            maxWidth: 620,
            maxHeight: '88vh',
            overflowY: 'auto',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8)',
            position: 'relative',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
                Customize Avatar
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                Select a style or generate with DiceBear
              </p>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Center Avatar Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  position: 'relative',
                  width: 104,
                  height: 104,
                  borderRadius: '50%',
                  padding: 3,
                  background: 'linear-gradient(135deg, rgba(229,9,20,0.8), rgba(139,92,246,0.8))',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#121216',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSrc}
                    alt="Avatar Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>

              {/* Minimal Tab Switcher */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  background: 'rgba(255,255,255,0.04)',
                  padding: 3,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('dicebear')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 9,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: activeTab === 'dicebear' ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: activeTab === 'dicebear' ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Palette size={13} style={{ color: 'var(--primary, #E50914)' }} /> Studio
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 9,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: activeTab === 'upload' ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: activeTab === 'upload' ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Camera size={13} /> Photo
                </button>
              </div>
            </div>

            {/* TAB 1: DICEBEAR STUDIO */}
            {activeTab === 'dicebear' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1. Style Selection Horizontal Grid */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>
                    Art Style
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 8,
                    }}
                  >
                    {STYLE_OPTIONS.map((styleOpt) => {
                      const isSelected = styleName === styleOpt.id;
                      // `stylesReady` isn't read here, but its change triggers the
                      // re-render this needs: once every picker style has loaded
                      // (see the effect above), generateDiceBearDataUri stops
                      // substituting the 'lorelei' placeholder for the real style.
                      const thumbUri = generateDiceBearDataUri({
                        seed: user?.username || 'cinephile',
                        styleName: styleOpt.id,
                        size: 32,
                      });

                      return (
                        <button
                          key={styleOpt.id}
                          type="button"
                          onClick={() => setStyleName(styleOpt.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 10px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            background: isSelected ? 'rgba(229,9,20,0.15)' : 'rgba(255,255,255,0.03)',
                            border: isSelected
                              ? '1px solid var(--primary, #E50914)'
                              : '1px solid rgba(255,255,255,0.05)',
                            textAlign: 'left',
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbUri}
                            alt=""
                            style={{ width: 24, height: 24, borderRadius: '50%', background: '#111', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#fff' : 'rgba(255,255,255,0.75)' }} className="truncate">
                            {styleOpt.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Character DNA (Seed Input with Inline Dice Button) */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>
                    Character Seed
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="Type custom name or character tag..."
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 14,
                        padding: '10px 42px 10px 14px',
                        color: '#fff',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRollDice}
                      title="Roll Random Seed"
                      style={{
                        position: 'absolute',
                        right: 8,
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)',
                        border: 'none',
                        color: '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Dices size={15} />
                    </button>
                  </div>
                </div>

                {/* 3. Mood Color Palette (Minimal Swatch Circles) */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>
                    Background Mood
                  </label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {COLOR_PALETTES.map((palette) => {
                      const isSelected = selectedPalette[0] === palette.hex[0];
                      return (
                        <button
                          key={palette.name}
                          type="button"
                          onClick={() => setSelectedPalette(palette.hex)}
                          title={palette.name}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: palette.color,
                            border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                            transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                            cursor: 'pointer',
                            transition: 'transform 0.15s',
                            boxShadow: isSelected ? '0 0 10px rgba(255,255,255,0.4)' : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 4. Collapsible Advanced Controls */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <SlidersHorizontal size={13} />
                    {showAdvanced ? 'Hide fine-tuning' : 'Fine-tuning (Zoom, Rotate, Flip)'}
                  </button>

                  {showAdvanced && (
                    <div
                      style={{
                        marginTop: 10,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr auto',
                        gap: 14,
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                          <span>Zoom</span>
                          <span>{scale}%</span>
                        </div>
                        <input
                          type="range"
                          min={80}
                          max={130}
                          value={scale}
                          onChange={(e) => setScale(Number(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--primary, #E50914)', height: 4 }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                          <span>Rotate</span>
                          <span>{rotate}°</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={rotate}
                          onChange={(e) => setRotate(Number(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--primary, #E50914)', height: 4 }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setFlip(!flip)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: flip ? 'rgba(229,9,20,0.2)' : 'rgba(255,255,255,0.05)',
                          border: flip ? '1px solid var(--primary, #E50914)' : '1px solid rgba(255,255,255,0.08)',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {flip ? 'Mirrored' : 'Flip'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: UPLOAD PHOTO */}
            {activeTab === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  style={{
                    padding: 24,
                    borderRadius: 18,
                    border: '1px dashed rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 12,
                  }}
                >
                  <Upload size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                      Upload Profile Picture
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      JPG, PNG, WebP from your device
                    </div>
                  </div>

                  <CldUploadWidget
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    onSuccess={(result: unknown) => {
                      const uploadRes = result as CloudinaryUploadResult;
                      if (uploadRes.info?.secure_url) {
                        setCustomPhotoUrl(uploadRes.info.secure_url);
                      }
                    }}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open?.()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 18px',
                          borderRadius: 12,
                          background: '#fff',
                          color: '#000',
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Camera size={14} /> Choose Image
                      </button>
                    )}
                  </CldUploadWidget>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>
                    Or Direct Image URL
                  </label>
                  <input
                    type="url"
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: '8px 14px',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              <RefreshCw size={12} /> Reset to Default
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  padding: '9px 16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 22px',
                  borderRadius: 12,
                  background: 'var(--primary, #E50914)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(229,9,20,0.35)',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Save Avatar
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
