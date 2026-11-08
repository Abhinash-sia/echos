'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { AmbientDustCanvas } from '@/components/canvas/AmbientDustCanvas';
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
  const penRef = useRef<HTMLDivElement>(null);
  const hourglassRef = useRef<HTMLDivElement>(null);
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
        { opacity: 0, scale: 1.06 },
        { opacity: 1, scale: 1.01, duration: 1.4, ease: 'power2.out' }
      )
        .fromTo(
          kickerRef.current,
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.9'
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
        )
        .fromTo(
          penRef.current,
          { opacity: 0, x: 30, y: -20, rotate: -22 },
          { opacity: 1, x: 0, y: 0, rotate: -10, duration: 1.2, ease: 'back.out(1.2)' },
          '-=0.9'
        )
        .fromTo(
          hourglassRef.current,
          { opacity: 0, x: 25, y: 35, rotate: 12 },
          { opacity: 1, x: 0, y: 0, rotate: 4, duration: 1.3, ease: 'back.out(1.2)' },
          '-=1.1'
        );

      // 2. Mouse-Responsive Parallax on Desktop
      const handleMouseMove = (e: MouseEvent) => {
        if (window.innerWidth < 1024) return;
        const normX = e.clientX / window.innerWidth - 0.5;
        const normY = e.clientY / window.innerHeight - 0.5;

        gsap.to(penRef.current, {
          x: normX * 24,
          y: normY * 24,
          duration: 1.2,
          ease: 'power1.out',
          overwrite: 'auto',
        });

        gsap.to(hourglassRef.current, {
          x: -normX * 18,
          y: -normY * 18,
          duration: 1.4,
          ease: 'power1.out',
          overwrite: 'auto',
        });

        gsap.to(sunRef.current, {
          x: normX * 14,
          y: normY * 14,
          duration: 1.5,
          ease: 'power1.out',
          overwrite: 'auto',
        });
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
        .to(bgDesktopRef.current, { yPercent: 20, scale: 1.08, ease: 'none' }, 0)
        .to(headlineRef.current, { yPercent: -22, opacity: 0.1, ease: 'none' }, 0)
        .to(subtextRef.current, { yPercent: -15, opacity: 0.15, ease: 'none' }, 0)
        .to(penRef.current, { yPercent: -36, rotate: -24, opacity: 0.2, ease: 'none' }, 0)
        .to(hourglassRef.current, { yPercent: 28, rotate: 16, opacity: 0.2, ease: 'none' }, 0)
        .to(sunRef.current, { scale: 1.25, opacity: 0.05, ease: 'none' }, 0);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] lg:min-h-[94vh] flex items-center overflow-hidden bg-[#F7F3EC] dark:bg-[#0C0D15] text-[#191A2B] dark:text-[#F7F3EC] border-b border-[#191A2B]/10 dark:border-white/10 transition-colors duration-300"
    >
      {/* 1. Responsive Photographic World (Desktop & Mobile) */}
      <div
        ref={bgDesktopRef}
        className="absolute inset-0 hidden sm:block pointer-events-none -z-0 will-change-transform"
      >
        <Image
          src="/images/hero/hero_celestial_sanctuary.webp"
          alt="Archival writing sanctuary with raking morning sunlight across wooden desk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105"
        />
        {/* Dual-Theme Atmospheric Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F3EC]/95 via-[#F7F3EC]/75 to-transparent dark:from-[#0C0D15]/95 dark:via-[#0C0D15]/80 dark:to-[#0C0D15]/40 transition-colors duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F7F3EC] via-transparent to-[#F7F3EC]/40 dark:from-[#0C0D15] dark:via-transparent dark:to-[#0C0D15]/60 transition-colors duration-300" />
      </div>

      <div className="absolute inset-0 block sm:hidden pointer-events-none -z-0">
        <Image
          src="/images/hero/hero_celestial_sanctuary_mobile.webp"
          alt="Archival sanctuary vertical window shadow and journal desk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F3EC]/92 via-[#F7F3EC]/70 to-[#F7F3EC] dark:from-[#0C0D15]/92 dark:via-[#0C0D15]/75 dark:to-[#0C0D15] transition-colors duration-300" />
      </div>

      {/* 2. Ambient Particles & Celestial Sun Disk */}
      <AmbientDustCanvas particleCount={30} particleColor="#FFB93F" className="z-10 opacity-75" />

      <div
        ref={sunRef}
        className="absolute -top-12 -right-12 sm:top-16 sm:right-[18%] pointer-events-none z-0 opacity-40 dark:opacity-50 dark:mix-blend-screen animate-pulse-glow will-change-transform"
        aria-hidden="true"
      >
        <SunDisk size="poster" glow={true} />
      </div>

      {/* 3. Naturally Integrated Archival Cutouts */}
      <div
        ref={penRef}
        className="hidden lg:block absolute top-32 right-[12%] w-36 h-36 pointer-events-none z-20 animate-float drop-shadow-[0_16px_30px_rgba(25,26,43,0.18)] dark:drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)] will-change-transform"
        aria-hidden="true"
      >
        <Image
          src="/images/cutouts/cutout_fountain_pen_nib.webp"
          alt=""
          width={160}
          height={160}
          className="object-contain"
        />
      </div>

      <div
        ref={hourglassRef}
        className="hidden md:block absolute bottom-20 right-[6%] w-36 h-48 sm:w-44 sm:h-56 pointer-events-none z-20 animate-float-slow drop-shadow-[0_20px_35px_rgba(25,26,43,0.2)] dark:drop-shadow-[0_25px_40px_rgba(0,0,0,0.7)] will-change-transform"
        aria-hidden="true"
      >
        <Image
          src="/images/cutouts/cutout_hourglass_dust.webp"
          alt=""
          width={200}
          height={260}
          className="object-contain"
        />
      </div>

      {/* 4. Confident Editorial Typography */}
      <Container size="wide" className="relative z-20 py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl">
          {/* Subtle Literary Kicker */}
          <div
            ref={kickerRef}
            className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[#FF684D] font-bold mb-6 sm:mb-8"
          >
            <span>残響 · THE DIGITAL MEMORY VAULT</span>
            <span className="h-px w-8 bg-[#FF684D]/40" />
            <span className="text-[#767C9D] dark:text-[#A4AAC7] font-normal hidden sm:inline">
              PERSONAL TIME CAPSULE
            </span>
          </div>

          {/* Monumental Headline */}
          <h1
            ref={headlineRef}
            className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] tracking-tight text-[#191A2B] dark:text-[#F7F3EC] leading-[1.08] mb-6 sm:mb-8 will-change-transform"
          >
            The Sanctuary for Things{' '}
            <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#FF684D] via-[#FFB93F] to-[#F7D84B]">
              Time Must Not Steal.
            </span>
          </h1>

          {/* Editorial Narrative Subtext */}
          <p
            ref={subtextRef}
            className="font-sans text-base sm:text-xl text-[#484C69] dark:text-[#A4AAC7] leading-relaxed max-w-2xl mb-10 sm:mb-12 font-light will-change-transform"
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
