'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import {
  CompassIcon,
  ArrowRightIcon,
  FeatherIcon,
  CameraIcon,
  LockIcon,
  SparklesIcon,
} from '@/components/icons/Icons';
import { gsap, isReducedMotion } from '@/lib/motion';

interface TimelineMilestone {
  year: string;
  badge: string;
  title: string;
  description: string;
  type: 'memory' | 'capsule' | 'milestone';
  icon: React.ReactNode;
  artifactImage: string;
  artifactCaption: string;
}

const MILESTONES: TimelineMilestone[] = [
  {
    year: '2026 · GENESIS',
    badge: 'FIRST WORDS DEPOSITED',
    title: 'The Silent Sanctuary',
    description:
      'You open the vault and record your first memory. The baseline of who you were when the journey began.',
    type: 'memory',
    icon: <FeatherIcon size={16} />,
    artifactImage: '/images/architecture/arch_sunlight_interior.webp',
    artifactCaption: 'CEDAR MULLIONS · MORNING LIGHT',
  },
  {
    year: '2026 · AUTUMN',
    badge: '35MM NEGATIVE ARCHIVED',
    title: 'Photographic Proof of Morning Light',
    description:
      'A quiet morning captured on analog film. Stored with signed metadata and private Cloudinary preservation.',
    type: 'memory',
    icon: <CameraIcon size={16} />,
    artifactImage: '/images/photography/photo_vintage_camera.webp',
    artifactCaption: 'MECHANICAL RANGEFINDER · 400 ISO',
  },
  {
    year: '2027 · SEALED',
    badge: 'CRYPTOGRAPHIC TIME CAPSULE',
    title: 'Letter to Future Self Locked',
    description:
      'Sealed under digital molten coral wax. The server locks the vault until the turn of the decade.',
    type: 'capsule',
    icon: <LockIcon size={16} />,
    artifactImage: '/images/objects/object_brass_capsule.webp',
    artifactCaption: 'BRASS TIME CAPSULE · HERMETIC SEAL',
  },
  {
    year: '2031 · HORIZON',
    badge: 'FIVE-YEAR RECOLLECTION',
    title: 'The World Has Altered',
    description:
      'Your thoughts from 2026 are revisited from the perspective of five accumulated years of personal growth.',
    type: 'milestone',
    icon: <CompassIcon size={16} />,
    artifactImage: '/images/landscapes/landscape_golden_lake.webp',
    artifactCaption: 'GOLDEN LAKE · FIVE-YEAR HORIZON',
  },
  {
    year: '2036 · MATURITY',
    badge: 'DECADE VAULT UNSEALED',
    title: 'Ten-Year Reflections Delivered',
    description:
      'The seal is broken. Words written across a decade arrive as an intimate greeting from your past.',
    type: 'capsule',
    icon: <SparklesIcon size={16} />,
    artifactImage: '/images/photography/photo_hands_letter.webp',
    artifactCaption: 'DECADE CORRESPONDENCE · REVEALED',
  },
];

