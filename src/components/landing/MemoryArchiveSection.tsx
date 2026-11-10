'use client';

import React, { useState, useEffect, useRef } from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { BookOpenIcon, FilterIcon, ArrowRightIcon, SparklesIcon } from '@/components/icons/Icons';
import { NeumorphicCard } from '@/components/landing/NeumorphicCard';
import { gsap, isReducedMotion } from '@/lib/motion';

interface ArchivalMemory {
  id: string;
  index: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  fullNote: string;
  image: string;
  plateCode: string;
}

const MEMORIES: ArchivalMemory[] = [
  {
    id: 'mem-1',
    index: '01',
    plateCode: 'PL-2026-A',
    title: 'The Silent Observatory at Dusk',
    date: 'OCTOBER 14, 2026',
    tags: ['architecture', 'solitude', 'sanctuary'],
    excerpt:
      'Standing at the balcony overlooking misty cedar mountain ridges in the raking dawn light.',
    fullNote:
      'Standing at the balcony overlooking the misty cedar mountain ridges. The morning silence cutting through the rafters captured the exact feeling of timelessness. Every breath felt measured and deliberate.',
    image: '/images/architecture/arch_sunlight_interior.webp',
  },
  {
    id: 'mem-2',
    index: '02',
    plateCode: 'PL-2026-B',
    title: 'Autumn Letters on Deckle Cotton Paper',
    date: 'OCTOBER 18, 2026',
    tags: ['correspondence', 'analogue', 'reflections'],
    excerpt:
      'Every stroke of the fountain pen felt deliberate. Preserved words sealed in warm amber wax.',
    fullNote:
      'Every stroke of the fountain pen felt deliberate. Preserved words sealed in warm amber wax on heavy handmade parchment. The quiet ritual of hand-writing restored what screens had taken away.',
    image: '/images/photography/photo_hands_letter.webp',
  },
  {
    id: 'mem-3',
    index: '03',
    plateCode: 'PL-2026-C',
    title: 'First Daylight on the Golden Lake',
    date: 'OCTOBER 25, 2026',
    tags: ['nature', 'solitude', 'journey'],
    excerpt:
      'The morning light touched ripples in amber tones as we gathered stones along the shore.',
    fullNote:
      'The morning light touched the ripples in amber tones. We gathered stones along the shore, marking the anniversary of our quiet pledge. The water was undisturbed as glass.',
    image: '/images/landscapes/landscape_golden_lake.webp',
  },
  {
    id: 'mem-4',
    index: '04',
    plateCode: 'PL-2026-D',
    title: 'Mechanical Rangefinder & Spare Canisters',
    date: 'OCTOBER 29, 2026',
    tags: ['photography', 'analogue', '35mm'],
    excerpt:
      'Loading the last roll of 400 ISO negative film. The mechanical click ground into memory.',
    fullNote:
      'Loading the last roll of 400 ISO negative film. The tactile mechanical click of the shutter advance wheel ground into memory. A tangible record of an analog craft.',
    image: '/images/photography/photo_vintage_camera.webp',
  },
];

const ALL_TAGS = ['all', 'architecture', 'analogue', 'correspondence', 'solitude', 'nature'];

