'use client';

import React, { useState } from 'react';
import { Container, Section } from '@/components/layout/Container';
import { EditorialHeader } from '@/components/layout/EditorialHeader';
import { Heading, Text, Kicker, Quote } from '@/components/ui/Typography';
import { Button, EditorialLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, MemoryCard, CapsuleTeaserCard } from '@/components/ui/Card';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { Input, Textarea, Toggle } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { MemoryOrb } from '@/components/canvas/MemoryOrb';
import { SunDisk } from '@/components/ui/SunDisk';
import { PosterPanel } from '@/components/ui/PosterPanel';
import { ArchitecturalFrame } from '@/components/ui/ArchitecturalFrame';
import { DecorativeCutout } from '@/components/ui/DecorativeCutout';
import { ArchivalStamp } from '@/components/ui/ArchivalStamp';
import { PhotoCollage } from '@/components/ui/PhotoCollage';
import { HybridSection } from '@/components/ui/HybridSection';
import { FloatingSticker } from '@/components/ui/FloatingSticker';
import { SurrealPhotoCard } from '@/components/ui/SurrealPhotoCard';
import { EditorialMarquee } from '@/components/ui/EditorialMarquee';
import { SurrealObjectFloat } from '@/components/ui/SurrealObjectFloat';
import {
  FeatherIcon,
  LockIcon,
  SparklesIcon,
  CalendarIcon,
  CameraIcon,
} from '@/components/icons/Icons';

