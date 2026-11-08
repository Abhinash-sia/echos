'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SceneRenderer, ScenePointer } from './types';
import { SphereIcon } from '../icons/Icons';

export interface WebGLCanvasProps {
  sceneRenderer: SceneRenderer;
  className?: string;
  fallbackTitle?: string;
  forceFallback?: boolean;
}

export function WebGLCanvas({
  sceneRenderer,
  className = '',
  fallbackTitle = 'Memory Artifact (Static Preview)',
  forceFallback = false,
}: WebGLCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(true);

  const pointerRef = useRef<ScenePointer>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    if (forceFallback) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Feature detection & WebGL context acquisition
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      gl =
        canvas.getContext('webgl2', {
          alpha: true,
          antialias: true,
          powerPreference: 'default',
        }) ||
        canvas.getContext('webgl', {
          alpha: true,
          antialias: true,
          powerPreference: 'default',
        });
    } catch {
      gl = null;
    }

    if (!gl) {
      queueMicrotask(() => setHasWebGL(false));
      return;
    }

    // 2. Initialize 3D scene
    try {
      sceneRenderer.init(gl, canvas);
    } catch (err) {
      console.warn('[WebGL Canvas] Scene initialization fallback:', err);
      queueMicrotask(() => setHasWebGL(false));
      return;
    }

    // 3. Reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    sceneRenderer.setReducedMotion(motionQuery.matches);

    function handleMotionChange(e: MediaQueryListEvent) {
      sceneRenderer.setReducedMotion(e.matches);
    }
    motionQuery.addEventListener('change', handleMotionChange);

    // 4. Resize handling with DPR clamping
    function handleResize() {
      if (!canvas || !gl) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(rect.width * dpr);
      const height = Math.floor(rect.height * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        sceneRenderer.resize(width, height, dpr);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    // 5. IntersectionObserver to pause rendering when offscreen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsIntersecting(entry.isIntersecting);
        });
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // 6. Pointer interaction with gentle damping
    function handlePointerMove(e: MouseEvent | TouchEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

      pointerRef.current.targetX = Math.max(-1, Math.min(1, x));
      pointerRef.current.targetY = Math.max(-1, Math.min(1, y));
    }

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // 7. RequestAnimationFrame loop
    let animationFrameId: number;
    const startTime = performance.now();

    function renderLoop(now: number) {
      if (isIntersecting) {
        // Damping interpolation
        pointerRef.current.x += (pointerRef.current.targetX - pointerRef.current.x) * 0.06;
        pointerRef.current.y += (pointerRef.current.targetY - pointerRef.current.y) * 0.06;

        const elapsedSeconds = (now - startTime) / 1000;
        sceneRenderer.render(elapsedSeconds, pointerRef.current);
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    }

    animationFrameId = requestAnimationFrame(renderLoop);

    // Context loss & restoration handling
    function handleContextLost(e: Event) {
      e.preventDefault();
      queueMicrotask(() => setHasWebGL(false));
    }

    function handleContextRestored() {
      if (!canvas) return;
      const restoredGl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (restoredGl) {
        try {
          sceneRenderer.init(restoredGl, canvas);
          queueMicrotask(() => setHasWebGL(true));
        } catch {
          queueMicrotask(() => setHasWebGL(false));
        }
      }
    }

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      motionQuery.removeEventListener('change', handleMotionChange);
      observer.disconnect();
      sceneRenderer.destroy();
    };
  }, [sceneRenderer, isIntersecting, forceFallback]);

  if (!hasWebGL || forceFallback) {
    return (
      <div
        ref={containerRef}
        className={`relative flex flex-col items-center justify-center p-8 bg-paper-warm border border-border-subtle rounded-sm text-center ${className}`}
      >
        <div className="w-16 h-16 rounded-full bg-paper-elevated border border-terracotta/30 flex items-center justify-center text-terracotta mb-4 shadow-paper">
          <SphereIcon size={32} />
        </div>
        <h4 className="font-serif text-lg font-normal text-ink mb-1">{fallbackTitle}</h4>
        <p className="font-sans text-xs text-ink-muted max-w-xs leading-relaxed">
          Ethereal 3D graphics are inactive or unsupported on this device. Showing timeless static
          archival monument.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-sm select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
      />
    </div>
  );
}
