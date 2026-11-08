'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { FeatherIcon, LockIcon, CompassIcon } from '@/components/icons/Icons';
import { gsap, isReducedMotion } from '@/lib/motion';

export function ManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const fernRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const proseRef = useRef<HTMLDivElement>(null);
  const photoPlateRef = useRef<HTMLDivElement>(null);
  const triptychRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 1. Botanical Fern Parallax
      gsap.to(fernRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8,
        },
        yPercent: 24,
        rotation: 16,
        ease: 'none',
      });

      // 2. Monumental Quote Staggered Entrance
      gsap.fromTo(
        quoteRef.current,
        { opacity: 0, y: 32 },
        {
          scrollTrigger: {
            trigger: quoteRef.current,
            start: 'top 82%',
          },
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
        }
      );

      // 3. Editorial Prose & Photo Plate Reveal
      gsap.fromTo(
        proseRef.current,
        { opacity: 0, y: 24 },
        {
          scrollTrigger: {
            trigger: proseRef.current,
            start: 'top 85%',
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        }
      );

      gsap.fromTo(
        photoPlateRef.current,
        { opacity: 0, scale: 0.96, rotate: -2 },
        {
          scrollTrigger: {
            trigger: photoPlateRef.current,
            start: 'top 82%',
          },
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: 1.0,
          ease: 'power2.out',
        }
      );

      // Photo Plate Subtle Parallax Scrub
      gsap.to(photoPlateRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
        yPercent: -10,
        rotation: 2.5,
        ease: 'none',
      });

      // 4. Three Editorial Principles
      if (triptychRef.current) {
        gsap.fromTo(
          triptychRef.current.children,
          { opacity: 0, y: 30 },
          {
            scrollTrigger: {
              trigger: triptychRef.current,
              start: 'top 85%',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power2.out',
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      className="relative bg-[#F7F3EC] dark:bg-[#141524] text-[#191A2B] dark:text-[#F7F3EC] pt-28 pb-32 sm:py-40 overflow-hidden border-b border-[#191A2B]/10 dark:border-white/10 transition-colors duration-300"
    >
      {/* Paper Wash Texture */}
      <div className="absolute inset-0 opacity-40 dark:opacity-10 pointer-events-none mix-blend-multiply dark:mix-blend-overlay">
        <Image
          src="/images/backgrounds/bg_parchment_wash.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Floating Botanical Fern Specimen */}
      <div
        ref={fernRef}
        className="hidden md:block absolute -right-10 top-24 w-52 sm:w-72 h-80 sm:h-[420px] pointer-events-none z-10 opacity-60 dark:opacity-30 transform rotate-12 drop-shadow-[0_16px_30px_rgba(25,26,43,0.12)] will-change-transform"
        aria-hidden="true"
      >
        <Image
          src="/images/cutouts/cutout_botanical_fern.webp"
          alt=""
          width={300}
          height={420}
          className="object-contain"
        />
      </div>

      <Container size="wide" className="relative z-20">
        <div className="max-w-5xl mx-auto">
          {/* Subtle Editorial Kicker */}
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[#FF684D] font-bold mb-8">
            <span>THE ARCHITECTURE OF MEMORY</span>
            <span className="h-px w-12 bg-[#FF684D]/40" />
            <span className="text-[#767C9D] dark:text-[#A4AAC7] font-normal">
              DE ARCHITECTURA MEMORIAE
            </span>
          </div>

          {/* Monumental Lead Statement */}
          <blockquote
            ref={quoteRef}
            className="font-serif text-3xl sm:text-5xl lg:text-[3.75rem] text-[#191A2B] dark:text-[#F7F3EC] leading-[1.16] tracking-tight font-normal mb-16 sm:mb-24 will-change-transform"
          >
            &ldquo;We do not lose our memories all at once; they fade like pencil markings on{' '}
            <span className="italic font-normal text-[#4F66E8] dark:text-[#39BFAE] underline decoration-[#FF684D]/40 underline-offset-8">
              sun-bleached cotton rag.
            </span>
            &rdquo;
          </blockquote>

          {/* Asymmetrical Editorial Composition: Prose + Archival Photograph Plate */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-center mb-20 sm:mb-28">
            {/* Left Prose Column */}
            <div
              ref={proseRef}
              className="lg:col-span-7 space-y-6 text-base sm:text-lg text-[#484C69] dark:text-[#A4AAC7] leading-relaxed font-light will-change-transform"
            >
              <p className="font-serif text-xl sm:text-2xl text-[#191A2B] dark:text-[#F7F3EC] leading-relaxed first-letter:float-left first-letter:text-6xl first-letter:font-serif first-letter:pr-3 first-letter:text-[#FF684D] first-letter:leading-none">
                In an era dominated by disappearing stories, ephemeral feeds, and algorithmic
                amnesia, Echoes is built upon an unapologetic counter-philosophy: what is deeply
                felt deserves permanent sanctuary.
              </p>
              <p>
                A photograph is not merely light converted into pixels. It is tangible evidence that
                you stood in a specific morning, breathed that air, and were changed by it. Echoes
                provides a deliberate, tactile home for unhurried reflections, analog proofs, and
                future correspondence.
              </p>
            </div>

            {/* Right Layered Photographic Plate */}
            <div ref={photoPlateRef} className="lg:col-span-5 will-change-transform">
              <div className="relative mx-auto max-w-sm rounded-2xl bg-white dark:bg-[#1E2135] p-4 sm:p-5 shadow-[0_16px_40px_rgba(25,26,43,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#191A2B]/10 dark:border-white/10">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/10">
                  <Image
                    src="/images/photography/photo_hands_letter.webp"
                    alt="Hands writing letters with fountain pen on cotton rag paper"
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider">
                  <span>PLATE 02 · ARCHIVAL MONOGRAPH</span>
                  <span className="text-[#FF684D]">OCTOBER 18</span>
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Triptych: Three Core Tenets (Non-SaaS Layout) */}
          <div
            ref={triptychRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-[#191A2B]/10 dark:border-white/10"
          >
            {/* Tenet 01 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[#FF684D]">
                <FeatherIcon size={20} />
                <span className="font-mono text-xs uppercase tracking-widest font-bold">
                  01 · INSCRIPTION
                </span>
              </div>
              <h3 className="font-serif text-2xl text-[#191A2B] dark:text-[#F7F3EC]">
                Deliberate Thought
              </h3>
              <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] leading-relaxed font-light">
                Designed like handmade stationery. No public counters, no social validation, and
                zero broadcast feeds. Only pure written reflection.
              </p>
            </div>

            {/* Tenet 02 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[#4F66E8] dark:text-[#39BFAE]">
                <LockIcon size={20} />
                <span className="font-mono text-xs uppercase tracking-widest font-bold">
                  02 · TEMPORAL SEAL
                </span>
              </div>
              <h3 className="font-serif text-2xl text-[#191A2B] dark:text-[#F7F3EC]">
                Letters Across Epochs
              </h3>
              <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] leading-relaxed font-light">
                Capsules locked under server-enforced secrecy until your chosen future year. Sealed
                against premature curiosity until the date arrives.
              </p>
            </div>

            {/* Tenet 03 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[#FFB93F]">
                <CompassIcon size={20} />
                <span className="font-mono text-xs uppercase tracking-widest font-bold">
                  03 · CONTINUITY
                </span>
              </div>
              <h3 className="font-serif text-2xl text-[#191A2B] dark:text-[#F7F3EC]">
                A Living Heritage
              </h3>
              <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] leading-relaxed font-light">
                A unified river of time where past memories and unlocked capsules weave into an
                enduring personal chronicle of who you were and who you became.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ManifestoSection;
