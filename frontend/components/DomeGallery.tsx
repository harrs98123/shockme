"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Image from "next/image";

interface DomeImage {
  src: string;
  alt: string;
}

interface DomeGalleryProps {
  images: DomeImage[];
  fit?: number;
  segments?: number;
  grayscale?: boolean;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  openedImageWidth?: string;
  openedImageHeight?: string;
  overlayBlurColor?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

export default function DomeGallery({
  images,
  fit = 0.6,
  segments = 35,
  grayscale = false,
  imageBorderRadius = "12px",
  openedImageBorderRadius = "16px",
  openedImageWidth = "500px",
  openedImageHeight = "750px",
  overlayBlurColor = "#060010",
  autoRotate = true,
  autoRotateSpeed = 0.15,
}: DomeGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(null);

  // Animation loop for auto-rotation
  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current !== null && autoRotate && !isHovering && selectedIndex === null) {
        const deltaTime = time - lastTimeRef.current;
        setRotation((prev) => prev - autoRotateSpeed * (deltaTime / 16));
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [autoRotate, autoRotateSpeed, isHovering, selectedIndex]);

  const radius = 1000 * fit;
  const angleStep = 360 / segments;
  
  // Use a subset of images or repeat them to fill segments
  const galleryImages = Array.from({ length: segments }, (_, i) => images[i % images.length]);

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-zinc-950"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div 
        className="relative w-full h-full pt-[20vh]"
        style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          animate={{ rotateY: rotation }}
          transition={{ type: "tween", ease: "linear", duration: 0 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {galleryImages.map((img, i) => {
            const angle = i * angleStep;
            return (
              <motion.div
                key={i}
                className="absolute flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-500"
                style={{
                  width: "180px",
                  height: "270px",
                  borderRadius: imageBorderRadius,
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: "hidden",
                  filter: grayscale ? "grayscale(100%)" : "none",
                }}
                whileHover={{ 
                  scale: 1.1, 
                  filter: "grayscale(0%)",
                  boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)" 
                }}
                onClick={() => setSelectedIndex(i)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="200px"
                  className="object-cover"
                  priority={i < 10}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white text-[10px] font-bold tracking-widest uppercase truncate">{img.alt}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Selected Image Overlay */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ backgroundColor: `${overlayBlurColor}dd`, backdropFilter: "blur(12px)" }}
            onClick={() => setSelectedIndex(null)}
          >
            <motion.div
              layoutId={`image-${selectedIndex}`}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="relative shadow-2xl overflow-hidden"
              style={{ 
                width: openedImageWidth, 
                height: openedImageHeight, 
                borderRadius: openedImageBorderRadius,
                border: "1px solid rgba(255,255,255,0.1)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={galleryImages[selectedIndex].src}
                alt={galleryImages[selectedIndex].alt}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                <h2 className="text-3xl font-black text-white mb-2">{galleryImages[selectedIndex].alt}</h2>
                <div className="flex gap-4">
                  <button 
                    className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors"
                    onClick={() => setSelectedIndex(null)}
                  >
                    View Details
                  </button>
                  <button 
                    className="bg-zinc-800/80 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-zinc-700 transition-colors border border-white/10"
                    onClick={() => setSelectedIndex(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
              
              <button
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors border border-white/10"
                onClick={() => setSelectedIndex(null)}
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint for interaction */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none opacity-40">
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-white" />
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">Scroll or Drag to Explore</span>
      </div>
    </div>
  );
}
