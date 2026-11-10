'use client';

import React, { useEffect, useRef } from 'react';
import { isReducedMotion } from '@/lib/motion';

export interface NeumorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tilt?: boolean;
  spotlight?: boolean;
  pressed?: boolean;
}

/**
 * Tactile warm-parchment neumorphic card with optional pointer-tracked spotlight
 * and subtle 3D perspective tilt. All content remains visible and keyboard accessible.
 */
export function NeumorphicCard({
  children,
  tilt = false,
  spotlight = true,
  pressed = false,
  className = '',
  ...props
}: NeumorphicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || (!spotlight && !tilt)) return;

    let rect = el.getBoundingClientRect();
    const resizeObserver = new ResizeObserver(() => {
      rect = el.getBoundingClientRect();
    });
    resizeObserver.observe(el);

    const reduced = isReducedMotion();

    const handlePointerMove = (e: PointerEvent) => {
      if (rect.width === 0 || rect.height === 0) {
        rect = el.getBoundingClientRect();
      }
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mouse-x', `${xPct}%`);
      el.style.setProperty('--mouse-y', `${yPct}%`);

      if (tilt && !reduced && window.innerWidth >= 1024) {
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(1000px) rotateX(${(-ny * 4).toFixed(2)}deg) rotateY(${(nx * 4).toFixed(2)}deg) translateY(-2px)`;
      }
    };

    const handlePointerLeave = () => {
      if (tilt && !reduced) {
        el.style.transform = '';
      }
    };

    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [spotlight, tilt]);

  return (
    <div
      ref={cardRef}
      className={`relative ${pressed ? 'neu-well' : 'neu-card'} ${
        spotlight ? 'neu-spotlight' : ''
      } transition-[transform,box-shadow,border-color] duration-300 ease-out ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default NeumorphicCard;