export function ChronologySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 1. Serpentine Timeline Spine Progressive Scroll Reveal
      gsap.fromTo(
        spineRef.current,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          scrollTrigger: {
            trigger: itemsContainerRef.current,
            start: 'top 75%',
            end: 'bottom 85%',
            scrub: 0.8,
          },
          ease: 'none',
        }
      );

      // 2. Alternating Row Elements Entrance
      if (itemsContainerRef.current) {
        const rows = Array.from(itemsContainerRef.current.children);
        rows.forEach((row, index) => {
          const isEven = index % 2 === 0;
          const card = row.querySelector('.milestone-card');
          const artifact = row.querySelector('.milestone-artifact');
          const node = row.querySelector('.milestone-node');

          if (card) {
            gsap.fromTo(
              card,
              { opacity: 0, x: isEven ? -30 : 30, y: 15 },
              {
                scrollTrigger: {
                  trigger: row,
                  start: 'top 82%',
                },
                opacity: 1,
                x: 0,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
              }
            );
          }

          if (artifact) {
            gsap.fromTo(
              artifact,
              { opacity: 0, scale: 0.94 },
              {
                scrollTrigger: {
                  trigger: row,
                  start: 'top 82%',
                },
                opacity: 1,
                scale: 1,
                duration: 0.8,
                delay: 0.1,
                ease: 'power2.out',
              }
            );

            gsap.to(artifact, {
              scrollTrigger: {
                trigger: row,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2,
              },
              yPercent: isEven ? -6 : 6,
              ease: 'none',
            });
          }

          if (node) {
            gsap.fromTo(
              node,
              { scale: 0.5, opacity: 0 },
              {
                scrollTrigger: {
                  trigger: row,
                  start: 'top 82%',
                },
                scale: 1,
                opacity: 1,
                duration: 0.5,
                ease: 'back.out(2)',
              }
            );
          }
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#F7F3EC] dark:bg-[#151726] text-[#191A2B] dark:text-[#F7F3EC] py-24 sm:py-36 overflow-hidden border-b border-[#191A2B]/10 dark:border-white/10 transition-colors duration-300"
    >
      <Container size="wide" className="relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 sm:mb-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-widest text-[#FF684D] mb-4 font-bold">
              <CompassIcon size={14} />
              <span>INFINITE CHRONOLOGY</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#191A2B] dark:text-[#F7F3EC] tracking-tight leading-tight">
              A Serpentine River.{' '}
              <span className="italic font-normal text-[#4F66E8] dark:text-[#39BFAE]">
                Weaving Through Time.
              </span>
            </h2>
          </div>

          <div>
            <Link href="/timeline">
              <Button
                variant="outline"
                size="md"
                icon={<ArrowRightIcon size={16} />}
                className="border-[#191A2B]/20 dark:border-white/20 text-[#191A2B] dark:text-[#F7F3EC] hover:bg-[#191A2B] hover:text-[#F7F3EC] dark:hover:bg-white dark:hover:text-[#191A2B]"
              >
                Explore Live Timeline
              </Button>
            </Link>
          </div>
        </div>

        {/* Timeline Spine Composition */}
        <div className="relative max-w-5xl mx-auto">
          {/* Central Serpentine Spine Vector SVG */}
          <div
            ref={spineRef}
            className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-80 pointer-events-none hidden lg:block opacity-90 will-change-transform"
            aria-hidden="true"
          >
            <Image
              src="/images/illustrations/spine_chronology_connector.svg"
              alt=""
              fill
              className="object-contain"
            />
          </div>

          {/* Mobile Linear Vertical Guide Line */}
          <div
            className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#FF684D] via-[#39BFAE] to-[#191A2B] dark:to-white/20 lg:hidden"
            aria-hidden="true"
          ></div>

          {/* Milestone Items List with Alternating Cards & Photographic Artifacts */}
          <div ref={itemsContainerRef} className="space-y-16 sm:space-y-24 relative z-10">
            {MILESTONES.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <div
                  key={item.badge}
                  className={`flex flex-col lg:flex-row items-center ${
                    isEven ? 'lg:flex-row-reverse' : ''
                  } gap-6 sm:gap-10 pl-12 lg:pl-0`}
                >
                  {/* Text Milestone Card */}
                  <div className="w-full lg:w-5/12">
                    <div className="milestone-card rounded-2xl bg-white dark:bg-[#1E2135] p-6 sm:p-8 border border-[#191A2B]/10 dark:border-white/10 shadow-[0_8px_24px_rgba(25,26,43,0.04)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300 will-change-transform">
                      <div className="flex items-center justify-between pb-3 border-b border-[#191A2B]/10 dark:border-white/10 mb-4">
                        <span className="font-mono text-xs font-bold text-[#FF684D] tracking-wider uppercase">
                          {item.year}
                        </span>
                        <span className="p-1.5 rounded-lg bg-[#191A2B]/5 dark:bg-white/10 text-[#191A2B] dark:text-[#F7F3EC]">
                          {item.icon}
                        </span>
                      </div>

                      <div className="font-mono text-[10px] text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-widest mb-1">
                        {item.badge}
                      </div>

                      <h3 className="font-serif text-xl sm:text-2xl text-[#191A2B] dark:text-[#F7F3EC] mb-2 font-medium">
                        {item.title}
                      </h3>

                      <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] leading-relaxed font-light">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Desktop Middle Node Disc */}
                  <div className="hidden lg:flex w-2/12 justify-center items-center">
                    <div className="milestone-node w-10 h-10 rounded-full bg-[#191A2B] dark:bg-[#39BFAE] border-2 border-white dark:border-[#191A2B] shadow-md flex items-center justify-center text-white dark:text-[#191A2B] text-xs font-mono font-bold will-change-transform">
                      0{index + 1}
                    </div>
                  </div>

                  {/* Opposite Column: Archival Photographic Artifact (No Empty Space) */}
                  <div className="w-full lg:w-5/12">
                    <div className="milestone-artifact rounded-2xl bg-white/70 dark:bg-[#1E2135]/60 p-3 sm:p-4 border border-[#191A2B]/10 dark:border-white/10 shadow-[0_6px_20px_rgba(25,26,43,0.03)] dark:shadow-md will-change-transform">
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black/10 mb-3">
                        <Image
                          src={item.artifactImage}
                          alt={item.artifactCaption}
                          fill
                          sizes="(max-width: 1024px) 100vw, 400px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px] text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider">
                        <span>{item.artifactCaption}</span>
                        <span className="text-[#FF684D]">ARCHIVAL PLATE</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ChronologySection;
