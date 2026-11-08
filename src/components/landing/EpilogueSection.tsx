'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, LockIcon } from '@/components/icons/Icons';
import { gsap, isReducedMotion } from '@/lib/motion';

export function EpilogueSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const sealRef = useRef<HTMLAnchorElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const footerNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 1. Wax Seal Entrance & Subtle Scroll Scrub
      gsap.fromTo(
        sealRef.current,
        { scale: 0.7, opacity: 0, rotate: -12 },
        {
          scrollTrigger: {
            trigger: sealRef.current,
            start: 'top 85%',
          },
          scale: 1,
          opacity: 1,
          rotate: 0,
          duration: 0.9,
          ease: 'back.out(1.6)',
        }
      );

      gsap.to(sealRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: 1.2,
        },
        yPercent: -12,
        ease: 'none',
      });

      // 2. Closing Monumental Headline
      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, y: 30 },
        {
          scrollTrigger: {
            trigger: headlineRef.current,
            start: 'top 85%',
          },
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
        }
      );

      // 3. CTA Buttons
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 18 },
        {
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 88%',
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.1,
          ease: 'power2.out',
        }
      );

      // 4. Footer Columns Stagger
      if (footerNavRef.current) {
        gsap.fromTo(
          footerNavRef.current.children,
          { opacity: 0, y: 20 },
          {
            scrollTrigger: {
              trigger: footerNavRef.current,
              start: 'top 92%',
            },
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power2.out',
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSealMouseEnter = () => {
    if (isReducedMotion() || !sealRef.current) return;
    gsap.to(sealRef.current, {
      scale: 1.08,
      rotate: 4,
      duration: 0.45,
      ease: 'back.out(2)',
      overwrite: 'auto',
    });
  };

  const handleSealMouseLeave = () => {
    if (isReducedMotion() || !sealRef.current) return;
    gsap.to(sealRef.current, {
      scale: 1,
      rotate: 0,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  return (
    <footer
      ref={sectionRef}
      className="relative bg-[#191A2B] dark:bg-[#08090E] text-[#F7F3EC] pt-24 sm:pt-36 pb-16 overflow-hidden transition-colors duration-300"
    >
      {/* Background Celestial Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF684D]/15 blur-[160px] pointer-events-none rounded-full" />

      <Container size="wide" className="relative z-10">
        {/* Final Monumental CTA Block */}
        <div className="max-w-4xl mx-auto text-center mb-24 sm:mb-32">
          {/* Central Wax Seal Emblem Button */}
          <div className="flex justify-center mb-8">
            <Link
              ref={sealRef}
              href="/register"
              onMouseEnter={handleSealMouseEnter}
              onMouseLeave={handleSealMouseLeave}
              className="relative w-24 h-24 sm:w-32 sm:h-32 block rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF684D] will-change-transform"
              aria-label="Begin Your Archive with Echoes Wax Seal"
            >
              <div className="absolute inset-0 rounded-full bg-[#FF684D]/25 blur-xl transition-all duration-500" />
              <Image
                src="/images/cutouts/cutout_wax_seal_hot.webp"
                alt="Echoes Archival Wax Seal"
                fill
                className="object-contain drop-shadow-[0_15px_30px_rgba(255,104,77,0.4)]"
              />
            </Link>
          </div>

          {/* Section Kicker */}
          <div className="inline-block font-mono text-xs text-[#FFB93F] uppercase tracking-widest mb-4 font-bold">
            THE EPILOGUE
          </div>

          {/* Monumental Closing Typography */}
          <h2
            ref={headlineRef}
            className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#F7F3EC] tracking-tight leading-[1.14] mb-6 will-change-transform"
          >
            Your future self is waiting to read{' '}
            <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#FF684D] via-[#FFB93F] to-[#F7D84B]">
              what you inscribe today.
            </span>
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#A4AAC7] leading-relaxed max-w-2xl mx-auto mb-10 font-light">
            No audience of strangers. No vanishing feeds. Just the quiet sanctuary of your personal
            history, sealed and preserved for decades to come.
          </p>

          {/* Action CTAs */}
          <div
            ref={ctaRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 will-change-transform"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="coral"
                size="lg"
                icon={<ArrowRightIcon size={18} />}
                className="w-full sm:w-auto text-base shadow-[0_12px_32px_rgba(255,104,77,0.4)] hover:shadow-[0_16px_40px_rgba(255,104,77,0.5)] transition-all hover:-translate-y-0.5"
              >
                Inscribe Your First Echo
              </Button>
            </Link>

            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base border-white/20 text-[#F7F3EC] hover:bg-white/10"
              >
                Already an Archivist? Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Editorial Archival Footer Navigation */}
        <div
          ref={footerNavRef}
          className="pt-16 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-12 pb-16 will-change-transform"
        >
          {/* Brand Col */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-block mb-4">
              <span className="font-serif text-3xl tracking-tight text-[#F7F3EC] block hover:text-[#FF684D] transition-colors">
                ECHOES
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-[#FFB93F] opacity-90 block mt-1">
                残響 · DIGITAL MEMORY VAULT & TIME CAPSULE
              </span>
            </Link>
            <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] leading-relaxed max-w-sm mt-3 font-light">
              An experimental editorial archive built for the preservation of human reflection, 35mm
              photographic memories, and sealed correspondence across epochs.
            </p>
          </div>

          {/* Column 1: The Archive */}
          <div className="md:col-span-2">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF684D] mb-4 font-bold">
              THE ARCHIVE
            </div>
            <ul className="space-y-2.5 font-sans text-sm text-[#A4AAC7]">
              <li>
                <Link href="/memories" className="hover:text-white transition-colors">
                  Memory Journal
                </Link>
              </li>
              <li>
                <Link href="/capsules" className="hover:text-white transition-colors">
                  Sealed Capsules
                </Link>
              </li>
              <li>
                <Link href="/timeline" className="hover:text-white transition-colors">
                  Unified Chronology
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Sanctuary Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Foundations */}
          <div className="md:col-span-2">
            <div className="font-mono text-xs uppercase tracking-widest text-[#39BFAE] mb-4 font-bold">
              FOUNDATIONS
            </div>
            <ul className="space-y-2.5 font-sans text-sm text-[#A4AAC7]">
              <li>
                <Link href="/showcase" className="hover:text-white transition-colors">
                  Design Showcase
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Create Vault
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Vault Authentication
                </Link>
              </li>
              <li>
                <a href="#manifesto" className="hover:text-white transition-colors">
                  Manifesto
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Preservation Pledge */}
          <div className="md:col-span-3">
            <div className="font-mono text-xs uppercase tracking-widest text-[#F7D84B] mb-4 font-bold">
              PRESERVATION PLEDGE
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-sans text-xs text-[#A4AAC7] leading-relaxed">
              <div className="flex items-center gap-2 text-[#39BFAE] font-mono uppercase tracking-wider mb-2 font-semibold">
                <LockIcon size={12} />
                <span>CRYPTOGRAPHIC PURITY</span>
              </div>
              All private photographs are stored under authenticated Cloudinary signatures. Sealed
              capsules remain server-protected until their celestial unlock dates arrive.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#767C9D] uppercase tracking-wider">
          <div>ECHOES ARCHIVAL SANCTUARY © 2026 · ALL RIGHTS RESERVED</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B7DB50]" />
            <span>ENCRYPTED REPOSITORY</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default EpilogueSection;
