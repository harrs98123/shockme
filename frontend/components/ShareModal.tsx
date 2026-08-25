'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Code,
  QrCode,
  Sparkles,
  Film,
  Send,
  MessageCircle,
  Globe,
  Mail,
} from 'lucide-react';
import Avatar from '@/components/Avatar';

export interface SharePostData {
  id: number | string;
  title?: string;
  content?: string | null;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string | null;
  postType?: string;
  movieTitle?: string;
  url?: string;
  imageUrl?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SharePostData | null;
}

export default function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'social' | 'embed' | 'qr'>('social');
  const [embedCopied, setEmbedCopied] = useState(false);

  // Compute shareable URL
  const shareUrl = useMemo(() => {
    if (!post) return '';
    if (post.url) return post.url;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/feed?post=${post.id}`;
    }
    return `https://plotmint.com/feed?post=${post.id}`;
  }, [post]);

  const shareText = useMemo(() => {
    if (!post) return '';
    const author = post.authorName ? ` by ${post.authorName}` : '';
    const movie = post.movieTitle ? ` about "${post.movieTitle}"` : '';
    const snippet = post.content ? `\n\n"${post.content.slice(0, 120)}${post.content.length > 120 ? '...' : ''}"` : '';
    return `Check out this ${post.postType || 'post'}${movie}${author} on Plotmint! 🎬${snippet}`;
  }, [post]);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const el = document.createElement('textarea');
        el.value = shareUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopyEmbed = async () => {
    const embedCode = `<iframe src="${shareUrl}" width="100%" height="420" frameborder="0" allowfullscreen style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);"></iframe>`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(embedCode);
      }
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy embed code:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: post?.movieTitle || 'Plotmint Post',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  // Social Share Destinations
  const socialTargets = useMemo(() => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedTitle = encodeURIComponent(post?.movieTitle ? `Plotmint: ${post.movieTitle}` : 'Plotmint Cinema Post');

    return [
      {
        name: 'WhatsApp',
        icon: MessageCircle,
        bg: '#25D366',
        color: '#ffffff',
        url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      },
      {
        name: 'X (Twitter)',
        icon: Send,
        bg: '#000000',
        color: '#ffffff',
        border: 'rgba(255,255,255,0.2)',
        url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=Plotmint,Cinema,Movies`,
      },
      {
        name: 'Telegram',
        icon: Send,
        bg: '#229ED9',
        color: '#ffffff',
        url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      },
      {
        name: 'Reddit',
        icon: Globe,
        bg: '#FF4500',
        color: '#ffffff',
        url: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      },
      {
        name: 'Facebook',
        icon: Globe,
        bg: '#1877F2',
        color: '#ffffff',
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      },
      {
        name: 'LinkedIn',
        icon: Globe,
        bg: '#0A66C2',
        color: '#ffffff',
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      },
      {
        name: 'Email',
        icon: Mail,
        bg: '#334155',
        color: '#ffffff',
        url: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
      },
    ];
  }, [shareUrl, shareText, post]);

  if (!isOpen || !post) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            background: '#0d0d12',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(229, 9, 20, 0.15)',
            position: 'relative',
            color: '#fff',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(229,9,20,0.15)',
                  border: '1px solid rgba(229,9,20,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary, #E50914)',
                }}
              >
                <Share2 size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
                  Share Post
                </h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '1px 0 0' }}>
                  Spread the love for cinema across the web
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Post Snippet Card */}
            <div
              style={{
                padding: '14px',
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden' }}>
                    <Avatar
                      src={post.authorAvatar}
                      seed={post.authorUsername || post.authorName || String(post.id)}
                      size={34}
                      className="w-full h-full"
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {post.authorName || 'Cinephile'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                      @{post.authorUsername || 'filmlover'}
                    </div>
                  </div>
                </div>

                {post.postType && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(229,9,20,0.15)',
                      border: '1px solid rgba(229,9,20,0.3)',
                      color: 'var(--primary, #E50914)',
                    }}
                  >
                    {post.postType}
                  </span>
                )}
              </div>

              {post.movieTitle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  <Film size={12} className="text-primary" />
                  <span>{post.movieTitle}</span>
                </div>
              )}

              {post.content && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                    margin: 0,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {post.content}
                </p>
              )}
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: 3,
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {[
                { id: 'social', label: 'Social Apps', icon: Send },
                { id: 'embed', label: 'Embed Code', icon: Code },
                { id: 'qr', label: 'QR Code', icon: QrCode },
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as 'social' | 'embed' | 'qr')}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: 9,
                      background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      border: isSelected ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                      color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Social Share Apps */}
            {activeTab === 'social' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Social App Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                  }}
                >
                  {socialTargets.slice(0, 4).map((target) => {
                    const Icon = target.icon;
                    return (
                      <a
                        key={target.name}
                        href={target.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          padding: '12px 6px',
                          borderRadius: 14,
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          textDecoration: 'none',
                          color: '#fff',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: target.bg,
                            color: target.color,
                            border: target.border || 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                          {target.name}
                        </span>
                      </a>
                    );
                  })}
                </div>

                {/* Secondary Social Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                  }}
                >
                  {socialTargets.slice(4).map((target) => (
                    <a
                      key={target.name}
                      href={target.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: 11,
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                      }}
                    >
                      <ExternalLink size={12} />
                      <span>{target.name}</span>
                    </a>
                  ))}
                </div>

                {/* Direct Native System Share button */}
                {typeof navigator !== 'undefined' && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    <Sparkles size={13} className="text-amber-400" />
                    <span>More Apps (System Share Dialog)</span>
                  </button>
                )}
              </div>
            )}

            {/* Tab 2: Embed Code */}
            {activeTab === 'embed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  Paste this snippet into your blog, Notion, or website:
                </div>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 12,
                    background: '#07070a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: '#34d399',
                    wordBreak: 'break-all',
                    lineHeight: 1.5,
                  }}
                >
                  {`<iframe src="${shareUrl}" width="100%" height="420" frameborder="0" style="border-radius:16px;"></iframe>`}
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmbed}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 10,
                    background: embedCopied ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {embedCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{embedCopied ? 'Embed Snippet Copied!' : 'Copy Embed Code'}</span>
                </button>
              </div>
            )}

            {/* Tab 3: QR Code */}
            {activeTab === 'qr' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    background: '#ffffff',
                    display: 'inline-block',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}&color=0-0-0&bgcolor=255-255-255`}
                    alt="Post QR Code"
                    width={160}
                    height={160}
                    style={{ display: 'block', borderRadius: 8 }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
                  Scan with any phone camera to instantly open this post on Plotmint
                </div>
              </div>
            )}

            {/* Bottom: Copy Link Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 5px 5px 12px',
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {shareUrl}
              </span>

              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: copied ? '#10b981' : 'var(--primary, #E50914)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  boxShadow: copied ? '0 0 16px rgba(16, 185, 129, 0.4)' : '0 0 16px rgba(229, 9, 20, 0.4)',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
