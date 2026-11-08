'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import {
  SparklesIcon,
  ArrowRightIcon,
  BookOpenIcon,
  LockIcon,
  CompassIcon,
} from '@/components/icons/Icons';
import { gsap, isReducedMotion } from '@/lib/motion';

interface ProductView {
  id: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  route: string;
  features: string[];
  icon: React.ReactNode;
}

const PRODUCT_VIEWS: ProductView[] = [
  {
    id: 'journal',
    tabLabel: 'Memory Journal',
    title: 'The Inscription Journal',
    subtitle: 'Everyday Reflections Preserved as Permanent Heritage',
    description:
      'Organize your reflections in clean editorial typography. Search historical entries, filter by custom tags, and preserve multi-photo archival galleries with verified Cloudinary signatures.',
    image: '/images/product/product_memory_journal.webp',
    route: '/memories',
    features: [
      'Multi-photo uploads with signed URLs',
      'Full-text search & instant tag filtering',
      'Authentic deckle-edged layout',
      'Dual light and dark theme synchronization',
    ],
    icon: <BookOpenIcon size={16} />,
  },
  {
    id: 'capsule',
    tabLabel: 'Sealed Time Capsule',
    title: 'The Sealed Vault Chamber',
    subtitle: 'Server-Enforced Cryptographic Lockout',
    description:
      'Compose letters and attach photographs meant strictly for the future. The server enforces strict 403 Forbidden protection on sealed capsules—preventing premature access until the countdown reaches zero.',
    image: '/images/product/product_sealed_capsule.webp',
    route: '/capsules',
    features: [
      'Precision live countdown timer',
      'Permanent tamper-evident wax seal',
      'Zero-leakage encrypted messages',
      'Unsealing ritual with confirmation guard',
    ],
    icon: <LockIcon size={16} />,
  },
  {
    id: 'timeline',
    tabLabel: 'Unified Timeline',
    title: 'The Chronology Stream',
    subtitle: 'A Cohesive River of Past and Future Moments',
    description:
      'Experience your memories and locked capsules side-by-side in a single chronological stream. High-performance cursor pagination guarantees seamless scrolling across decades of personal history.',
    image: '/images/product/product_timeline.webp',
    route: '/timeline',
    features: [
      'Cursor-based efficient pagination',
      'Combined view of memories & capsules',
      'Instant type filtering pills',
      'Chronological milestone markers',
    ],
    icon: <CompassIcon size={16} />,
  },
];

