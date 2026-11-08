import React from 'react';
import { Metadata } from 'next';
import { EditorialHeader } from '@/components/layout/EditorialHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { ManifestoSection } from '@/components/landing/ManifestoSection';
import { ContactSheetSection } from '@/components/landing/ContactSheetSection';
import { MemoryArchiveSection } from '@/components/landing/MemoryArchiveSection';
import { SealingChamberSection } from '@/components/landing/SealingChamberSection';
import { ChronologySection } from '@/components/landing/ChronologySection';
import { ProductShowcaseSection } from '@/components/landing/ProductShowcaseSection';
import { EpilogueSection } from '@/components/landing/EpilogueSection';
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider';

export const metadata: Metadata = {
  title: 'Echoes — Digital Memory Vault & Personal Time Capsule',
  description:
    'An experimental editorial archive for the preservation of human reflection, 35mm photographic memories, and cryptographically sealed time capsules.',
  openGraph: {
    title: 'Echoes — Digital Memory Vault & Personal Time Capsule',
    description:
      'The sanctuary for things time must not steal. Inscribe your memories, attach photographic traces, and seal letters to your future self.',
    type: 'website',
    images: [
      {
        url: '/images/hero/hero_celestial_sanctuary.webp',
        width: 1672,
        height: 941,
        alt: 'Echoes Archival Sanctuary',
      },
    ],
  },
};

export default function Home() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen flex flex-col bg-[#F7F3EC] dark:bg-[#12131D] text-[#191A2B] dark:text-[#F7F3EC] selection:bg-[#FF684D] selection:text-white transition-colors duration-300">
        {/* Editorial Navigation Header with Theme Toggle & Auth State */}
        <EditorialHeader />

        <main className="flex-1" data-vault-index="VAULT INDEX № 01 · CHRONICLE OF TIME">
          {/* Archival Index: VAULT INDEX № 01 · CHRONICLE OF TIME */}
          {/* Moment 1: Cinematic Hero — The Vault of Elapsed Moments */}
          <HeroSection />

          {/* Moment 2: The Architecture of Memory (Editorial Manifesto) */}
          <ManifestoSection />

          {/* Moment 3: Traces of Light & Film (35mm Contact Sheet) */}
          <ContactSheetSection />

          {/* Moment 4: The Living Memory Archive */}
          <MemoryArchiveSection />

          {/* Moment 5: The Time Capsule Sealing Chamber */}
          <SealingChamberSection />

          {/* Moment 6: Infinite Chronology (Serpentine Timeline Spine) */}
          <ChronologySection />

          {/* Moment 7: The Real Product (Authentic Interface Showcase) */}
          <ProductShowcaseSection />
        </main>

        {/* Moment 8: Epilogue — Begin Your Archive & Editorial Footer */}
        <EpilogueSection />
      </div>
    </SmoothScrollProvider>
  );
}
