'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { CameraIcon, SparklesIcon, ArrowRightIcon } from '@/components/icons/Icons';
import { NeumorphicCard } from '@/components/landing/NeumorphicCard';
import { gsap, isReducedMotion } from '@/lib/motion';

interface FilmFrame {
  id: string;
  frameCode: string;
  index: string;
  title: string;
  caption: string;
  image: string;
  metadata: {
    lens: string;
    exposure: string;
    iso: string;
    date: string;
  };
}

const FRAMES: FilmFrame[] = [
  {
    id: 'frame-01',
    frameCode: '01A',
    index: 'FRAME 01',
    title: 'The Silent Observatory',
    caption: 'Raking morning sunlight cutting through cedar window mullions.',
    image: '/images/architecture/arch_sunlight_interior.webp',
    metadata: {
      lens: '35mm Summicron',
      exposure: 'f/4 · 1/250s',
      iso: '400 Monochrome',
      date: 'OCT 14, 2026',
    },
  },
  {
    id: 'frame-02',
    frameCode: '02A',
    index: 'FRAME 02',
    title: 'Letters on Deckle Cotton Rag',
    caption: 'Fountain pen ink drying in the morning silence. Selected proof.',
    image: '/images/photography/photo_hands_letter.webp',
    metadata: {
      lens: '50mm Planar',
      exposure: 'f/2.0 · 1/125s',
      iso: '400 Sepia Halide',
      date: 'OCT 18, 2026',
    },
  },
  {
    id: 'frame-03',
    frameCode: '03A',
    index: 'FRAME 03',
    title: 'Mechanical Rangefinder & Rolls',
    caption: 'Manual advance shutter mechanism on cedar workshop drafting table.',
    image: '/images/photography/photo_vintage_camera.webp',
    metadata: {
      lens: '40mm Rokkor',
      exposure: 'f/2.8 · 1/60s',
      iso: '400 Analog Grain',
      date: 'OCT 29, 2026',
    },
  },
];

