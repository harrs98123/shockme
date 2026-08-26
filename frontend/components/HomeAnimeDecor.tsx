'use client';

import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

export default function HomeAnimeDecor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Ambient Floating Glowing Orbs (Deep Cinematic Gradients)
    if (orb1Ref.current) {
      animate(orb1Ref.current, {
        translateX: [
          { to: 50, duration: 6000, ease: 'inOutSine' },
          { to: -40, duration: 7000, ease: 'inOutQuad' },
          { to: 0, duration: 6000, ease: 'inOutSine' },
        ],
        translateY: [
          { to: -40, duration: 5500, ease: 'inOutSine' },
          { to: 30, duration: 6500, ease: 'inOutQuad' },
          { to: 0, duration: 5500, ease: 'inOutSine' },
        ],
        scale: [
          { to: 1.2, duration: 7000, ease: 'inOutSine' },
          { to: 0.85, duration: 6000, ease: 'inOutQuad' },
          { to: 1, duration: 6000, ease: 'inOutSine' },
        ],
        opacity: [
          { to: 0.22, duration: 5000, ease: 'inOutSine' },
          { to: 0.1, duration: 5000, ease: 'inOutSine' },
          { to: 0.18, duration: 5000, ease: 'inOutSine' },
        ],
        loop: true,
      });
    }

    if (orb2Ref.current) {
      animate(orb2Ref.current, {
        translateX: [
          { to: -60, duration: 8000, ease: 'inOutSine' },
          { to: 40, duration: 7000, ease: 'inOutQuad' },
          { to: 0, duration: 8000, ease: 'inOutSine' },
        ],
        translateY: [
          { to: 50, duration: 7000, ease: 'inOutSine' },
          { to: -30, duration: 6000, ease: 'inOutQuad' },
          { to: 0, duration: 7000, ease: 'inOutSine' },
        ],
        scale: [
          { to: 0.8, duration: 6500, ease: 'inOutSine' },
          { to: 1.25, duration: 7500, ease: 'inOutQuad' },
          { to: 1, duration: 6500, ease: 'inOutSine' },
        ],
        opacity: [
          { to: 0.16, duration: 6000, ease: 'inOutSine' },
          { to: 0.07, duration: 6000, ease: 'inOutSine' },
          { to: 0.13, duration: 6000, ease: 'inOutSine' },
        ],
        loop: true,
      });
    }

    if (orb3Ref.current) {
      animate(orb3Ref.current, {
        translateY: [
          { to: -50, duration: 7500, ease: 'inOutSine' },
          { to: 40, duration: 6500, ease: 'inOutQuad' },
          { to: 0, duration: 7500, ease: 'inOutSine' },
        ],
        opacity: [
          { to: 0.16, duration: 5000, ease: 'inOutSine' },
          { to: 0.06, duration: 5000, ease: 'inOutSine' },
          { to: 0.13, duration: 5000, ease: 'inOutSine' },
        ],
        loop: true,
      });
    }

    // 2. Floating Micro-Bokeh Cinematic Particles
    if (particlesRef.current) {
      const particleEls = particlesRef.current.querySelectorAll('.bokeh-particle');
      particleEls.forEach((p, idx) => {
        const randomX = (idx % 2 === 0 ? 1 : -1) * (20 + (idx * 7) % 50);
        const randomY = -40 - ((idx * 13) % 80);
        const randomDur = 4000 + ((idx * 830) % 5000);

        animate(p, {
          translateY: [
            { to: randomY, duration: randomDur, ease: 'inOutSine' },
            { to: 0, duration: randomDur, ease: 'inOutSine' },
          ],
          translateX: [
            { to: randomX, duration: randomDur * 1.2, ease: 'inOutSine' },
            { to: 0, duration: randomDur * 1.2, ease: 'inOutSine' },
          ],
          opacity: [
            { to: 0.6, duration: randomDur * 0.5, ease: 'inOutSine' },
            { to: 0.1, duration: randomDur * 0.5, ease: 'inOutSine' },
          ],
          scale: [
            { to: 1.3, duration: randomDur, ease: 'inOutSine' },
            { to: 0.8, duration: randomDur, ease: 'inOutSine' },
          ],
          loop: true,
          delay: (idx * 280) % 2000,
        });
      });
    }

    // 3. Interactive Cursor Spotlight (Fluid Dampened Follow)
    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current) return;
      const x = e.clientX;
      const y = e.clientY;

      animate(spotlightRef.current, {
        translateX: x - 250,
        translateY: y - 250,
        duration: 800,
        ease: 'outQuad',
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 4. Intersection Observer: Staggered cinematic reveals on scroll
    const observedSections = document.querySelectorAll(
      '.home-stagger-section, .movie-row-container, .featured-collections-container, .trending-ranked-container'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target as HTMLElement;

            // Animate Section Header
            const header = section.querySelector('.row-header, .section-header, h2');
            if (header) {
              animate(header, {
                translateX: [-30, 0],
                opacity: [0, 1],
                duration: 700,
                ease: 'outCubic',
              });
            }

            // Animate Cards with dynamic stagger & soft scale pop
            const cards = section.querySelectorAll(
              '.movie-card-wrapper, .movie-card, .collection-card, .ranked-card-item'
            );
            if (cards.length > 0) {
              animate(cards, {
                translateY: [40, 0],
                opacity: [0, 1],
                scale: [0.93, 1],
                delay: stagger(50, { start: 80 }),
                duration: 800,
                ease: 'outQuart',
              });
            }

            // Animate Large Rank Numbers in Top 10 with elastic bounce
            const ranks = section.querySelectorAll('.rank-number-text, .ranked-number-badge');
            if (ranks.length > 0) {
              animate(ranks, {
                scale: [0.2, 1],
                opacity: [0, 1],
                rotateZ: [-12, 0],
                delay: stagger(60, { start: 140 }),
                duration: 950,
                ease: 'outElastic(1, .6)',
              });
            }

            observer.unobserve(section);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
    );

    observedSections.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Interactive Cursor Spotlight */}
      <div
        ref={spotlightRef}
        className="hidden md:block absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none opacity-40 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(229, 9, 20, 0.12) 0%, rgba(139, 92, 246, 0.06) 40%, transparent 70%)',
          willChange: 'transform',
        }}
      />

      {/* Floating Micro Bokeh Particles */}
      <div ref={particlesRef} className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 16 }).map((_, i) => {
          const top = `${(i * 19) % 95}%`;
          const left = `${(i * 23 + 7) % 92}%`;
          const size = 3 + (i % 5) * 2;
          const isCrimson = i % 3 === 0;
          const isPurple = i % 3 === 1;

          return (
            <div
              key={i}
              className="bokeh-particle absolute rounded-full pointer-events-none"
              style={{
                top,
                left,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: isCrimson ? '#ff2b36' : isPurple ? '#a855f7' : '#38bdf8',
                boxShadow: isCrimson
                  ? '0 0 10px #ff2b36'
                  : isPurple
                  ? '0 0 10px #a855f7'
                  : '0 0 10px #38bdf8',
                opacity: 0.3,
                filter: 'blur(0.5px)',
              }}
            />
          );
        })}
      </div>

      {/* Ambient Crimson Glow - Top Left */}
      <div
        ref={orb1Ref}
        className="absolute -top-[15vw] -left-[10vw] w-[55vw] h-[55vw] rounded-full blur-[130px]"
        style={{
          background: 'radial-gradient(circle, rgba(229, 9, 20, 0.25) 0%, rgba(229, 9, 20, 0) 70%)',
          opacity: 0.18,
        }}
      />

      {/* Ambient Violet Glow - Mid Right */}
      <div
        ref={orb2Ref}
        className="absolute top-[40vh] -right-[15vw] w-[60vw] h-[60vw] rounded-full blur-[150px]"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0) 70%)',
          opacity: 0.14,
        }}
      />

      {/* Ambient Cyan/Emerald Glow - Lower Section */}
      <div
        ref={orb3Ref}
        className="absolute top-[90vh] -left-[12vw] w-[50vw] h-[50vw] rounded-full blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0) 70%)',
          opacity: 0.12,
        }}
      />
    </div>
  );
}
