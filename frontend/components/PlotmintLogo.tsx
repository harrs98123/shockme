'use client';

import { motion } from 'framer-motion';

interface PlotmintLogoProps {
  size?: 'desktop' | 'mobile' | 'medium' | 'large' | number;
  className?: string;
}

export default function PlotmintLogo({ size = 'desktop', className = '' }: PlotmintLogoProps) {
  const isMobile = size === 'mobile';
  const isLarge = size === 'large';
  const isMedium = size === 'medium';
  
  const fontSize = typeof size === 'number' 
    ? size 
    : isLarge 
      ? 34 
      : isMedium
        ? 28
        : isMobile 
          ? 23 
          : 27;

  return (
    <motion.span
      whileHover={{ scale: 1.04, filter: 'drop-shadow(0 0 16px rgba(52, 211, 153, 0.45))' }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      className={className}
      style={{
        fontSize,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 900,
        letterSpacing: '-1.2px',
        display: 'inline-flex',
        alignItems: 'baseline',
        textTransform: 'lowercase',
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* "plot" - Luminous Violet/Indigo Gradient */}
      <span
        style={{
          background: 'linear-gradient(135deg, #F3E8FF 0%, #C084FC 45%, #9333EA 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-flex',
          alignItems: 'baseline',
        }}
      >
        <span style={{ fontSize: '1.22em', lineHeight: 0.8 }}>p</span>
        <span style={{ fontSize: '1.28em', lineHeight: 0.8 }}>l</span>
        <span style={{ fontSize: '0.84em', letterSpacing: '-0.5px' }}>o</span>
        <span style={{ fontSize: '1.16em', lineHeight: 0.85 }}>t</span>
      </span>

      {/* "mint" - Electric Emerald Mint & Cyan Gradient */}
      <span
        style={{
          background: 'linear-gradient(135deg, #A7F3D0 0%, #34D399 50%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-flex',
          alignItems: 'baseline',
          marginLeft: '1px',
        }}
      >
        <span style={{ fontSize: '0.94em' }}>m</span>
        <span style={{ fontSize: '1.22em', lineHeight: 0.8 }}>i</span>
        <span style={{ fontSize: '0.92em' }}>n</span>
        <span style={{ fontSize: '1.14em', lineHeight: 0.85 }}>t</span>
      </span>

      {/* Pulsing Emerald Mint Spark Node */}
      <motion.span
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.6, 1, 0.6],
          boxShadow: [
            '0 0 8px #34D399, 0 0 14px rgba(52, 211, 153, 0.5)',
            '0 0 14px #34D399, 0 0 24px rgba(52, 211, 153, 0.9)',
            '0 0 8px #34D399, 0 0 14px rgba(52, 211, 153, 0.5)',
          ],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: isMobile ? 5 : isLarge ? 8 : 6,
          height: isMobile ? 5 : isLarge ? 8 : 6,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #A7F3D0, #10B981)',
          marginLeft: 3,
          alignSelf: 'center',
          marginBottom: 2,
        }}
      />
    </motion.span>
  );
}
