'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { CameraIcon, SparklesIcon, ArrowRightIcon } from '@/components/icons/Icons';
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

      gsap.to(filmstripRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
        yPercent: -4,
        ease: 'none',
      });

      // 2. Sequential Reveal of Film Frames
      if (framesContainerRef.current) {
        gsap.fromTo(
          framesContainerRef.current.children,
          { opacity: 0, y: 28 },
          {
            scrollTrigger: {
              trigger: framesContainerRef.current,
              start: 'top 80%',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.18,
            ease: 'back.out(1.2)',
          }
        );
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
        { opacity: 0.5, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  };

  return (
    <section
      ref={sectionRef}
      id="contact-sheet"
      className="relative bg-[#EFE8DD] dark:bg-[#0B0C14] text-[#191A2B] dark:text-[#F7F3EC] py-28 sm:py-36 overflow-hidden border-b border-[#191A2B]/10 dark:border-white/10 transition-colors duration-300"
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
              <span className="text-[#767C9D] dark:text-[#A4AAC7] font-normal">
                FOLIO № 03 · 35MM ARCHIVAL EMULSION
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#191A2B] dark:text-[#F7F3EC] tracking-tight leading-tight">
              The 35mm Contact Sheet.{' '}
              <span className="italic font-normal text-[#FF684D]">Proof of Being.</span>
            </h2>
          </div>

          <div className="font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFB93F] animate-ping" />
            <span>SELECT ANY FRAME TO INSPECT WITH DARKROOM LOUPE</span>
          </div>
        </div>

        {/* 35mm Physical Film Strip Composition */}
        <div ref={filmstripRef} className="relative mb-12 will-change-transform">
          <div className="relative rounded-2xl bg-[#090A11] p-4 sm:p-8 border border-black/30 dark:border-white/10 shadow-[0_28px_70px_rgba(25,26,43,0.22)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Top Film Sprockets Bar */}
            <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-white/10 overflow-hidden font-mono text-[10px] text-[#FFB93F] tracking-widest uppercase">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB93F]" />
                <span className="hidden sm:inline">SAFETY FILM · 400 ISO MONOCHROME</span>
                <span className="sm:hidden">400 ISO</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-6">
                {[...Array(14)].map((_, i) => (
                  <div
                    key={`top-sprocket-${i}`}
                    className="w-4 h-6 sm:w-5 sm:h-7 rounded-[4px] bg-[#141524] border border-white/10 shrink-0"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="hidden sm:inline">REGISTRATION 01A–03A · CURATOR&apos;S PROOF</span>
            </div>

            {/* Middle Frame Bays: Upgraded High-End Awwwards Cards */}
            <div
              ref={framesContainerRef}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 py-6 sm:py-8"
            >
              {FRAMES.map((frame) => {
                const isSelected = selectedFrame.id === frame.id;
                return (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => handleSelectFrame(frame)}
                    className={`group relative text-left rounded-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF684D] transition-all duration-300 will-change-transform cursor-pointer border ${
                      isSelected
                        ? 'border-[#FF684D] bg-[#121320] shadow-[0_16px_40px_rgba(255,104,77,0.3)] ring-1 ring-[#FF684D] scale-[1.02]'
                        : 'border-white/10 bg-[#0F101A] opacity-80 hover:opacity-100 hover:border-white/25 hover:scale-[1.01] hover:bg-[#121422]'
                    }`}
                  >
                    {/* Top Rebate Edge Bar with Authentic Film Markings */}
                    <div className="px-4 py-2 bg-black/60 border-b border-white/10 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase">
                      <div className="flex items-center gap-1.5 text-[#FFB93F]">
                        <span>▲</span>
                        <span className="font-bold">{frame.frameCode}</span>
                        <span className="text-white/40">·</span>
                        <span className="text-white/60">{frame.index}</span>
                      </div>
                      <div className="text-[9px] text-[#A4AAC7]">{frame.metadata.lens}</div>
                    </div>

                    {/* Photographic Aperture Window */}
                    <div className="relative aspect-[4/3] bg-black overflow-hidden m-3 rounded-lg border border-white/10 shadow-[inset_0_2px_12px_rgba(0,0,0,0.8)]">
                      <Image
                        src={frame.image}
                        alt={frame.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                      />

                      {/* Subtle Darkroom Vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                      {/* Grease-Pencil Selection Overlay on Frame 02 */}
                      {frame.id === 'frame-02' && (
                        <div
                          className="absolute inset-0 pointer-events-none z-10 opacity-90 mix-blend-screen"
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

                      {/* Corner Crop Registration Marks */}
                      <span className="absolute top-2 left-2 text-[10px] font-mono text-white/50 pointer-events-none leading-none">
                        ⌜
                      </span>
                      <span className="absolute top-2 right-2 text-[10px] font-mono text-white/50 pointer-events-none leading-none">
                        ⌝
                      </span>
                      <span className="absolute bottom-2 left-2 text-[10px] font-mono text-white/50 pointer-events-none leading-none">
                        ⌞
                      </span>
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono text-white/50 pointer-events-none leading-none">
                        ⌟
                      </span>

                      {/* Frame Code Stamp Badge */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-sm bg-black/80 backdrop-blur-md border border-white/20 font-mono text-[9px] text-[#FFB93F] tracking-widest uppercase">
                        {frame.frameCode}
                      </div>

                      {/* Status Indicator Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        {isSelected ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF684D] font-mono text-[9px] text-white tracking-widest uppercase font-bold shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>INSPECTING</span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-sm bg-black/60 backdrop-blur-md border border-white/10 font-mono text-[9px] text-white/60 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                            CLICK TO VIEW
                          </div>
                        )}
                      </div>

                      {/* Bottom Image Micro-Specs */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between font-mono text-[9px] text-white/80 uppercase tracking-wider pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                          {frame.metadata.exposure}
                        </span>
                        <span className="text-[#FFB93F]">{frame.metadata.date}</span>
                      </div>
                    </div>

                    {/* Frame Card Editorial Technical Mount */}
                    <div className="p-4 pt-1 pb-5 bg-transparent space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3
                          className={`font-serif text-lg sm:text-xl leading-snug transition-colors ${
                            isSelected
                              ? 'text-[#FF684D]'
                              : 'text-[#F7F3EC] group-hover:text-[#FF684D]'
                          }`}
                        >
                          {frame.title}
                        </h3>
                        <span className="shrink-0 font-mono text-[10px] text-[#39BFAE] font-bold">
                          {frame.metadata.iso.split(' ')[0]} ISO
                        </span>
                      </div>

                      <p className="font-sans text-xs text-[#A4AAC7] line-clamp-2 font-light leading-relaxed">
                        {frame.caption}
                      </p>

                      {/* Action CTA indicator */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-[#FFB93F] uppercase tracking-wider">
                        <span className="text-[#767C9D] group-hover:text-[#FF684D] transition-colors">
                          {isSelected ? 'ACTIVE IN DARKROOM LOUPE' : 'INSPECT NEGATIVE'}
                        </span>
                        <span className="transform group-hover:translate-x-1 transition-transform">
                          <ArrowRightIcon size={12} />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Film Sprockets Bar */}
            <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-white/10 overflow-hidden font-mono text-[10px] text-[#FFB93F] tracking-widest uppercase">
              <span className="hidden sm:inline">EMULSION #8841-B · NITRATE-SAFE BASE</span>
              <div className="flex items-center gap-3 sm:gap-6">
                {[...Array(14)].map((_, i) => (
                  <div
                    key={`bottom-sprocket-${i}`}
                    className="w-4 h-6 sm:w-5 sm:h-7 rounded-[4px] bg-[#141524] border border-white/10 shrink-0"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="hidden sm:inline">ECHOES ANALOG VAULT © 2026</span>
            </div>
          </div>
        </div>

        {/* Upgraded Inspected Frame Darkroom Loupe Console */}
        <div
          ref={loupeRef}
          className="rounded-2xl bg-white/95 dark:bg-[#141524]/95 backdrop-blur-md border border-[#191A2B]/15 dark:border-white/15 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_16px_40px_rgba(25,26,43,0.08)] dark:shadow-2xl will-change-transform"
        >
          <div className="max-w-xl">
            <div className="flex items-center gap-3 font-mono text-xs text-[#FF684D] tracking-widest uppercase mb-2 font-bold">
              <SparklesIcon size={14} />
              <span>DARKROOM LOUPE · EXAMINING FRAME {selectedFrame.frameCode}</span>
              <span className="h-px w-6 bg-[#FF684D]/40" />
              <span className="text-[#767C9D] dark:text-[#A4AAC7] font-normal text-[10px]">
                MAGNIFICATION: 2.8X
              </span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#191A2B] dark:text-[#F7F3EC] mb-2 leading-tight">
              {selectedFrame.title}
            </h3>
            <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] leading-relaxed font-light">
              {selectedFrame.caption} In Echoes, high-resolution photographs are preserved with
              authenticated orientation safety, signed Cloudinary storage, and analog grain
              reproduction.
            </p>
          </div>

          {/* Technical Metadata Grid Console */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 shrink-0 font-mono text-xs w-full md:w-auto">
            <div className="p-3.5 rounded-xl bg-[#191A2B]/5 dark:bg-white/5 border border-[#191A2B]/10 dark:border-white/10 text-center">
              <div className="text-[10px] text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider mb-1">
                LENS
              </div>
              <div className="text-[#191A2B] dark:text-[#F7F3EC] font-semibold text-xs sm:text-sm">
                {selectedFrame.metadata.lens}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#191A2B]/5 dark:bg-white/5 border border-[#191A2B]/10 dark:border-white/10 text-center">
              <div className="text-[10px] text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider mb-1">
                EXPOSURE
              </div>
              <div className="text-[#191A2B] dark:text-[#F7F3EC] font-semibold text-xs sm:text-sm">
                {selectedFrame.metadata.exposure}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#191A2B]/5 dark:bg-white/5 border border-[#191A2B]/10 dark:border-white/10 text-center">
              <div className="text-[10px] text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider mb-1">
                STOCK
              </div>
              <div className="text-[#191A2B] dark:text-[#F7F3EC] font-semibold text-xs sm:text-sm">
                {selectedFrame.metadata.iso}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#191A2B]/5 dark:bg-white/5 border border-[#191A2B]/10 dark:border-white/10 text-center">
              <div className="text-[10px] text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider mb-1">
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
