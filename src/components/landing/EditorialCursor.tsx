'use client';

import React, { useEffect, useRef, useState } from 'react';
import { isReducedMotion } from '@/lib/motion';

/**
 * Custom magnetic archival reticle cursor for fine-pointer desktop devices.
 * Purely decorative overlay (`pointer-events: none`); never obscures interactions.
 */
export function EditorialCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const labelRef = useRef<string | null>(null);
  const activeRef = useRef(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isReducedMotion()) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!finePointer.matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId = 0;

    const handleMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }

      const target = e.target as HTMLElement | null;
      if (target) {
        const labeledEl = target.closest<HTMLElement>('[data-cursor]');
        const interactiveEl = target.closest('a, button, [role="button"]');
        const nextLabel = labeledEl?.dataset.cursor || null;
        const nextActive = Boolean(nextLabel || interactiveEl);

        if (nextLabel !== labelRef.current) {
          labelRef.current = nextLabel;
          setCursorLabel(nextLabel);
        }
        if (nextActive !== activeRef.current) {
          activeRef.current = nextActive;
          setIsActive(nextActive);
        }
      }
    };

    const handleLeave = () => {
      if (visibleRef.current) {
        visibleRef.current = false;
        setVisible(false);
      }
    };

    const animate = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  if (!visible) return null;

  return (
    <div aria-hidden="true" className="hidden lg:block pointer-events-none fixed inset-0 z-50">
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full border transition-[width,height,background-color,border-color] duration-200 flex items-center justify-center ${
          cursorLabel
            ? 'w-16 h-16 bg-[#FF684D]/15 border-[#FF684D]'
            : isActive
              ? 'w-11 h-11 bg-[#FF684D]/10 border-[#FF684D]/70'
              : 'w-8 h-8 border-[#191A2B]/30 dark:border-[#F7F3EC]/35'
        }`}
      >
        {cursorLabel && (
          <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-[#FF684D]">
            {cursorLabel}
          </span>
        )}
      </div>

      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full transition-[width,height,background-color] duration-150 ${
          cursorLabel
            ? 'w-1 h-1 bg-[#FF684D] opacity-0'
            : isActive
              ? 'w-2 h-2 bg-[#FF684D]'
              : 'w-1.5 h-1.5 bg-[#191A2B] dark:bg-[#F7F3EC]'
        }`}
      />
    </div>
  );
}

export default EditorialCursor;