export function ContactSheetSection() {
  const [selectedFrame, setSelectedFrame] = useState<FilmFrame>(FRAMES[1]);
  const sectionRef = useRef<HTMLElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const framesContainerRef = useRef<HTMLDivElement>(null);
  const topSprocketRef = useRef<HTMLDivElement>(null);
  const bottomSprocketRef = useRef<HTMLDivElement>(null);
  const loupeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 1. Film Strip Container Entrance & Scroll Glide
      gsap.fromTo(
        filmstripRef.current,
        { opacity: 0, y: 36, scale: 0.98 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          },
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.0,
          ease: 'power3.out',
        }
      );

      gsap.fromTo(
        filmstripRef.current,
        { scale: 0.94, yPercent: 4 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'center center',
            scrub: 0.9,
          },
          scale: 1,
          yPercent: -2,
          ease: 'none',
        }
      );

      // Lateral film-advance scrub on sprockets as user scrolls through section
      if (topSprocketRef.current) {
        gsap.fromTo(
          topSprocketRef.current,
          { xPercent: -8 },
          {
            xPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
            },
          }
        );
      }

      if (bottomSprocketRef.current) {
        gsap.fromTo(
          bottomSprocketRef.current,
          { xPercent: 8 },
          {
            xPercent: -8,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
            },
          }
        );
      }

      // 2. Sequential Reveal of Film Frames + Curtain Unveil on Apertures
      if (framesContainerRef.current) {
        const cards = framesContainerRef.current.children;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 32, scale: 0.96 },
          {
            scrollTrigger: {
              trigger: framesContainerRef.current,
              start: 'top 82%',
            },
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            stagger: 0.14,
            ease: 'power3.out',
          }
        );

        const apertures = framesContainerRef.current.querySelectorAll('.contact-aperture');
        if (apertures.length > 0) {
          gsap.fromTo(
            apertures,
            { clipPath: 'inset(12% 4% 12% 4% round 8px)' },
            {
              clipPath: 'inset(0% 0% 0% 0% round 8px)',
              duration: 0.9,
              stagger: 0.14,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: framesContainerRef.current,
                start: 'top 80%',
              },
            }
          );
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Smooth Loupe Transition on Frame Selection
  const handleSelectFrame = (frame: FilmFrame) => {
    setSelectedFrame(frame);
    if (!isReducedMotion() && loupeRef.current) {
      gsap.fromTo(
        loupeRef.current,
        { opacity: 0.55, y: 10, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' }
      );
    }
  };

  return (
    <section
      ref={sectionRef}
      id="contact-sheet"
      className="film-grain relative bg-[#E7DEC8] dark:bg-[#12100D] text-[#191A2B] dark:text-[#F7F3EC] py-28 sm:py-36 overflow-hidden border-b border-[#191A2B]/10 dark:border-amber-200/10 transition-colors duration-300"
    >
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#FF684D]/10 dark:bg-[#FF684D]/15 blur-[160px] pointer-events-none rounded-full" />

      <Container size="wide" className="relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-widest text-[#FF684D] mb-4 font-bold">
              <CameraIcon size={14} />
              <span>TRACES OF LIGHT & FILM</span>
              <span className="h-px w-8 bg-[#FF684D]/40" />
              <span className="text-[#767C9D] dark:text-[#C8BCAA] font-normal">
                FOLIO № 03 · 35MM ARCHIVAL EMULSION
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#191A2B] dark:text-[#F7F3EC] tracking-tight leading-tight">
              The 35mm Contact Sheet.{' '}
              <span className="italic font-normal text-[#FF684D]">Proof of Being.</span>
            </h2>
          </div>

          <div className="font-mono text-xs text-[#767C9D] dark:text-[#C8BCAA] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFB93F] animate-ping" />
            <span>SELECT ANY FRAME TO INSPECT WITH DARKROOM LOUPE</span>
          </div>
        </div>

        {/* Light Warm Parchment Contact Sheet Tray */}
        <div ref={filmstripRef} className="relative mb-10 will-change-transform">
          <div className="neu-card relative rounded-3xl p-4 sm:p-8 overflow-hidden">
            {/* Top Recessed Sprocket Perforations Bar */}
            <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-[#191A2B]/10 dark:border-amber-200/10 overflow-hidden font-mono text-[10px] text-[#8B6914] dark:text-[#FFB93F] tracking-widest uppercase">
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF684D]" />
                <span className="hidden sm:inline">SAFETY FILM · 400 ISO MONOCHROME</span>
                <span className="sm:hidden">400 ISO</span>
              </div>
              <div
                ref={topSprocketRef}
                className="flex items-center gap-3 sm:gap-5 px-4 will-change-transform"
              >
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`top-sprocket-${i}`}
                    className="neu-well w-4 h-5 sm:w-5 sm:h-6 rounded-[4px] shrink-0"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="hidden sm:inline shrink-0 text-[#767C9D] dark:text-[#C8BCAA]">
                REGISTRATION 01A–03A · CURATOR&apos;S PROOF
              </span>
            </div>

            {/* Middle Frame Bays: Warm Light-Mode Neumorphic Slide Mounts */}
            <div
              ref={framesContainerRef}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 py-6 sm:py-8"
            >
              {FRAMES.map((frame) => {
                const isSelected = selectedFrame.id === frame.id;
                return (
                  <NeumorphicCard
                    key={frame.id}
                    tilt
                    spotlight
                    data-cursor="LOUPE"
                    className={`rounded-2xl transition-all duration-300 ${
                      isSelected
                        ? 'ring-2 ring-[#FF684D] scale-[1.02]'
                        : 'hover:-translate-y-1 opacity-95 hover:opacity-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectFrame(frame)}
                      className="group w-full text-left p-4 sm:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF684D] rounded-2xl cursor-pointer block"
                    >
                      {/* Clean Slide Mount Header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#191A2B]/10 dark:border-amber-200/10 font-mono text-[10px] tracking-widest uppercase">
                        <div className="flex items-center gap-1.5">
                          <span className={isSelected ? 'text-[#FF684D]' : 'text-[#8B6914] dark:text-[#FFB93F]'}>
                            ▲
                          </span>
                          <span className="font-bold text-[#191A2B] dark:text-[#F7F3EC]">
                            {frame.frameCode}
                          </span>
                          <span className="text-[#767C9D] dark:text-[#C8BCAA]">· {frame.index}</span>
                        </div>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FF684D] text-white text-[9px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            INSPECTING
                          </span>
                        ) : (
                          <span className="text-[9px] text-[#767C9D] dark:text-[#C8BCAA]">
                            {frame.metadata.lens}
                          </span>
                        )}
                      </div>

                      {/* Recessed Photographic Aperture Well */}
                      <div className="neu-well p-1.5 rounded-xl mb-4">
                        <div className="contact-aperture relative aspect-[4/3] rounded-lg overflow-hidden bg-[#191A2B]/10">
                          <Image
                            src={frame.image}
                            alt={frame.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            style={{ filter: 'sepia(0.14) contrast(1.03)' }}
                          />

                          {/* Soft Bottom Scrim for Spec Legibility */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

                          {/* Grease-Pencil Selection Overlay on Frame 02 */}
                          {frame.id === 'frame-02' && (
                            <div
                              className="absolute inset-0 pointer-events-none z-10 opacity-85 mix-blend-screen"
                              aria-hidden="true"
                            >
                              <Image
                                src="/images/illustrations/overlay_grease_pencil.svg"
                                alt=""
                                fill
                                className="object-contain p-2"
                              />
                            </div>
                          )}

                          {/* Bottom Image Micro-Specs */}
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between font-mono text-[9px] text-white/90 uppercase tracking-wider pointer-events-none">
                            <span className="px-2 py-0.5 rounded-sm bg-black/55 backdrop-blur-xs">
                              {frame.metadata.exposure}
                            </span>
                            <span className="text-[#F7D84B] font-semibold">
                              {frame.metadata.date}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Editorial Slide Mount Caption */}
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3
                            className={`font-serif text-lg sm:text-xl leading-snug transition-colors ${
                              isSelected
                                ? 'text-[#FF684D]'
                                : 'text-[#191A2B] dark:text-[#F7F3EC] group-hover:text-[#FF684D]'
                            }`}
                          >
                            {frame.title}
                          </h3>
                          <span className="shrink-0 font-mono text-[10px] text-[#1F8A7E] dark:text-[#FFB93F] font-bold">
                            {frame.metadata.iso.split(' ')[0]} ISO
                          </span>
                        </div>

                        <p className="font-sans text-xs text-[#484C69] dark:text-[#C8BCAA] line-clamp-2 font-light leading-relaxed">
                          {frame.caption}
                        </p>

                        <div className="pt-2.5 border-t border-[#191A2B]/10 dark:border-amber-200/10 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
                          <span
                            className={
                              isSelected
                                ? 'text-[#FF684D] font-semibold'
                                : 'text-[#767C9D] dark:text-[#C8BCAA] group-hover:text-[#FF684D] transition-colors'
                            }
                          >
                            {isSelected ? 'ACTIVE IN DARKROOM LOUPE' : 'INSPECT NEGATIVE'}
                          </span>
                          <span className="text-[#FF684D] transform group-hover:translate-x-1 transition-transform">
                            <ArrowRightIcon size={12} />
                          </span>
                        </div>
                      </div>
                    </button>
                  </NeumorphicCard>
                );
              })}
            </div>

            {/* Bottom Recessed Sprocket Perforations Bar */}
            <div className="flex items-center justify-between pt-4 sm:pt-5 border-t border-[#191A2B]/10 dark:border-amber-200/10 overflow-hidden font-mono text-[10px] text-[#8B6914] dark:text-[#FFB93F] tracking-widest uppercase">
              <span className="hidden sm:inline shrink-0 text-[#767C9D] dark:text-[#C8BCAA]">
                EMULSION #8841-B · NITRATE-SAFE BASE
              </span>
              <div
                ref={bottomSprocketRef}
                className="flex items-center gap-3 sm:gap-5 px-4 will-change-transform"
              >
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`bottom-sprocket-${i}`}
                    className="neu-well w-4 h-5 sm:w-5 sm:h-6 rounded-[4px] shrink-0"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="hidden sm:inline shrink-0">ECHOES ANALOG VAULT © 2026</span>
            </div>
          </div>
        </div>

        {/* Upgraded Inspected Frame Darkroom Loupe Console */}
        <div
          ref={loupeRef}
          className="neu-card rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 will-change-transform"
        >
          <div className="max-w-xl">
            <div className="flex items-center gap-3 font-mono text-xs text-[#FF684D] tracking-widest uppercase mb-2 font-bold">
              <SparklesIcon size={14} />
              <span>DARKROOM LOUPE · EXAMINING FRAME {selectedFrame.frameCode}</span>
              <span className="h-px w-6 bg-[#FF684D]/40" />
              <span className="text-[#767C9D] dark:text-[#C8BCAA] font-normal text-[10px]">
                MAGNIFICATION: 2.8X
              </span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#191A2B] dark:text-[#F7F3EC] mb-2 leading-tight">
              {selectedFrame.title}
            </h3>
            <p className="font-sans text-sm text-[#484C69] dark:text-[#C8BCAA] leading-relaxed font-light">
              {selectedFrame.caption} In Echoes, high-resolution photographs are preserved with
              authenticated orientation safety, signed Cloudinary storage, and analog grain
              reproduction.
            </p>
          </div>

          {/* Technical Metadata Grid Console */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 shrink-0 font-mono text-xs w-full md:w-auto">
            <div className="neu-well p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-[#767C9D] dark:text-[#C8BCAA] uppercase tracking-wider mb-1">
                LENS
              </div>
              <div className="text-[#191A2B] dark:text-[#F7F3EC] font-semibold text-xs sm:text-sm">
                {selectedFrame.metadata.lens}
              </div>
            </div>
            <div className="neu-well p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-[#767C9D] dark:text-[#C8BCAA] uppercase tracking-wider mb-1">
                EXPOSURE
              </div>
              <div className="text-[#191A2B] dark:text-[#F7F3EC] font-semibold text-xs sm:text-sm">
                {selectedFrame.metadata.exposure}
              </div>
            </div>
            <div className="neu-well p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-[#767C9D] dark:text-[#C8BCAA] uppercase tracking-wider mb-1">
                STOCK
              </div>
              <div className="text-[#191A2B] dark:text-[#F7F3EC] font-semibold text-xs sm:text-sm">
                {selectedFrame.metadata.iso}
              </div>
            </div>
            <div className="neu-well p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-[#767C9D] dark:text-[#C8BCAA] uppercase tracking-wider mb-1">
                RECORDED
              </div>
              <div className="text-[#FF684D] font-semibold text-xs sm:text-sm">
                {selectedFrame.metadata.date}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ContactSheetSection;
