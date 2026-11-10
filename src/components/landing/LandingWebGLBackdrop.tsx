'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LandingAtmosphereScene } from '@/components/canvas/LandingAtmosphereScene';
import { ScenePointer } from '@/components/canvas/types';

/**
 * Full-viewport fixed WebGL shader layer for the landing page.
 * Reacts smoothly to pointer coordinates, scroll progress, and scroll velocity.
 */
export function LandingWebGLBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(true);
  const scene = useMemo(() => new LandingAtmosphereScene(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      gl =
        canvas.getContext('webgl2', {
          alpha: true,
          antialias: true,
          powerPreference: 'low-power',
        }) ||
        canvas.getContext('webgl', {
          alpha: true,
          antialias: true,
          powerPreference: 'low-power',
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

    const handleResize = () => {
      // Soft atmospheric shaders upscale seamlessly from a capped half-res buffer (~10x faster GPU fill)
      const scale = 0.5;
      const width = Math.min(960, Math.max(320, Math.floor(window.innerWidth * scale)));
      const height = Math.min(540, Math.max(240, Math.floor(window.innerHeight * scale)));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        scene.resize(width, height);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const pointer: ScenePointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pointer.targetX = Math.max(-1, Math.min(1, (e.clientX / w) * 2 - 1));
      pointer.targetY = Math.max(-1, Math.min(1, -((e.clientY / h) * 2 - 1)));
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    const handleScroll = () => {
      const now = performance.now();
      const dt = Math.max(8, now - lastScrollTime);
      const currentY = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, currentY / maxScroll));
      const velocity = ((currentY - lastScrollY) / dt) * 1.4;
      scene.setScrollState(progress, Math.max(-2.5, Math.min(2.5, velocity)));
      lastScrollY = currentY;
      lastScrollTime = now;
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    let rafId = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      pointer.x += (pointer.targetX - pointer.x) * 0.055;
      pointer.y += (pointer.targetY - pointer.y) * 0.055;
      scene.render((now - startTime) / 1000, pointer);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      scene.destroy();
    };
  }, [scene]);

  if (!supported) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-[25]"
    />
  );
}

export default LandingWebGLBackdrop;