export default function ShowcasePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleVal, setToggleVal] = useState(true);
  const [inputText, setInputText] = useState('Autumn Rain, 1998');
  const [textareaText, setTextareaText] = useState(
    'A quiet afternoon under cedar eaves while rain softened the gravel path. Remember the smell of damp pine and tea.'
  );

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink transition-colors duration-300">
      <EditorialHeader />

      <main className="flex-1">
        {/* Hero Section: Vintage Travel Poster & Architectural Composition */}
        <Section spacing="lg" className="border-b border-border-hairline overflow-hidden">
          <Container size="wide">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              {/* Asymmetric Vertical Poster Banner */}
              <div className="hidden lg:flex lg:col-span-2 rounded-sm overflow-hidden">
                <PosterPanel
                  title="REMEMBRANCE"
                  subtitle="ECHOES · NOSTALGIA"
                  location="CHRONICLE"
                  coordinates="TEMPORAL INDEX · ARCHIVE № 01"
                  variant="terracotta"
                  className="w-full h-full"
                />
              </div>

              {/* Main Architectural Hero Focus */}
              <div className="lg:col-span-10 flex flex-col justify-between p-8 sm:p-12 md:p-14 bg-paper-warm border border-border-hairline rounded-sm relative overflow-hidden shadow-paper">
                {/* Terracotta Sun Disk in Upper Right */}
                <div className="absolute -top-6 -right-6 sm:top-6 sm:right-8 z-10 pointer-events-none">
                  <SunDisk size="poster" glow={true} />
                </div>

                <div className="relative z-20 max-w-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <Kicker numeral="CREATIVE DIRECTION">Cinematic Editorial Nostalgia</Kicker>
                    <span className="font-mono text-xs text-terracotta">·</span>
                    <span className="font-mono text-[11px] text-ink-muted uppercase tracking-widest">
                      SERIES 01 · TIME-LOCKED VAULT
                    </span>
                  </div>

                  <Heading level={1} variant="display" italic className="mb-4">
                    Someone was here. Traces remain.
                  </Heading>

                  <p className="font-condensed text-2xl sm:text-3xl font-semibold uppercase tracking-[0.15em] text-terracotta mb-6">
                    A SANCTUARY FOR PRIVATE MEMORIES & TIME-LOCKED LETTERS
                  </p>

                  <Text variant="lead" muted className="max-w-xl mb-8">
                    Synthesizing vintage travel poster typography, natural sunlight, long
                    architectural shadows, and 35mm film photography into an intimate digital
                    archive.
                  </Text>

                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="primary" icon={<FeatherIcon size={16} />}>
                      Preserve Memory
                    </Button>
                    <Button
                      variant="paper"
                      onClick={() => setModalOpen(true)}
                      icon={<SparklesIcon size={16} className="text-terracotta" />}
                    >
                      Design System Specs
                    </Button>
                    <Button variant="capsule" icon={<LockIcon size={14} />}>
                      Seal Time Capsule
                    </Button>
                  </div>
                </div>

                {/* Bottom Architectural Metadata Strip */}
                <div className="relative z-20 mt-12 pt-6 border-t border-border-hairline flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-ink-muted uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-terracotta" />
                    <span>PLATE 01 · CEDAR & DUST</span>
                  </div>
                  <div>ARCHIVAL REPOSITORY № 08</div>
                  <div className="text-terracotta font-semibold">189 VERIFIED TESTS PASSED</div>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* =========================================================================
            STAGE 1: PLAYFUL SURREALISM · EXPERIMENTAL EDITORIAL FOUNDATION
            ========================================================================= */}
        <EditorialMarquee
          items={[
            'PLAYFUL SURREALISM',
            'DIGITAL MEMORY VAULT',
            'TIME CAPSULE ARCHIVE',
            'EXPERIMENTAL EDITORIAL',
            'HYBRID LIGHT/DARK',
            'VIBRANT CONTEMPORARY',
            'SERVER-ENFORCED LOCK',
          ]}
          colorScheme="lime-midnight"
          speed="normal"
        />

        {/* Section 0: Playful Surrealism Design System & Color Tokens */}
        <HybridSection
          environment="cream"
          grain={true}
          crosshairs={true}
          className="py-16 sm:py-20 border-b border-[#191A2B]/15"
        >
          <Container size="wide">
            <div className="flex flex-col gap-3 mb-10 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <FloatingSticker color="coral" rotate={-2} pin={true}>
                  STAGE 1 APPROVED
                </FloatingSticker>
                <FloatingSticker color="cobalt" rotate={1}>
                  PLAYFUL SURREALISM
                </FloatingSticker>
                <FloatingSticker color="lime" rotate={-1}>
                  EXPERIMENTAL EDITORIAL
                </FloatingSticker>
              </div>

              <Heading level={2} variant="display" className="mt-2">
                Locked 9-Color System & Reusable Primitives
              </Heading>

              <Text variant="lead" muted>
                A high-contrast contemporary palette built for intentional hybrid light and dark
                environments. Exceptional visual expression combined with strict everyday usability.
              </Text>
            </div>

            {/* 1. Palette Swatch Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3.5 mb-14">
              {[
                {
                  name: 'Electric Coral',
                  hex: '#FF684D',
                  text: 'white',
                  role: 'Primary Accent & Action',
                },
                {
                  name: 'Tangerine',
                  hex: '#FFB93F',
                  text: '#191A2B',
                  role: 'Warm Highlight & Glow',
                },
                {
                  name: 'Dream Pink',
                  hex: '#F3A9D5',
                  text: '#191A2B',
                  role: 'Surreal Tint & Soft Pill',
                },
                {
                  name: 'Cobalt Blue',
                  hex: '#4F66E8',
                  text: 'white',
                  role: 'Structural Contrast & Links',
                },
                {
                  name: 'Acid Lime',
                  hex: '#B7DB50',
                  text: '#191A2B',
                  role: 'High-Energy Metadata Pill',
                },
                {
                  name: 'Vibrant Teal',
                  hex: '#39BFAE',
                  text: '#191A2B',
                  role: 'Fluid Memory Tags',
                },
                {
                  name: 'Midnight',
                  hex: '#191A2B',
                  text: '#F7F3EC',
                  role: 'Cinematic Dark Canvas',
                },
                {
                  name: 'Warm Cream',
                  hex: '#F7F3EC',
                  text: '#191A2B',
                  role: 'Editorial Light Foundation',
                },
                {
                  name: 'Solar Yellow',
                  hex: '#F7D84B',
                  text: '#191A2B',
                  role: 'Capsule Unlock Indicator',
                },
              ].map((c) => (
                <div
                  key={c.hex}
                  className="p-3.5 rounded-sm border-2 border-[#191A2B] sticker-shadow flex flex-col justify-between h-36 transition-transform hover:-translate-y-1"
                  style={{ backgroundColor: c.hex, color: c.text }}
                >
                  <span className="font-mono text-xs font-bold uppercase">{c.hex}</span>
                  <div>
                    <span className="font-sans font-bold text-xs block leading-tight">
                      {c.name}
                    </span>
                    <span className="font-mono text-[9px] opacity-80 block mt-1 leading-tight">
                      {c.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Hybrid Light/Dark Contrast Environments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">
              {/* Light Environment Demonstration */}
              <div className="bg-[#FFFFFF] border-2 border-[#191A2B] rounded-sm p-7 sticker-shadow text-[#191A2B]">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="coral">LIGHT ENVIRONMENT</Badge>
                  <span className="font-mono text-xs text-[#767C9D]">
                    Warm Cream Canvas · Midnight Ink
                  </span>
                </div>
                <Heading level={3} variant="title" className="mb-3 text-[#191A2B]">
                  Approachable & Crisp Reading Space
                </Heading>
                <Text variant="body" className="mb-6 text-[#484C69]">
                  Clear, uncluttered editorial typographic layout designed for comfortable long-form
                  memory reflection, journal entry, and timeline exploration.
                </Text>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="coral" size="sm">
                    Coral Action
                  </Button>
                  <Button variant="cobalt" size="sm">
                    Cobalt Focus
                  </Button>
                  <Button variant="lime" size="sm">
                    Acid Lime
                  </Button>
                  <Button variant="cream" size="sm">
                    Cream Ghost
                  </Button>
                </div>
              </div>

              {/* Dark Environment Demonstration */}
              <div className="bg-[#191A2B] border-2 border-white/20 rounded-sm p-7 sticker-shadow-coral text-[#F7F3EC] dark">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="yellow">DARK ENVIRONMENT</Badge>
                  <span className="font-mono text-xs text-[#C5CAE8]">
                    Midnight Canvas · Warm Cream Ink
                  </span>
                </div>
                <Heading level={3} variant="title" className="mb-3 text-[#F7F3EC]">
                  Cinematic Vault & Temporal Sealing
                </Heading>
                <Text variant="body" className="mb-6 text-[#C5CAE8]">
                  Atmospheric, surreal nocturnal environment dedicated to locked time capsules,
                  secret correspondence, and dramatic photographic retrospectives.
                </Text>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="sticker" size="sm">
                    Solar Milestone
                  </Button>
                  <Button variant="coral" size="sm">
                    Seal Letter
                  </Button>
                  <Button variant="cobalt" size="sm">
                    Deep Orbit
                  </Button>
                  <Button variant="midnight" size="sm">
                    Dark Basalt
                  </Button>
                </div>
              </div>
            </div>

            {/* 3. Playful Surrealism Photographic Primitives */}
            <div className="flex flex-col gap-3 mb-6">
              <Kicker numeral="NEW PRIMITIVE">SurrealPhotoCard & Floating Objects</Kicker>
              <Heading level={3} variant="headline">
                Asymmetric Offsets & Floating Cutouts
              </Heading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <SurrealPhotoCard
                src="/images/photography/photo_vintage_camera.webp"
                alt="Vintage Rangefinder Camera"
                title="Analog 35mm Rangefinder"
                date="CIRCA 1974"
                tag="ARCHIVAL"
                backdropColor="coral"
                badgeText="PLATE № 04"
                aspectRatio="portrait"
              />

              <div className="relative flex flex-col items-center justify-center p-8 bg-[#FAF6EF] border-2 border-[#191A2B] rounded-sm min-h-[380px] sticker-shadow">
                <SurrealObjectFloat
                  src="/images/cutouts/cutout_wax_seal.webp"
                  alt="Wax Seal Cutout"
                  width={140}
                  height={140}
                  floatVariant="gentle"
                  glowColor="coral"
                />
                <FloatingSticker color="lime" rotate={2} className="mt-6">
                  INVIOLABLE DATE-LOCK
                </FloatingSticker>
                <span className="font-mono text-xs text-[#767C9D] mt-2">
                  Transparent Alpha Cutout
                </span>
              </div>

              <SurrealPhotoCard
                src="/images/landscapes/landscape_golden_lake.webp"
                alt="Golden Sunlit Lake"
                title="Morning Solitude at Lake Serene"
                date="AUTUMN 2024"
                tag="LANDSCAPE"
                backdropColor="cobalt"
                badgeText="TEMPORAL 09"
                aspectRatio="portrait"
              />
            </div>
          </Container>
        </HybridSection>

        {/* Section 1: Architectural Frame Feature (Inspired by Reference Imagery) */}
        <Section spacing="md" className="border-b border-border-hairline">
          <Container size="standard">
            <div className="flex flex-col gap-2 mb-8">
              <Kicker numeral="01">Architectural Light & Shadow</Kicker>
              <Heading level={2} variant="headline">
                Quiet Interiors & Misty Horizons
              </Heading>
              <Text variant="body" muted>
                Photographic layouts featuring natural sunlight raking across textured plaster,
                empty chairs, and morning mist.
              </Text>
            </div>

            <ArchitecturalFrame
              imageSrc="/images/architecture/arch_sunlight_interior.webp"
              alt="Misty mountain valley and architectural interior"
              quote="SOMEONE WAS HERE."
              author="TRACES REMAIN. SILENCE HOLDS."
              kicker="VISUAL PSALMS · QUIET WORLDS"
              caption="Morning mist rising over sacred cedar hills. Golden sunlight entering through floor-to-ceiling glass."
              coordinates="CHRONICLE PLATE · ARCHIVE № 08"
              showSun={true}
            />
          </Container>
        </Section>

        {/* Section 2: Typography & Poster Rhythm */}
        <Section spacing="md" className="border-b border-border-hairline">
          <Container size="standard">
            <div className="flex flex-col gap-2 mb-8">
              <Kicker numeral="02">Dramatic Typography System</Kicker>
              <Heading level={2} variant="headline">
                Monumental Serif & Bold Condensed Posters
              </Heading>
              <Text variant="body" muted>
                A high-contrast typographic pairing: oversized condensed uppercase for architectural
                landmarks and classical serif for contemplative prose.
              </Text>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Condensed Poster Type Showcase */}
              <div className="lg:col-span-7 flex flex-col gap-6 p-8 bg-paper-warm border border-border-hairline rounded-sm">
                <div>
                  <span className="font-mono text-[10px] uppercase text-terracotta tracking-widest block mb-1">
                    Condensed Poster Title · Oswald / Bebas Neue
                  </span>
                  <p className="font-condensed text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.16em] uppercase text-ink leading-none">
                    RETROSPECTION
                  </p>
                  <p className="font-condensed text-2xl sm:text-3xl font-semibold tracking-[0.2em] uppercase text-terracotta mt-2">
                    TEMPORAL VAULT · MEMORY
                  </p>
                </div>

                <div className="pt-4 border-t border-border-hairline">
                  <span className="font-mono text-[10px] uppercase text-ink-muted tracking-widest block mb-1">
                    Display Classical Serif · Cormorant Garamond / Newsreader
                  </span>
                  <Heading level={2} variant="headline" italic className="mt-1">
                    “Memories preserved in silence remain untouched by decay.”
                  </Heading>
                </div>

                <div className="pt-4 border-t border-border-hairline">
                  <span className="font-mono text-[10px] uppercase text-ink-muted tracking-widest block mb-1">
                    Archival Vault Metadata & Index
                  </span>
                  <div className="flex items-center gap-4 font-mono text-xs text-ink-secondary mt-1">
                    <span className="text-terracotta font-semibold">EPOCH 2026</span>
                    <span>—</span>
                    <span className="text-terracotta font-semibold">CHRONICLE 01</span>
                    <span>·</span>
                    <span>VAULT INDEX № 01</span>
                  </div>
                </div>
              </div>

              {/* Editorial Quote & Links */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <Quote citation="Echoes Archival Preface" source="Volume I">
                  Silence is of negative character only to the outward mind. To the inward heart, it
                  is the fire that is the self.
                </Quote>

                <div className="p-6 bg-paper-elevated border border-border-hairline rounded-sm">
                  <span className="font-mono text-xs uppercase tracking-wider text-terracotta font-semibold block mb-3">
                    Graphic Tokens & Components
                  </span>
                  <div className="flex flex-col gap-3 font-sans text-sm">
                    <EditorialLink href="#tokens">
                      Terracotta sun disk and parchment tokens →
                    </EditorialLink>
                    <EditorialLink href="#canvas">Interactive 3D solar memory orb →</EditorialLink>
                    <EditorialLink href="#cards" subtle>
                      Archive card layouts with crosshair rules →
                    </EditorialLink>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Section 3: Color Palette & Atmospheric Surfaces */}
        <Section spacing="md" id="tokens" className="border-b border-border-hairline">
          <Container size="standard">
            <div className="flex flex-col gap-2 mb-8">
              <Kicker numeral="03">Color System & Natural Sunlight</Kicker>
              <Heading level={2} variant="headline">
                Parchment, Burnt Terracotta & Olive Slate
              </Heading>
              <Text variant="body" muted>
                Warm, sun-drenched earth tones contrasted against deep architectural shadow
                surfaces.
              </Text>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-sm border border-border-hairline bg-paper flex flex-col gap-2 shadow-paper">
                <div className="w-full h-12 rounded-xs bg-[#F6F1EA] border border-border-subtle" />
                <span className="font-mono text-xs font-semibold text-ink">Parchment</span>
                <span className="font-mono text-[10px] text-ink-muted">#F6F1EA · Base</span>
              </div>

              <div className="p-4 rounded-sm border border-border-hairline bg-paper-warm flex flex-col gap-2 shadow-paper">
                <div className="w-full h-12 rounded-xs bg-[#C3532B]" />
                <span className="font-mono text-xs font-semibold text-ink">Terracotta Sun</span>
                <span className="font-mono text-[10px] text-ink-muted">#C3532B · Primary</span>
              </div>

              <div className="p-4 rounded-sm border border-border-hairline bg-paper-warm flex flex-col gap-2 shadow-paper">
                <div className="w-full h-12 rounded-xs bg-[#D9883B]" />
                <span className="font-mono text-xs font-semibold text-ink">Morning Ochre</span>
                <span className="font-mono text-[10px] text-ink-muted">#D9883B · Sunlight</span>
              </div>

              <div className="p-4 rounded-sm border border-border-hairline bg-paper-warm flex flex-col gap-2 shadow-paper">
                <div className="w-full h-12 rounded-xs bg-[#1E2321]" />
                <span className="font-mono text-xs font-semibold text-ink">Olive Charcoal</span>
                <span className="font-mono text-[10px] text-ink-muted">#1E2321 · Shadow</span>
              </div>

              <div className="p-4 rounded-sm border border-border-hairline bg-paper-warm flex flex-col gap-2 shadow-paper">
                <div className="w-full h-12 rounded-xs bg-[#B38642]" />
                <span className="font-mono text-xs font-semibold text-ink">Temple Brass</span>
                <span className="font-mono text-[10px] text-ink-muted">#B38642 · Milestone</span>
              </div>

              <div className="p-4 rounded-sm border border-border-hairline bg-paper-warm flex flex-col gap-2 shadow-paper">
                <div className="w-full h-12 rounded-xs bg-[#3D463F]" />
                <span className="font-mono text-xs font-semibold text-ink">Misty Cedar</span>
                <span className="font-mono text-[10px] text-ink-muted">#3D463F · Nature</span>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-6 p-4 rounded-sm bg-paper-warm border border-border-hairline">
              <span className="font-mono text-xs text-ink-muted mr-2">Vintage Stamp Badges:</span>
              <Badge variant="locked" icon={<LockIcon size={12} />}>
                Temporal Lock
              </Badge>
              <Badge variant="terracotta">Terracotta Seal</Badge>
              <Badge variant="brass">Gold Milestone</Badge>
              <Badge variant="sage">Cedar Tag</Badge>
              <Badge variant="date" icon={<CalendarIcon size={12} />}>
                TIME VAULT · 2026
              </Badge>
              <Badge variant="memory" icon={<FeatherIcon size={12} />}>
                Silent Reflection
              </Badge>
            </div>
          </Container>
        </Section>

        {/* Section 4: WebGL 3D Solar Memory Scene */}
        <Section spacing="md" id="canvas" className="border-b border-border-hairline">
          <Container size="standard">
            <div className="flex flex-col gap-2 mb-8">
              <Kicker numeral="04">Native WebGL2 3D Architecture</Kicker>
              <Heading level={2} variant="headline">
                The Solar Memory Monolith
              </Heading>
              <Text variant="body" muted>
                Native WebGL shader with dynamic architectural window raking sunlight, textured
                solar disk, orbiting stardust particles, and mouse parallax tilt. Zero external
                dependencies.
              </Text>
            </div>

            <MemoryOrb />
          </Container>
        </Section>

        {/* Section 5: Component Cards & Overlapping Imagery */}
        <Section spacing="md" id="cards" className="border-b border-border-hairline">
          <Container size="standard">
            <div className="flex flex-col gap-2 mb-8">
              <Kicker numeral="05">Archival Cards & Narrative Layouts</Kicker>
              <Heading level={2} variant="headline">
                Personal Reflections & Sealed Capsules
              </Heading>
              <Text variant="body" muted>
                Tactile cards with generous whitespace, subtle micro-elevation, and temporal
                indicators.
              </Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <MemoryCard
                id="mem-1"
                title="Morning mist over the mountain temple"
                date="October 28, 2026"
                excerpt="The bells rang softly through the pine woods. Sunlight entered the courtyard at a sharp diagonal, warming the ancient stone flags."
                tags={['mountain', 'mist', 'silence']}
                photoCount={3}
                imageUrl="/images/photography/photo_hands_letter.webp"
              />

              <CapsuleTeaserCard
                id="cap-1"
                title="Letter to myself on our tenth anniversary"
                unlockDate="October 31, 2030"
                sealedAt="November 1, 2026"
                isLocked={true}
                timeRemaining="Sealed for 4 years · Inviolable"
              />
            </div>
          </Container>
        </Section>

        {/* Section 6: Photography Direction */}
        <Section spacing="md" className="border-b border-border-hairline">
          <Container size="standard">
            <div className="flex flex-col gap-2 mb-8">
              <Kicker numeral="06">Photography Direction</Kicker>
              <Heading level={2} variant="headline">
                Quiet Interiors, Sunlight & 35mm Negatives
              </Heading>
              <Text variant="body" muted>
                Archival framing inspired by independent monographs and contact sheets.
              </Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <ImageFrame
                src="/images/landscapes/landscape_misty_mountain.webp"
                alt="Atmospheric misty mountain landscape"
                caption="Misty mountain ridge at dawn"
                date="2026.10.20"
                location="Archival Study № 04"
                aspectRatio="3/2"
                borderStyle="archival"
              />

              <ImageFrame
                src="/images/photography/photo_vintage_camera.webp"
                alt="Quiet interior with sunlight and shadows"
                caption="Sunlight through window · Chair and shadows"
                date="FRAME #07"
                aspectRatio="3/2"
                borderStyle="contact-sheet"
              />
            </div>

            {/* Genuine Transparent Cutouts & Archival Stamp Showcase */}
            <div className="mt-12 p-8 bg-paper-warm border border-border-hairline rounded-sm">
              <span className="font-mono text-xs uppercase text-terracotta tracking-widest block mb-2">
                Production-Ready Cutouts & Stamps
              </span>
              <Heading level={3} variant="headline" className="mb-6">
                Genuine Alpha Transparency & Vector Seal Stamps
              </Heading>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center justify-items-center text-center">
                <div className="flex flex-col items-center gap-2">
                  <DecorativeCutout type="botanical-fern" size={120} rotation={6} />
                  <span className="font-mono text-[10px] uppercase text-ink-muted">
                    Botanical Fern Cutout
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <DecorativeCutout type="wax-seal" size={90} rotation={-4} />
                  <span className="font-mono text-[10px] uppercase text-ink-muted">
                    Terracotta Wax Seal
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <DecorativeCutout type="postal-stamp" size={84} rotation={2} />
                  <span className="font-mono text-[10px] uppercase text-ink-muted">
                    Perforated Postal Stamp
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <ArchivalStamp variant="seal-vector" size="md" />
                  <span className="font-mono text-[10px] uppercase text-ink-muted">
                    Archival Vector Seal
                  </span>
                </div>
              </div>
            </div>

            {/* Asymmetrical Photo Collage Showcase */}
            <div className="mt-12">
              <span className="font-mono text-xs uppercase text-terracotta tracking-widest block mb-2">
                Asymmetric Visual Composition
              </span>
              <Heading level={3} variant="headline" className="mb-6">
                Overlapping Monograph Photo Collage
              </Heading>
              <PhotoCollage
                primary={{
                  src: '/images/architecture/arch_sunlight_interior.webp',
                  alt: 'Sunlit interior with wooden framework',
                  plate: 'PLATE 01 · MONUMENT',
                }}
                secondary={{
                  src: '/images/photography/photo_hands_letter.webp',
                  alt: 'Handwriting letter on deckle paper',
                  plate: 'PLATE 02 · DIARY',
                }}
                tertiary={{
                  src: '/images/landscapes/landscape_golden_lake.webp',
                  alt: 'Golden lake sunset reflection',
                }}
                stampType="wax-seal"
              />
            </div>
          </Container>
        </Section>

        {/* Section 7: Form Elements & Drafting Room */}
        <Section spacing="md" className="border-b border-border-hairline">
          <Container size="standard">
            <div className="flex flex-col gap-2 mb-8">
              <Kicker numeral="07">Editorial Composition</Kicker>
              <Heading level={2} variant="headline">
                Drafting Room & Archival Inputs
              </Heading>
              <Text variant="body" muted>
                Minimal, distraction-free inputs with tactile focus rings and serif letter drafting.
              </Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card variant="paper" className="flex flex-col gap-5">
                <Heading level={3} variant="title">
                  Drafting Letter
                </Heading>
                <Input
                  label="Memory Title"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  icon={<FeatherIcon size={16} />}
                  helperText="Keep titles poetic and memorable."
                />

                <Textarea
                  label="Letter to the Future"
                  rows={4}
                  value={textareaText}
                  onChange={(e) => setTextareaText(e.target.value)}
                  helperText="Written in editorial serif. Will be sealed until milestone date."
                />

                <div className="pt-2">
                  <Toggle
                    checked={toggleVal}
                    onChange={setToggleVal}
                    label="Attach 35mm Negatives"
                    description="Upload high-resolution scans and private photographs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button variant="primary" size="sm">
                    Save Draft
                  </Button>
                  <Button variant="ghost" size="sm">
                    Discard
                  </Button>
                </div>
              </Card>

              {/* Empty & Loading States */}
              <div className="flex flex-col gap-6">
                <EmptyState
                  title="Your Vault Awaits"
                  description="No time capsules are ready to be unsealed today. Seal a new letter to your future self."
                  actionLabel="Seal First Capsule"
                  onAction={() =>
                    alert('Phase 5A Showcase: Capsule composer dialog triggers here.')
                  }
                  icon={<CameraIcon size={22} />}
                />

                <Card variant="paper" className="flex flex-col gap-3">
                  <span className="font-mono text-xs uppercase text-ink-muted">
                    Loading Skeleton Pulse
                  </span>
                  <Skeleton variant="title" />
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="70%" />
                </Card>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border-hairline py-12 bg-paper-warm">
        <Container size="standard">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-ink-muted">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg text-ink font-semibold">ECHOES</span>
              <span>· Cinematic Editorial Nostalgia · ARCHIVAL REPOSITORY · 2026</span>
            </div>
            <div>Phase 5A Art Direction · 2026</div>
          </div>
        </Container>
      </footer>

      {/* Interactive Modal Demo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Cinematic Editorial Nostalgia Specs"
        description="Design system architecture, typography tokens, and solar color palette."
      >
        <div className="flex flex-col gap-4 mt-2">
          <Text variant="body">
            This visual identity synthesizes vintage travel poster typography, natural sunlight,
            long architectural shadows, and 35mm film photography into an intimate digital archive.
          </Text>

          <Quote citation="Roland Barthes" source="Camera Lucida">
            What the photograph reproduces to infinity has occurred only once.
          </Quote>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-hairline">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
