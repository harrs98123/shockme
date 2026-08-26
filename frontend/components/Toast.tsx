'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Info as InfoIcon,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { toastManager, ToastItem, ToastType } from '@/lib/toast';

interface TypeConfig {
  barBg: string;
  renderIcon: () => React.ReactNode;
}

const TYPE_CONFIG: Record<ToastType, TypeConfig> = {
  success: {
    barBg: '#3db311', // Solid vibrant green
    renderIcon: () => (
      <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
        <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center">
          <Check size={11} strokeWidth={3.5} className="text-[#3db311]" />
        </div>
      </div>
    ),
  },
  info: {
    barBg: '#2d79f3', // Solid vibrant blue
    renderIcon: () => (
      <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
        <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center">
          <span className="text-[#2d79f3] text-[11px] font-black leading-none select-none">i</span>
        </div>
      </div>
    ),
  },
  warning: {
    barBg: '#e88800', // Solid vibrant orange/amber
    renderIcon: () => (
      <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
        <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center">
          <AlertTriangle size={11} strokeWidth={3} className="text-[#e88800] fill-[#e88800]" />
        </div>
      </div>
    ),
  },
  error: {
    barBg: '#d71919', // Solid vibrant red
    renderIcon: () => (
      <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
        <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center">
          <span className="text-[#d71919] text-[11px] font-black leading-none select-none">!</span>
        </div>
      </div>
    ),
  },
  loading: {
    barBg: '#E50914', // Brand red
    renderIcon: () => (
      <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
        <Loader2 size={14} strokeWidth={2.6} className="text-white animate-spin" />
      </div>
    ),
  },
  default: {
    barBg: '#2d79f3',
    renderIcon: () => (
      <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
        <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center">
          <InfoIcon size={11} strokeWidth={3} className="text-[#2d79f3]" />
        </div>
      </div>
    ),
  },
};

function ToastCard({ item }: { item: ToastItem }) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = item.duration ?? 3500;
  const isInfinite = duration <= 0 || item.type === 'loading';

  const config = (item.type && TYPE_CONFIG[item.type]) || TYPE_CONFIG.default;

  const hasDescription = Boolean(item.description);

  useEffect(() => {
    if (isInfinite) return;

    const intervalTime = 40;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isHovered) {
        setProgress((prev) => {
          if (prev <= step) {
            clearInterval(timer);
            toastManager.dismiss(item.id);
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, isHovered, isInfinite, item.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, y: -6, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', damping: 28, stiffness: 380 }}
      drag="x"
      dragConstraints={{ left: 0, right: 80 }}
      dragSnapToOrigin={false}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 40 || info.velocity.x > 200) {
          toastManager.dismiss(item.id);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative pointer-events-auto w-full max-w-[360px] sm:max-w-[380px] rounded-[4px] overflow-hidden select-none"
      style={{
        backgroundColor: config.barBg,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3">
        {/* Left Circular Badge Icon */}
        {item.icon ? (
          <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0 text-white">
            {item.icon}
          </div>
        ) : (
          config.renderIcon()
        )}

        {/* Content text */}
        <div className="flex-1 min-w-0 pr-1">
          {hasDescription ? (
            <>
              {item.title && (
                <h4 className="text-[13px] font-bold text-white leading-tight">
                  {item.title}
                </h4>
              )}
              <p className="text-[12px] font-medium text-white/90 leading-tight mt-0.5 break-words">
                {item.description}
              </p>
            </>
          ) : (
            <p className="text-[13.5px] font-medium text-white leading-snug break-words">
              {item.title}
            </p>
          )}

          {/* Optional Action Buttons */}
          {(item.action || item.cancel) && (
            <div className="flex items-center gap-2 mt-2">
              {item.action && (
                <button
                  type="button"
                  onClick={(e) => {
                    item.action?.onClick(e);
                    toastManager.dismiss(item.id);
                  }}
                  className="px-2.5 py-0.5 rounded-[2px] bg-white text-black font-semibold text-[11px] hover:bg-white/90 transition-colors shadow-sm"
                >
                  {item.action.label}
                </button>
              )}
              {item.cancel && (
                <button
                  type="button"
                  onClick={() => {
                    item.cancel?.onClick?.();
                    toastManager.dismiss(item.id);
                  }}
                  className="px-2 py-0.5 rounded-[2px] text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {item.cancel.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss 'X' Button on Right */}
        <button
          type="button"
          onClick={() => toastManager.dismiss(item.id)}
          aria-label="Close notification"
          className="shrink-0 p-1 rounded-[2px] text-white/80 hover:text-white hover:bg-white/15 transition-colors"
        >
          <X size={15} strokeWidth={2.2} />
        </button>
      </div>

      {/* Auto-Dismiss Progress Line */}
      {!isInfinite && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/15 overflow-hidden">
          <div
            className="h-full transition-all duration-75 ease-linear bg-white/40"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function ToastContainer() {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = toastManager.subscribe((items) => {
      setToasts(items);
    });
    return unsubscribe;
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed z-[99999] pointer-events-none flex flex-col gap-2.5 p-3 sm:p-5 top-0 sm:top-3 right-0 sm:right-3 left-0 sm:left-auto items-center sm:items-end w-full sm:w-auto"
      style={{
        maxWidth: '100vw',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
