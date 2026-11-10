'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { LockIcon, ArrowRightIcon, CheckIcon } from '@/components/icons/Icons';
import { NeumorphicCard } from '@/components/landing/NeumorphicCard';
import { gsap, isReducedMotion } from '@/lib/motion';

interface MilestoneOption {
  year: number;
  label: string;
  duration: string;
  rotation: number;
  description: string;
}

const MILESTONES: MilestoneOption[] = [
  {
    year: 2027,
    label: '1 Year Horizon',
    duration: '365 Days',
    rotation: 45,
    description:
      'A brief interlude. Reflect on the quiet transformations of a single calendar year.',
  },
  {
    year: 2030,
    label: '4 Years · Turn of Decade',
    duration: '1,460 Days',
    rotation: 125,
    description: 'A major life waypoint. Who will you be when this seal is finally broken?',
  },
  {
    year: 2035,
    label: '9 Years · Deep Horizon',
    duration: '3,285 Days',
    rotation: 215,
    description:
      'Preserve today’s unspoken fears and hopes for a future self in a different decade.',
  },
  {
    year: 2040,
    label: 'Centennial Vault Epoch',
    duration: '5,110 Days',
    rotation: 305,
    description: 'The furthest celestial lock. Archival letters written across generations.',
  },
];

export function SealingChamberSection() {
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneOption>(MILESTONES[1]);
  const [isSimulatingSeal, setIsSimulatingSeal] = useState(false);
  const [sealSuccess, setSealSuccess] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const dialPodiumRef = useRef<HTMLDivElement>(null);
  const astrolabeRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const yearTextRef = useRef<HTMLSpanElement>(null);
  const sealStampRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);

  // Astrolabe Continuous Ambient Rotation & Scroll Scrub
  useEffect(() => {
    if (typeof window === 'undefined' || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      // Continuous ambient rotation
      gsap.to(astrolabeRef.current, {
        rotation: 360,
        duration: 90,
        repeat: -1,
        ease: 'none',
      });

      // Scroll-driven astrolabe podium float (keeps central EPOCH disc upright)
      gsap.to(dialPodiumRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.0,
        },
        yPercent: -7,
        ease: 'none',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Needle Kinetic Rotation on Milestone Change
  const handleSelectMilestone = (item: MilestoneOption) => {
    setSelectedMilestone(item);
    setSealSuccess(false);

    if (isReducedMotion()) return;

    if (needleRef.current) {
      gsap.to(needleRef.current, {
        rotation: item.rotation,
        duration: 1.0,
        ease: 'back.out(1.4)',
        overwrite: 'auto',
      });
    }

    if (yearTextRef.current) {
      gsap.fromTo(
        yearTextRef.current,
        { scale: 0.8, opacity: 0.2 },
        { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }
      );
    }
  };

  // Authentic Sealing Ceremony Simulation
  const handleSimulateSeal = () => {
    setIsSimulatingSeal(true);
    setSealSuccess(false);

    setTimeout(() => {
      setIsSimulatingSeal(false);
      setSealSuccess(true);

      if (!isReducedMotion()) {
        if (sealStampRef.current) {
          gsap.fromTo(
            sealStampRef.current,
            { y: -50, scaleY: 1.25, scaleX: 0.8, opacity: 0 },
            { y: 0, scaleY: 1, scaleX: 1, opacity: 1, duration: 0.65, ease: 'bounce.out' }
          );
        }

        if (flareRef.current) {
          gsap.fromTo(
            flareRef.current,
            { scale: 0.4, opacity: 0.9 },
            { scale: 2.2, opacity: 0, duration: 0.9, ease: 'power2.out' }
          );
        }
      }
    }, 850);
  };

  return (
    <section
      ref={sectionRef}
      id="chamber"
      className="film-grain relative bg-[#E7DEC8] dark:bg-[#12100D] text-[#191A2B] dark:text-[#F7F3EC] py-24 sm:py-36 overflow-hidden border-b border-[#191A2B]/10 dark:border-amber-200/10 transition-colors duration-300"
    >
      {/* Background Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#FFB93F]/10 dark:bg-[#FFB93F]/10 blur-[160px] pointer-events-none rounded-full" />

      <Container size="wide" className="relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-widest text-[#FF684D] mb-4 font-bold">
            <LockIcon size={14} />
            <span>THE TIME CAPSULE SEALING CHAMBER</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#191A2B] dark:text-[#F7F3EC] tracking-tight leading-tight">
            Cryptographic Sealing.{' '}
            <span className="italic font-normal text-[#FF684D]">Letters Across Time.</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#484C69] dark:text-[#C8BCAA] leading-relaxed mt-4 font-light">
            A time capsule is a solemn pact with the future. You deposit your letters, calibrate the
            astronomical dial, and pour digital molten wax. The vault enforces strict mathematical
            lockout until the designated year arrives.
          </p>
        </div>

        {/* Ceremonial Altar Composition: Astrolabe Dial + Sealing Altar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Astronomical Astrolabe Dial */}
          <div className="lg:col-span-6 flex justify-center">
            <div
              ref={dialPodiumRef}
              className="neu-card relative w-72 sm:w-96 aspect-square rounded-full p-5 sm:p-7 flex items-center justify-center will-change-transform"
            >
              <div className="neu-well relative w-full h-full rounded-full p-3 flex items-center justify-center">
                {/* Rotating Astrolabe SVG */}
                <div ref={astrolabeRef} className="relative w-full h-full will-change-transform">
                  <Image
                    src="/images/illustrations/dial_temporal_astrolabe.svg"
                    alt="Antique mechanical astrolabe temporal dial"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Kinetic Needle */}
              <div
                ref={needleRef}
                className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform"
                style={{
                  transform: `rotate(${selectedMilestone.rotation}deg)`,
                }}
                aria-hidden="true"
              >
                <div className="w-1.5 h-1/2 bg-gradient-to-t from-transparent via-[#FF684D] to-[#F7D84B] rounded-full shadow-[0_0_12px_#FF684D] -translate-y-1/2" />
              </div>

              {/* Central Year Disc */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-[#191A2B] text-white border border-[#F7D84B]/40 flex flex-col items-center justify-center text-center p-2 shadow-2xl">
                  <span className="font-mono text-[9px] text-[#C8BCAA] uppercase">EPOCH</span>
                  <span
                    ref={yearTextRef}
                    className="font-serif text-xl text-[#F7D84B] font-bold will-change-transform"
                  >
                    {selectedMilestone.year}
                  </span>
                </div>
              </div>

              {/* Shockwave Flare */}
              <div
                ref={flareRef}
                className="absolute inset-0 rounded-full border border-[#FF684D] pointer-events-none opacity-0 will-change-transform"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Right Column: Ceremonial Parchment Dossier */}
          <div className="lg:col-span-6">
            <NeumorphicCard spotlight className="rounded-2xl p-6 sm:p-10">
              <div className="flex items-center justify-between pb-4 border-b border-[#191A2B]/10 dark:border-amber-200/10 mb-6">
                <span className="font-mono text-xs uppercase tracking-widest text-[#FF684D] font-bold">
                  CALIBRATE TEMPORAL HORIZON
                </span>
                <span className="font-mono text-xs text-[#767C9D] dark:text-[#C8BCAA]">
                  {selectedMilestone.duration} LOCKED
                </span>
              </div>

              {/* Tactile Milestone Horizon Selectors */}
              <div className="grid grid-cols-2 gap-3.5 mb-6">
                {MILESTONES.map((item) => {
                  const isCurrent = selectedMilestone.year === item.year;
                  return (
                    <button
                      key={item.year}
                      type="button"
                      data-cursor="DIAL"
                      onClick={() => handleSelectMilestone(item)}
                      className={`p-3.5 rounded-xl text-left cursor-pointer ${
                        isCurrent
                          ? 'neu-pill-active text-[#191A2B] dark:text-white ring-1 ring-[#FF684D]/70'
                          : 'neu-pill text-[#484C69] dark:text-[#C8BCAA]'
                      }`}
                    >
                      <div className="font-serif text-lg text-[#191A2B] dark:text-[#F7F3EC] font-medium">
                        {item.year}
                      </div>
                      <div className="font-mono text-[10px] text-[#FF684D] uppercase tracking-wider">
                        {item.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Milestone Reflection Quote */}
              <div className="neu-well p-4 rounded-xl mb-8">
                <p className="font-serif text-sm text-[#484C69] dark:text-[#C8BCAA] leading-relaxed italic">
                  &ldquo;{selectedMilestone.description}&rdquo;
                </p>
              </div>

              {/* Interactive Sealing Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button
                  variant="coral"
                  size="md"
                  onClick={handleSimulateSeal}
                  loading={isSimulatingSeal}
                  icon={sealSuccess ? <CheckIcon size={16} /> : <LockIcon size={16} />}
                  className="w-full sm:w-auto"
                >
                  {sealSuccess
                    ? 'Chamber Cryptographically Locked'
                    : `Simulate Sealing for ${selectedMilestone.year}`}
                </Button>

                <Link href="/capsules/new" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="md"
                    icon={<ArrowRightIcon size={14} />}
                    className="w-full sm:w-auto border-[#191A2B]/20 dark:border-white/20 text-[#191A2B] dark:text-[#F7F3EC] hover:bg-[#191A2B]/5 dark:hover:bg-white/10"
                  >
                    Seal Actual Capsule
                  </Button>
                </Link>
              </div>

              {/* Molten Wax Seal Graphic Feedback */}
              {sealSuccess && (
                <div
                  ref={sealStampRef}
                  className="neu-well mt-6 p-4 rounded-xl border border-[#39BFAE]/35 flex items-center gap-4 will-change-transform"
                >
                  <div className="relative w-12 h-12 shrink-0">
                    <Image
                      src="/images/cutouts/cutout_wax_seal_hot.webp"
                      alt="Hot molten wax seal"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-serif text-sm font-semibold text-[#1F8A7E] dark:text-[#FFB93F]">
                      SEAL APPLIED UNDER VAULT PROTOCOL
                    </div>
                    <div className="font-mono text-[11px] text-[#484C69] dark:text-[#C8BCAA]">
                      Locked until January 1, {selectedMilestone.year}. Zero-knowledge server
                      protection active.
                    </div>
                  </div>
                </div>
              )}
            </NeumorphicCard>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default SealingChamberSection;
