'use client';

import React, { useEffect, useRef } from 'react';

export interface AmbientDustCanvasProps {
  /** Optional additional CSS classes for styling and positioning */
  className?: string;
  /** Number of floating dust motes (defaults to 36 for lightweight performance) */
  particleCount?: number;
  /** Hex color for dust motes (defaults to Solar Yellow #F7D84B) */
  particleColor?: string;
  /** Global speed multiplier (defaults to 0.75 for languid archival drift) */
  speedMultiplier?: number;
  /** Minimum radius of dust mote in CSS pixels (default: 0.75) */
  minRadius?: number;
  /** Maximum radius of dust mote in CSS pixels (default: 2.2) */
  maxRadius?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alphaPhase: number;
  alphaSpeed: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { r: 247, g: 216, b: 75 }; // Default #F7D84B
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function AmbientDustCanvas({
  className = '',
  particleCount = 36,
  particleColor = '#F7D84B',
  speedMultiplier = 0.75,
  minRadius = 0.75,
  maxRadius = 2.2,
}: AmbientDustCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const rgb = hexToRgb(particleColor);
    let animationFrameId: number | null = null;
    let isVisible = true;
    let prefersReducedMotion = false;

    // Check prefers-reduced-motion media query
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        drawFrame();
      } else {
        startAnimation();
      }
    };

    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', handleMotionChange);
    } else {
      motionQuery.addListener(handleMotionChange);
    }

    // Canvas dimensions & DPR handling
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const count = Math.max(1, particleCount);
      for (let i = 0; i < count; i++) {
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        particles.push({
          x: Math.random() * (width || 300),
          y: Math.random() * (height || 300),
          // Gentle drifting: mostly subtle horizontal drift with vertical buoyancy
          vx: (Math.random() - 0.45) * 0.4 * speedMultiplier,
          vy: (Math.random() - 0.5) * 0.35 * speedMultiplier,
          radius,
          baseAlpha: 0.15 + Math.random() * 0.45,
          alphaPhase: Math.random() * Math.PI * 2,
          alphaSpeed: 0.008 + Math.random() * 0.015,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Re-initialize or wrap out-of-bounds particles
      if (particles.length === 0) {
        initParticles();
      } else {
        particles.forEach((p) => {
          if (p.x > width) p.x = Math.random() * width;
          if (p.y > height) p.y = Math.random() * height;
        });
      }
    };

    const drawFrame = () => {
      if (!ctx || width === 0 || height === 0) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Animate alpha pulsation
        p.alphaPhase += p.alphaSpeed;
        const currentAlpha = Math.max(0.05, p.baseAlpha + Math.sin(p.alphaPhase) * 0.2);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentAlpha.toFixed(3)})`;
        ctx.fill();

        // Optional tiny golden glow halo for larger motes
        if (p.radius > 1.6) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(currentAlpha * 0.18).toFixed(3)})`;
          ctx.fill();
        }

        // Only update position if reduced motion is disabled
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          // Seamless edge wrapping with margin
          const margin = p.radius * 3;
          if (p.x < -margin) p.x = width + margin;
          if (p.x > width + margin) p.x = -margin;
          if (p.y < -margin) p.y = height + margin;
          if (p.y > height + margin) p.y = -margin;
        }
      }
    };

    const renderLoop = () => {
      if (!isVisible) return;
      drawFrame();
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    };

    const startAnimation = () => {
      if (animationFrameId === null && isVisible && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    };

    const stopAnimation = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    // Viewport IntersectionObserver to pause when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry?.isIntersecting ?? false;
        if (isVisible) {
          if (prefersReducedMotion) {
            drawFrame();
          } else {
            startAnimation();
          }
        } else {
          stopAnimation();
        }
      },
      { threshold: 0.05 }
    );

    resize();
    initParticles();
    observer.observe(canvas);

    if (prefersReducedMotion) {
      drawFrame();
    } else {
      startAnimation();
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) {
        drawFrame();
      }
    });
    resizeObserver.observe(canvas);

    return () => {
      stopAnimation();
      observer.disconnect();
      resizeObserver.disconnect();
      if (typeof motionQuery.removeEventListener === 'function') {
        motionQuery.removeEventListener('change', handleMotionChange);
      } else {
        motionQuery.removeListener(handleMotionChange);
      }
    };
  }, [particleCount, particleColor, speedMultiplier, minRadius, maxRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}

export default AmbientDustCanvas;
