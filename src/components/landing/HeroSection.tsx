'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { AmbientDustCanvas } from '@/components/canvas/AmbientDustCanvas';
import { HeroRippleCanvas } from '@/components/landing/HeroRippleCanvas';
import { Button } from '@/components/ui/Button';
import { SunDisk } from '@/components/ui/SunDisk';
import { ArrowRightIcon, BookOpenIcon } from '@/components/icons/Icons';
import { gsap, isReducedMotion } from '@/lib/motion';

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgDesktopRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isReducedMotion()) {
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Opening Entrance Timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        bgDesktopRef.current,
        { opacity: 0, scale: 1.04 },
        { opacity: 1, scale: 1.0, duration: 1.1, ease: 'power2.out' }
      )
        .fromTo(
          kickerRef.current,
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.8'
        )
        .fromTo(
          headlineRef.current,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.9 },
          '-=0.5'
        )
        .fromTo(
          subtextRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.6'
        )
        .fromTo(
          ctaGroupRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.5'
        );

      // 2. Lightweight Mouse-Responsive Parallax on Desktop
      const sunXTo = sunRef.current
        ? gsap.quickTo(sunRef.current, 'x', { duration: 0.9, ease: 'power2.out' })
        : null;
      const sunYTo = sunRef.current
        ? gsap.quickTo(sunRef.current, 'y', { duration: 0.9, ease: 'power2.out' })
        : null;

      const handleMouseMove = (e: MouseEvent) => {
        if (window.innerWidth < 1024) return;
        const normX = e.clientX / window.innerWidth - 0.5;
        const normY = e.clientY / window.innerHeight - 0.5;
        sunXTo?.(normX * 18);
        sunYTo?.(normY * 18);
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      // 3. Scroll Exit Parallax
      const exitTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        },
      });

      exitTl
        .to(sectionRef.current, { scale: 0.96, opacity: 0.35, ease: 'none' }, 0)
        .to(bgDesktopRef.current, { yPercent: 14, scale: 1.06, ease: 'none' }, 0)
        .to(headlineRef.current, { yPercent: -24, opacity: 0.12, ease: 'none' }, 0)
        .to(subtextRef.current, { yPercent: -16, opacity: 0.16, ease: 'none' }, 0)
        .to(ctaGroupRef.current, { yPercent: -10, opacity: 0.18, ease: 'none' }, 0)
        .to(sunRef.current, { scale: 1.25, opacity: 0.04, ease: 'none' }, 0);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative lg:sticky lg:top-0 z-0 min-h-[90vh] lg:min-h-[94vh] flex items-center overflow-hidden bg-[#EDE5D0] dark:bg-[#12100D] text-[#191A2B] dark:text-[#F7F3EC] border-b border-[#191A2B]/10 dark:border-amber-200/10 transition-colors duration-300 will-change-transform"
    >
      {/* 1. Interactive WebGL Water/Halftone Ripple World + Static Fallback */}
      <div
        ref={bgDesktopRef}
        className="absolute inset-0 pointer-events-none -z-0 will-change-transform"
      >
        <Image
          src="/images/hero/hero_celestial_sanctuary.webp"
          alt="Archival writing sanctuary with raking morning sunlight across wooden desk"
          fill
          priority
          sizes="100vw"
          className="hidden sm:block object-cover object-center scale-105"
        />
        <Image
          src="/images/hero/hero_celestial_sanctuary_mobile.webp"
          alt="Archival sanctuary vertical window shadow and journal desk"
          fill
          priority
          sizes="(max-width: 639px) 100vw, 1px"
          className="block sm:hidden object-cover object-top"
        />

        {/* Real-time WebGL Water & Halftone Ripple Layer */}
        <HeroRippleCanvas />

        {/* Dual-Theme Atmospheric Vignettes */}
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#EDE5D0]/95 via-[#EDE5D0]/68 to-transparent dark:from-[#12100D]/95 dark:via-[#12100D]/76 dark:to-[#12100D]/30 transition-colors duration-300" />
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-[#EDE5D0] via-transparent to-[#E3D5BB]/45 dark:from-[#12100D] dark:via-transparent dark:to-[#171410]/55 transition-colors duration-300" />
        <div className="block sm:hidden absolute inset-0 bg-gradient-to-b from-[#EDE5D0]/92 via-[#EDE5D0]/68 to-[#EDE5D0] dark:from-[#12100D]/92 dark:via-[#12100D]/72 dark:to-[#12100D] transition-colors duration-300" />

        {/* Radial vignette for aged-photo depth */}
        <div className="vignette absolute inset-0 pointer-events-none" />
      </div>

      {/* Stationary bottom seam blend into Manifesto */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#EDE5D0] to-transparent dark:from-[#12100D] pointer-events-none z-[4]"
        aria-hidden="true"
      />

      {/* 2. Halftone Print Texture, Ambient Dust & Celestial Sun Disk */}
      <div
        className="halftone-overlay absolute inset-0 opacity-55 pointer-events-none z-5"
        aria-hidden="true"
      />
      <AmbientDustCanvas particleCount={24} particleColor="#FFB93F" className="z-10 opacity-70" />

      <div
        ref={sunRef}
        className="absolute -top-12 -right-12 sm:top-14 sm:right-[12%] pointer-events-none z-0 opacity-45 dark:opacity-50 will-change-transform"
        aria-hidden="true"
      >
        <SunDisk size="poster" glow={true} />
      </div>

      {/* 3. Sweeping Editorial Narrative Stage */}
      <Container size="wide" className="relative z-20 py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl">
          {/* Subtle Literary Kicker */}
          <div
            ref={kickerRef}
            className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[#FF684D] font-bold mb-6 sm:mb-8"
          >
            <span>残響 · THE DIGITAL MEMORY VAULT</span>
            <span className="h-px w-8 bg-[#FF684D]/40" />
            <span className="text-[#767C9D] dark:text-[#C8BCAA] font-normal hidden sm:inline">
              PERSONAL TIME CAPSULE
            </span>
          </div>

          {/* Monumental Headline */}
          <h1
            ref={headlineRef}
            className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] tracking-tight text-[#191A2B] dark:text-[#F7F3EC] leading-[1.08] mb-6 sm:mb-8 will-change-transform"
          >
            The Sanctuary for Things{' '}
            <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#C0392B] via-[#C47A0D] to-[#B8922A] dark:from-[#FF7A5C] dark:via-[#FFB93F] dark:to-[#F7DF74]">
              Time Must Not Steal.
            </span>
          </h1>

          {/* Editorial Narrative Subtext */}
          <p
            ref={subtextRef}
            className="font-sans text-base sm:text-xl text-[#484C69] dark:text-[#C8BCAA] leading-relaxed max-w-2xl mb-10 sm:mb-12 font-light will-change-transform"
          >
            An unhurried space for personal memories, 35mm photography, and sealed letters to your
            future self. Protected from social algorithms and locked until the celestial date
            arrives.
          </p>

          {/* Obvious, Prominent CTAs */}
          <div
            ref={ctaGroupRef}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 will-change-transform"
          >
            <Link href="/register" className="inline-block group">
              <Button
                variant="coral"
                size="lg"
                icon={<ArrowRightIcon size={18} />}
                className="w-full sm:w-auto text-base shadow-[0_12px_28px_rgba(255,104,77,0.3)] hover:shadow-[0_16px_36px_rgba(255,104,77,0.45)] transition-all group-hover:-translate-y-0.5"
              >
                Begin Your Archive
              </Button>
            </Link>

            <a href="#manifesto" className="inline-block">
              <Button
                variant="secondary"
                size="lg"
                icon={<BookOpenIcon size={18} />}
                className="w-full sm:w-auto text-base border-[#191A2B]/20 dark:border-white/20 text-[#191A2B] dark:text-[#F7F3EC] hover:bg-[#191A2B]/5 dark:hover:bg-white/10 transition-colors"
              >
                Explore the Experience
              </Button>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default HeroSection;