export function ProductShowcaseSection() {
  const [activeTab, setActiveTab] = useState<ProductView>(PRODUCT_VIEWS[0]);
  const sectionRef = useRef<HTMLElement>(null);
  const browserFrameRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Browser Frame Entrance on Scroll
  useEffect(() => {
    if (typeof window === 'undefined' || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        browserFrameRef.current,
        { opacity: 0, y: 36, scale: 0.97 },
        {
          scrollTrigger: {
            trigger: browserFrameRef.current,
            start: 'top 80%',
          },
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.0,
          ease: 'power3.out',
        }
      );

      // Subtle Vertical Parallax Scrub
      gsap.to(browserFrameRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
        yPercent: -4,
        ease: 'none',
      });

      // Desktop 3D Perspective Tilt on Mouse Movement
      const frameEl = browserFrameRef.current;
      if (frameEl && window.innerWidth >= 1024) {
        const handleFrameMouseMove = (e: MouseEvent) => {
          const rect = frameEl.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;

          gsap.to(frameEl, {
            rotationY: x * 5,
            rotationX: -y * 5,
            transformPerspective: 1200,
            duration: 0.8,
            ease: 'power1.out',
            overwrite: 'auto',
          });
        };

        const handleFrameMouseLeave = () => {
          gsap.to(frameEl, {
            rotationY: 0,
            rotationX: 0,
            duration: 0.8,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        };

        frameEl.addEventListener('mousemove', handleFrameMouseMove);
        frameEl.addEventListener('mouseleave', handleFrameMouseLeave);

        return () => {
          frameEl.removeEventListener('mousemove', handleFrameMouseMove);
          frameEl.removeEventListener('mouseleave', handleFrameMouseLeave);
        };
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Animated Tab Transition
  const handleSelectTab = (view: ProductView) => {
    setActiveTab(view);

    if (isReducedMotion()) return;

    if (screenshotRef.current) {
      gsap.fromTo(
        screenshotRef.current,
        { opacity: 0.4, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
    if (detailsRef.current) {
      gsap.fromTo(
        detailsRef.current,
        { opacity: 0.4, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#EFE8DD] dark:bg-[#0B0C14] text-[#191A2B] dark:text-[#F7F3EC] py-24 sm:py-36 overflow-hidden border-b border-[#191A2B]/10 dark:border-white/10 transition-colors duration-300"
    >
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[800px] h-[500px] bg-[#4F66E8]/10 blur-[160px] pointer-events-none rounded-full" />

      <Container size="wide" className="relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-widest text-[#4F66E8] dark:text-[#39BFAE] mb-4 font-bold">
            <SparklesIcon size={14} />
            <span>THE REAL EXPERIENCE</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#191A2B] dark:text-[#F7F3EC] tracking-tight leading-tight">
            Genuine Craftsmanship.{' '}
            <span className="italic font-normal text-[#FF684D]">No Fabricated Mocks.</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#484C69] dark:text-[#A4AAC7] leading-relaxed mt-4 font-light">
            Every interface shown below is captured directly from the live Echoes application. Real
            databases, authenticated session guards, private media storage, and tactile UI
            components.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="mb-10 sm:mb-12">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {PRODUCT_VIEWS.map((view) => {
              const isSelected = activeTab.id === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => handleSelectTab(view)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#191A2B] dark:bg-white text-white dark:text-[#191A2B] shadow-[0_8px_20px_rgba(25,26,43,0.18)] font-bold scale-[1.02]'
                      : 'bg-white/80 dark:bg-white/5 text-[#484C69] dark:text-[#A4AAC7] hover:bg-white dark:hover:bg-white/10 border border-[#191A2B]/10 dark:border-white/10'
                  }`}
                >
                  <span>{view.icon}</span>
                  <span>{view.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Architectural Browser Frame */}
        <div
          ref={browserFrameRef}
          className="rounded-2xl bg-white dark:bg-[#141524] border border-[#191A2B]/15 dark:border-white/15 overflow-hidden shadow-[0_25px_60px_rgba(25,26,43,0.12)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] will-change-transform"
        >
          {/* Architectural Browser Chrome Bar */}
          <div className="h-11 bg-[#F7F3EC] dark:bg-[#090A11] px-5 border-b border-[#191A2B]/10 dark:border-white/10 flex items-center justify-between">
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF684D]" />
              <span className="w-3 h-3 rounded-full bg-[#FFB93F]" />
              <span className="w-3 h-3 rounded-full bg-[#B7DB50]" />
            </div>

            {/* URL Indicator */}
            <div className="px-6 py-1 rounded-md bg-white/70 dark:bg-white/5 border border-[#191A2B]/10 dark:border-white/10 font-mono text-[11px] text-[#484C69] dark:text-[#A4AAC7] truncate max-w-xs sm:max-w-md">
              https://echoes.vault{activeTab.route}
            </div>

            {/* Live Indicator */}
            <div className="font-mono text-[10px] text-[#39BFAE] uppercase tracking-wider hidden sm:block font-bold">
              ● LIVE APPLICATION
            </div>
          </div>

          {/* High-Resolution Screenshot Canvas */}
          <div
            ref={screenshotRef}
            className="relative aspect-[16/10] bg-black/10 overflow-hidden will-change-transform"
          >
            <Image
              src={activeTab.image}
              alt={activeTab.title}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-top"
            />
          </div>

          {/* Showcase Editorial Details Bar */}
          <div
            ref={detailsRef}
            className="p-6 sm:p-10 bg-white dark:bg-[#141524] border-t border-[#191A2B]/10 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 will-change-transform"
          >
            <div className="max-w-2xl">
              <div className="font-mono text-xs text-[#FF684D] uppercase tracking-widest mb-1 font-bold">
                {activeTab.subtitle}
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#191A2B] dark:text-[#F7F3EC] mb-3">
                {activeTab.title}
              </h3>
              <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] leading-relaxed mb-6 font-light">
                {activeTab.description}
              </p>

              {/* Feature Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs text-[#191A2B] dark:text-[#F7F3EC]">
                {activeTab.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2">
                    <span className="text-[#39BFAE] font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Link to real route */}
            <div className="shrink-0">
              <Link href={activeTab.route}>
                <Button
                  variant="coral"
                  size="lg"
                  icon={<ArrowRightIcon size={16} />}
                  className="w-full sm:w-auto"
                >
                  Open Live {activeTab.title.split(' ')[1] || 'Module'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ProductShowcaseSection;