export function MemoryArchiveSection() {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const ledgerListRef = useRef<HTMLDivElement>(null);

  const filteredMemories =
    selectedTag === 'all' ? MEMORIES : MEMORIES.filter((m) => m.tags.includes(selectedTag));

  const activeMemory =
    (selectedMemoryId ? filteredMemories.find((m) => m.id === selectedMemoryId) : null) ||
    filteredMemories[0] ||
    MEMORIES[0];

  // GSAP Entrance & Scroll Parallax Scrub
  useEffect(() => {
    if (typeof window === 'undefined' || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 1. Header entrance
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 28 },
          {
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
            },
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
          }
        );
      }

      // 2. Featured museum plate entrance
      if (featuredRef.current) {
        gsap.fromTo(
          featuredRef.current,
          { opacity: 0, y: 36, scale: 0.98 },
          {
            scrollTrigger: {
              trigger: featuredRef.current,
              start: 'top 82%',
            },
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.0,
            ease: 'power3.out',
          }
        );

        // Awwwards differential vertical parallax scrub
        gsap.to(featuredRef.current, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
          yPercent: -6,
          ease: 'none',
        });
      }

      // 2b. Scrubbed curtain clip-path unveil on the specimen photograph
      if (imageFrameRef.current) {
        gsap.fromTo(
          imageFrameRef.current,
          { clipPath: 'inset(10% 3% 10% 3% round 12px)' },
          {
            clipPath: 'inset(0% 0% 0% 0% round 12px)',
            ease: 'none',
            scrollTrigger: {
              trigger: featuredRef.current,
              start: 'top 90%',
              end: 'top 40%',
              scrub: 0.6,
            },
          }
        );
      }

      // 3. Right Ledger List Staggered Entrance
      if (ledgerListRef.current) {
        gsap.fromTo(
          ledgerListRef.current.children,
          { opacity: 0, x: 24 },
          {
            scrollTrigger: {
              trigger: ledgerListRef.current,
              start: 'top 85%',
            },
            opacity: 1,
            x: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power2.out',
          }
        );
      }

      // 4. Vintage Airmail Stamp Ambient Oscillation & Scroll Parallax
      if (stampRef.current) {
        gsap.to(stampRef.current, {
          y: 12,
          rotation: 15,
          duration: 4.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        gsap.to(stampRef.current, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.4,
          },
          yPercent: 32,
          rotation: 24,
          ease: 'none',
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Smooth Awwwards Kinetic Transition on Memory Switch
  const handleSelectMemory = (mem: ArchivalMemory) => {
    if (activeMemory.id === mem.id) return;
    setSelectedMemoryId(mem.id);

    if (isReducedMotion()) return;

    if (imageFrameRef.current) {
      gsap.fromTo(
        imageFrameRef.current,
        { scale: 1.05, filter: 'blur(3px)' },
        { scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power2.out' }
      );
    }

    if (textContentRef.current) {
      gsap.fromTo(
        textContentRef.current,
        { opacity: 0.4, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
      );
    }
  };

  return (
    <section
      ref={sectionRef}
      id="archive"
      className="film-grain relative bg-[#EDE5D0] dark:bg-[#171410] text-[#191A2B] dark:text-[#F7F3EC] py-28 sm:py-36 overflow-hidden border-b border-[#191A2B]/10 dark:border-amber-200/10 transition-colors duration-300"
    >
      {/* Subtle Archival Watermark Grid / Paper Texture */}
      <div className="absolute inset-0 opacity-25 dark:opacity-15 pointer-events-none mix-blend-multiply dark:mix-blend-overlay">
        <Image
          src="/images/backgrounds/bg_parchment_wash.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Floating Airmail Stamp Specimen */}
      <div
        ref={stampRef}
        className="hidden md:block absolute top-12 right-12 lg:right-20 w-28 h-28 pointer-events-none z-20 transform rotate-12 drop-shadow-[0_16px_32px_rgba(25,26,43,0.14)] dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] will-change-transform"
        aria-hidden="true"
      >
        <Image
          src="/images/cutouts/cutout_postal_stamp.webp"
          alt=""
          width={130}
          height={130}
          className="object-contain"
        />
      </div>

      <Container size="wide" className="relative z-10">
        {/* Editorial Section Header */}
        <div
          ref={headerRef}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14 sm:mb-20"
        >
          <div className="max-w-2xl">
            {/* Curatorial Kicker & Folio Index */}
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[#FF684D] font-bold mb-4">
              <BookOpenIcon size={14} />
              <span>THE LIVING MEMORY ARCHIVE</span>
              <span className="h-px w-8 bg-[#FF684D]/40" />
              <span className="text-[#767C9D] dark:text-[#C8BCAA] font-normal">
                FOLIO № 04 · RECORDED REFLECTION
              </span>
            </div>

            {/* Monumental Headline */}
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#191A2B] dark:text-[#F7F3EC] tracking-tight leading-[1.12]">
              An Architectural Journal.{' '}
              <span className="italic font-normal text-[#FF684D] dark:text-[#FFB93F]">
                Organized by Thought.
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex flex-col text-right font-mono text-[11px] text-[#767C9D] dark:text-[#C8BCAA] uppercase tracking-wider pr-4 border-r border-[#191A2B]/15 dark:border-amber-200/15">
              <span>INDEX TOTAL</span>
              <span className="font-bold text-[#191A2B] dark:text-[#F7F3EC]">
                {MEMORIES.length} CURATED ENTRIES
              </span>
            </div>

            <NextLink href="/memories">
              <Button
                variant="outline"
                size="md"
                icon={<ArrowRightIcon size={14} />}
                className="border-[#191A2B]/20 dark:border-white/20 text-[#191A2B] dark:text-[#F7F3EC] hover:bg-[#191A2B] hover:text-[#F7F3EC] dark:hover:bg-white dark:hover:text-[#191A2B] tracking-wider uppercase font-mono text-xs"
              >
                Open Vault Journal
              </Button>
            </NextLink>
          </div>
        </div>

        {/* Modern Topic Index Bar */}
        <div className="mb-10 pb-4 border-b border-[#191A2B]/10 dark:border-amber-200/10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-mono text-xs text-[#767C9D] dark:text-[#C8BCAA] uppercase tracking-wider mr-2 font-bold">
                <FilterIcon size={13} />
                <span>TAXONOMY:</span>
              </div>
              {ALL_TAGS.map((tag) => {
                const count =
                  tag === 'all'
                    ? MEMORIES.length
                    : MEMORIES.filter((m) => m.tags.includes(tag)).length;
                const isCurrent = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`group relative px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider cursor-pointer ${
                      isCurrent
                        ? 'neu-pill-active text-[#FF684D] font-bold'
                        : 'neu-pill text-[#484C69] dark:text-[#C8BCAA] hover:text-[#191A2B] dark:hover:text-[#F7F3EC]'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="ml-1.5 opacity-60 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="font-mono text-xs text-[#767C9D] dark:text-[#C8BCAA] tracking-widest uppercase hidden lg:block">
              VIEWING ENTRY [{activeMemory.index} / 04]
            </div>
          </div>
        </div>

        {/* Awwwards Split Composition: Folio Specimen Plate + Curatorial Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Canvas: Museum Specimen Folio Plate */}
          <div ref={featuredRef} className="lg:col-span-7 will-change-transform">
            <NeumorphicCard
              tilt
              spotlight
              data-cursor="FOLIO"
              className="rounded-2xl p-6 sm:p-10"
            >
              {/* Museum Specimen Corner Crosses */}
              <span className="absolute top-3 left-3 font-mono text-xs text-[#FF684D] opacity-60 pointer-events-none">
                +
              </span>
              <span className="absolute top-3 right-3 font-mono text-xs text-[#FF684D] opacity-60 pointer-events-none">
                +
              </span>
              <span className="absolute bottom-3 left-3 font-mono text-xs text-[#FF684D] opacity-60 pointer-events-none">
                +
              </span>
              <span className="absolute bottom-3 right-3 font-mono text-xs text-[#FF684D] opacity-60 pointer-events-none">
                +
              </span>

              {/* Top Archival Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#191A2B]/10 dark:border-amber-200/10 mb-6 font-mono text-xs text-[#767C9D] dark:text-[#C8BCAA]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF684D] animate-pulse" />
                  <span className="text-[#FF684D] font-bold tracking-widest">
                    {activeMemory.plateCode}
                  </span>
                  <span className="hidden sm:inline">· ARCHIVAL PROOF</span>
                </div>
                <div className="tracking-widest uppercase text-[#C47A0D] dark:text-[#FFB93F] font-semibold">
                  {activeMemory.date}
                </div>
              </div>

              {/* Photographic Plate with Recessed Neumorphic Well */}
              <div className="neu-well p-2 rounded-2xl mb-8">
                <div
                  ref={imageFrameRef}
                  className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#0E0C09] group"
                >
                  <Image
                    src={activeMemory.image}
                    alt={activeMemory.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 700px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{ filter: 'sepia(0.12) contrast(1.03)' }}
                  />

                  {/* Subtle Photographic Grain & Corner Framing */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Plate Accession Watermark */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between font-mono text-[10px] text-white/90 uppercase tracking-widest">
                    <span className="px-2.5 py-1 rounded-sm bg-black/70 backdrop-blur-md border border-white/20">
                      35MM ANALOG HALIDE · SAFE ARCHIVE
                    </span>
                    <span className="hidden sm:inline text-white/70">
                      LAT 35°41&apos;N · PROOF VERIFIED
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Text Content Dossier */}
              <div ref={textContentRef} className="space-y-4">
                {/* Taxonomy Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeMemory.tags.map((t) => (
                    <span
                      key={t}
                      className="neu-well px-2.5 py-1 rounded-md font-mono text-[11px] text-[#FF684D] uppercase tracking-wider font-semibold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Monumental Editorial Title */}
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#191A2B] dark:text-[#F7F3EC] tracking-tight leading-snug">
                  {activeMemory.title}
                </h3>

                {/* Full Archival Inscription Note */}
                <blockquote className="neu-well relative px-5 py-4 rounded-xl border-l-2 border-l-[#FF684D] my-4 font-serif text-base sm:text-lg text-[#484C69] dark:text-[#C5CADB] leading-relaxed italic">
                  &ldquo;{activeMemory.fullNote}&rdquo;
                </blockquote>

                {/* Bottom Specimen Verification Footnote */}
                <div className="pt-4 border-t border-[#191A2B]/10 dark:border-amber-200/10 flex items-center justify-between font-mono text-[11px] text-[#767C9D] dark:text-[#C8BCAA] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <SparklesIcon size={12} className="text-[#39BFAE]" />
                    <span>PERMANENT VAULT ENCRYPTION VERIFIED</span>
                  </span>
                  <span>ECHOES № {activeMemory.index}</span>
                </div>
              </div>
            </NeumorphicCard>
          </div>

          {/* Right Column: Modern Interactive Awwwards Ledger */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#191A2B]/10 dark:border-amber-200/10">
                <span className="font-mono text-xs uppercase tracking-widest text-[#FF684D] font-bold">
                  COLLECTION LEDGER
                </span>
                <span className="font-mono text-xs text-[#767C9D] dark:text-[#C8BCAA]">
                  {filteredMemories.length} DEPOSITS IN VIEW
                </span>
              </div>

              {/* Ledger Items */}
              <div ref={ledgerListRef} className="space-y-3">
                {filteredMemories.map((mem) => {
                  const isSelected = activeMemory.id === mem.id;
                  return (
                    <button
                      key={mem.id}
                      type="button"
                      data-cursor="READ"
                      onClick={() => handleSelectMemory(mem)}
                      className={`group relative w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-300 flex items-start gap-4 cursor-pointer overflow-hidden ${
                        isSelected
                          ? 'neu-well ring-1 ring-[#FF684D]/70'
                          : 'neu-card hover:-translate-y-0.5 hover:translate-x-1'
                      }`}
                    >
                      {/* Active Indicator Accent Strip */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF684D]" />
                      )}

                      {/* Monospace Entry Index Number */}
                      <div className="shrink-0 font-mono text-sm sm:text-base font-bold text-[#767C9D] dark:text-[#C8BCAA] group-hover:text-[#FF684D] transition-colors pt-0.5">
                        {mem.index}
                      </div>

                      {/* Small Thumbnail Plate */}
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden shrink-0 bg-[#0E0C09] border border-black/10 dark:border-amber-200/10">
                        <Image
                          src={mem.image}
                          alt={mem.title}
                          fill
                          sizes="72px"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>

                      {/* Text Column */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-[10px] text-[#FF684D] uppercase tracking-wider font-semibold">
                            {mem.date}
                          </span>
                          <span className="font-mono text-[9px] text-[#767C9D] dark:text-[#C8BCAA] uppercase tracking-wider">
                            {mem.plateCode}
                          </span>
                        </div>

                        <h4
                          className={`font-serif text-base sm:text-lg leading-snug truncate transition-colors ${
                            isSelected
                              ? 'text-[#191A2B] dark:text-[#F7F3EC] font-semibold'
                              : 'text-[#191A2B] dark:text-[#F7F3EC] group-hover:text-[#FF684D]'
                          }`}
                        >
                          {mem.title}
                        </h4>

                        <p className="font-sans text-xs text-[#767C9D] dark:text-[#C8BCAA] line-clamp-1 mt-1 font-light leading-relaxed">
                          {mem.excerpt}
                        </p>
                      </div>

                      {/* Select Action Arrow Glyph */}
                      <div className="shrink-0 self-center hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity text-[#FF684D]">
                        <ArrowRightIcon size={14} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Archival Dossier Note */}
            <div className="neu-well mt-8 p-5 rounded-2xl font-mono text-xs text-[#484C69] dark:text-[#C8BCAA] leading-relaxed">
              <div className="flex items-center gap-2 text-[#FF684D] uppercase tracking-wider font-bold mb-2">
                <SparklesIcon size={13} />
                <span>ARCHIVAL CURATION GUARANTEE</span>
              </div>
              Every entry in your personal memory archive is preserved with signed Cloudinary
              originals, full-text semantic search, and dual-theme synchronization.
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default MemoryArchiveSection;
