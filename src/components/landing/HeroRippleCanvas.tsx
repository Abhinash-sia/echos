'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HeroRippleScene } from '@/components/canvas/HeroRippleScene';
import { ScenePointer } from '@/components/canvas/types';

/**
 * Full-bleed interactive WebGL water/halftone ripple layer for the hero backdrop.
 * Spawns smooth concentric ripples on pointer glide, clicks, and scroll momentum.
 */
export function HeroRippleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(true);
  const scene = useMemo(() => new HeroRippleScene(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      gl =
        canvas.getContext('webgl2', {
          alpha: true,
          antialias: false,
          powerPreference: 'default',
        }) ||
        canvas.getContext('webgl', {
          alpha: true,
          antialias: false,
          powerPreference: 'default',
        });
    } catch {
      gl = null;
    }

    if (!gl) {
      queueMicrotask(() => setSupported(false));
      return;
    }

    try {
      scene.init(gl);
    } catch {
      queueMicrotask(() => setSupported(false));
      return;
    }

    const syncTextureForViewport = () => {
      const isMobile = window.innerWidth < 640;
      scene.loadImage(
        isMobile
          ? '/images/hero/hero_celestial_sanctuary_mobile.webp'
          : '/images/hero/hero_celestial_sanctuary.webp'
      );
    };
    syncTextureForViewport();

    const syncTheme = () => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark';
      scene.setTheme(isDark);
    };
    syncTheme();

    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    scene.setReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => scene.setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.02 }
    );
    visibilityObserver.observe(canvas);

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(2, Math.floor(rect.width * dpr));
      const height = Math.max(2, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        scene.resize(width, height);
      }
      syncTextureForViewport();
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const pointer: ScenePointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let lastSpawnTime = 0;
    let lastPointerX = 0.5;
    let lastPointerY = 0.5;

    const handlePointerMove = (e: PointerEvent) => {
      if (!isVisible) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const u = (e.clientX - rect.left) / rect.width;
      const v = (e.clientY - rect.top) / rect.height;
      if (u < 0 || u > 1 || v < 0 || v > 1) return;

      pointer.targetX = u * 2 - 1;
      pointer.targetY = -(v * 2 - 1);

      const now = performance.now();
      const moveDist = Math.hypot(u - lastPointerX, v - lastPointerY);
      if (now - lastSpawnTime > 85 && moveDist > 0.025) {
        scene.spawnRipple(u, v, Math.min(1.0, 0.45 + moveDist * 3.5));
        lastSpawnTime = now;
        lastPointerX = u;
        lastPointerY = v;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!isVisible) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const u = (e.clientX - rect.left) / rect.width;
      const v = (e.clientY - rect.top) / rect.height;
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        scene.spawnRipple(u, v, 1.35);
      }
    };

    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    const handleScroll = () => {
      const now = performance.now();
      const dt = Math.max(8, now - lastScrollTime);
      const currentY = window.scrollY;
      const velocity = ((currentY - lastScrollY) / dt) * 1.2;
      scene.setScrollVelocity(velocity);
      lastScrollY = currentY;
      lastScrollTime = now;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    let rafId = 0;
    const startTime = performance.now();
    const renderLoop = (now: number) => {
      if (isVisible) {
        pointer.x += (pointer.targetX - pointer.x) * 0.08;
        pointer.y += (pointer.targetY - pointer.y) * 0.08;
        scene.render((now - startTime) / 1000, pointer);
      }
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      motionQuery.removeEventListener('change', handleMotionChange);
      visibilityObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll);
      scene.destroy();
    };
  }, [scene]);

  if (!supported) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none block"
    />
  );
}

export default HeroRippleCanvas;

