'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export interface SealingAnimationModalProps {
  isOpen: boolean;
  title: string;
  unlockDate: string | Date;
  onComplete: () => void;
}

export function SealingAnimationModal({
  isOpen,
  title,
  unlockDate,
  onComplete,
}: SealingAnimationModalProps) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    // Reduced motion: accelerate and complete quickly without disorienting movement
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const timer1 = setTimeout(() => setPhase(2), 50);
      const timer2 = setTimeout(() => {
        setPhase(3);
        onComplete();
      }, 500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        document.body.style.overflow = 'unset';
      };
    }

    // Phase 0: Envelope folding (0 - 700ms)
    // Phase 1: Wax pouring & stamp pressing (700ms - 1700ms)
    // Phase 2: Golden seal solidified & locked (1700ms - 2800ms)
    // Phase 3: Transition to detail view (2800ms+)
    const timer1 = setTimeout(() => setPhase(1), 700);
    const timer2 = setTimeout(() => setPhase(2), 1700);
    const timer3 = setTimeout(() => {
      setPhase(3);
      onComplete();
    }, 2800);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        setPhase(3);
        onComplete();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const formattedDate = new Date(unlockDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Capsule Sealing Ceremony"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[var(--surface-color)] border-2 border-black/10 dark:border-white/10 p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Ambient atmospheric glow */}
        <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-[var(--electric-coral)]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 rounded-full bg-[var(--cobalt-blue)]/20 blur-3xl pointer-events-none" />

        {/* Tactile Letter & Wax Stamp Ceremony */}
        <div className="relative w-44 h-44 my-4 flex items-center justify-center">
          {/* Folded Parchment Envelope */}
          <div
            className={`w-36 h-28 rounded-xl border-2 border-black/15 dark:border-white/15 bg-[var(--warm-cream)] dark:bg-[var(--midnight)] shadow-xl transition-all duration-700 flex items-center justify-center relative overflow-hidden ${
              phase >= 1 ? 'scale-95 shadow-2xl rotate-[-1deg]' : 'scale-100 rotate-0'
            }`}
          >
            {/* Envelope flap lines */}
            <div className="absolute top-0 inset-x-0 h-14 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 clip-path-triangle pointer-events-none" />
            <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--ink-muted)] z-10 truncate max-w-[120px] px-2 text-center">
              {title}
            </div>
          </div>

          {/* Wax Seal Stamp Impact */}
          <div
            className={`absolute transition-all duration-500 ease-out z-20 ${
              phase === 0
                ? 'opacity-0 scale-150 -translate-y-8'
                : phase === 1
                  ? 'opacity-100 scale-110 translate-y-0 rotate-12'
                  : 'opacity-100 scale-100 translate-y-0 rotate-[-4deg]'
            }`}
          >
            <div className="relative">
              <Image
                src="/images/cutouts/cutout_wax_seal.webp"
                alt="Temporal Wax Seal"
                width={84}
                height={84}
                className="drop-shadow-[0_8px_20px_rgba(255,104,77,0.4)]"
              />
              {phase >= 2 && (
                <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping pointer-events-none" />
              )}
            </div>
          </div>
        </div>

        {/* Ceremony Stage Texts */}
        <div className="space-y-2 mt-2 max-w-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] font-bold">
            <span className="w-2 h-2 rounded-full bg-[var(--electric-coral)] animate-pulse" />
            {phase === 0 && 'Folding Letter...'}
            {phase === 1 && 'Applying Archival Wax Seal...'}
            {phase >= 2 && 'Sealed in Time'}
          </div>

          <h3 className="font-editorial text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {phase >= 2 ? 'Capsule Successfully Sealed' : 'Preserving Reflection'}
          </h3>

          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            {phase >= 2
              ? `Your words are secured and locked until ${formattedDate}.`
              : 'Committing your words to server-enforced temporal storage...'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-6">
          <div
            className="h-full bg-[var(--electric-coral)] transition-all duration-700 ease-out"
            style={{ width: phase === 0 ? '33%' : phase === 1 ? '66%' : '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
