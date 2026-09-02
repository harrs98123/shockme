'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PlotmintLogoProps {
  size?: 'small' | 'mobile' | 'desktop' | 'medium' | 'large' | number;
  className?: string;
  animate?: boolean;
}

export default function PlotmintLogo({
  size = 'desktop',
  className = '',
  animate = true,
}: PlotmintLogoProps) {
  const isSmall = size === 'small';
  const isMobile = size === 'mobile';
  const isMedium = size === 'medium';
  const isLarge = size === 'large';

  const fontSize =
    typeof size === 'number'
      ? size
      : isLarge
        ? 34
        : isMedium
          ? 28
          : isSmall
            ? 18
            : isMobile
              ? 22
              : 26;

  // Sizing for the 4-pointed sparkle star icon
  const sparkleSize = Math.max(12, Math.round(fontSize * 0.72));
  const sparkleMargin = Math.max(3, Math.round(fontSize * 0.14));

  return (
    <motion.span
      whileHover={{ scale: 1.03, filter: 'drop-shadow(0 0 16px rgba(0, 229, 153, 0.4))' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`inline-flex items-center select-none cursor-pointer ${className}`}
      style={{
        fontSize,
        fontFamily: "var(--font-poppins), 'Plus Jakarta Sans', var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontWeight: 800,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        textDecoration: 'none',
      }}
    >
      {/* "plot" - Crisp White */}
      <span
        style={{
          color: '#FFFFFF',
          fontWeight: 800,
          letterSpacing: '-0.035em',
        }}
      >
        plot
      </span>

      {/* "mint" - Electric Vibrant Mint Green */}
      <span
        style={{
          color: '#00E599',
          fontWeight: 800,
          letterSpacing: '-0.035em',
        }}
      >
        mint
      </span>

      {/* Electric Cyan 4-Pointed Sparkle Star Icon */}
      <motion.svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        style={{
          width: sparkleSize,
          height: sparkleSize,
          color: '#00F0FF',
          marginLeft: sparkleMargin,
          flexShrink: 0,
          filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.65))',
        }}
        animate={
          animate
            ? {
                scale: [1, 1.15, 1],
                rotate: [0, 6, 0, -6, 0],
                filter: [
                  'drop-shadow(0 0 6px rgba(0, 240, 255, 0.5))',
                  'drop-shadow(0 0 14px rgba(0, 240, 255, 0.9))',
                  'drop-shadow(0 0 6px rgba(0, 240, 255, 0.5))',
                ],
              }
            : undefined
        }
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
      </motion.svg>
    </motion.span>
  );
}

