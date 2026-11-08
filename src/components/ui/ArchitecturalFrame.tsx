import React from 'react';
import { SunDisk } from './SunDisk';

export interface ArchitecturalFrameProps {
  imageSrc: string;
  alt: string;
  quote?: string;
  author?: string;
  kicker?: string;
  caption?: string;
  coordinates?: string;
  showSun?: boolean;
  reverse?: boolean;
  className?: string;
}

export function ArchitecturalFrame({
  imageSrc,
  alt,
  quote = 'SOMEONE WAS HERE.',
  author = 'TRACES REMAIN · SILENCE HOLDS',
  kicker = 'VISUAL PSALMS',
  caption = 'Quiet human worlds in golden light',
  coordinates = 'ARCHIVAL PLATE · VAULT INDEX № 01',
  showSun = true,
  reverse = false,
  className = '',
}: ArchitecturalFrameProps) {
  return (
    <div
      className={`relative grid grid-cols-1 lg:grid-cols-12 gap-0 border border-border-hairline bg-paper-warm rounded-sm overflow-hidden shadow-paper ${className}`}
    >
      {/* Visual Photography Column */}
      <div
        className={`relative lg:col-span-7 min-h-[420px] sm:min-h-[520px] overflow-hidden ${
          reverse ? 'lg:order-2' : 'lg:order-1'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover grayscale-[10%] contrast-[1.08] transition-transform duration-1000 ease-out hover:scale-105"
          loading="lazy"
        />

        {/* Ambient Sunlight Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Bottom Coordinates & Kicker */}
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white/90 font-mono text-[11px] tracking-widest uppercase">
          <span>{kicker}</span>
          <span className="opacity-75">{coordinates}</span>
        </div>
      </div>

      {/* Editorial Content Column with Architectural Asymmetry */}
      <div
        className={`relative lg:col-span-5 p-8 sm:p-12 md:p-14 flex flex-col justify-between bg-paper z-10 ${
          reverse ? 'lg:order-1' : 'lg:order-2'
        }`}
      >
        {/* Sun Disk & Top Tagline */}
        <div className="flex items-start justify-between">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-terracotta font-semibold">
            {kicker}
          </div>
          {showSun && <SunDisk size="md" glow={true} className="-mt-2 -mr-2" />}
        </div>

        {/* Central Quote & Dramatic Serif Title */}
        <div className="my-10 sm:my-14">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-ink leading-[1.15] tracking-tight">
            {quote}
          </h2>

          <div className="w-8 h-[2px] bg-terracotta my-5" />

          <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-ink-secondary leading-relaxed">
            {author}
          </p>

          <p className="font-sans text-sm text-ink-muted leading-relaxed mt-4 italic">{caption}</p>
        </div>

        {/* Bottom Archival Annotation */}
        <div className="pt-6 border-t border-border-hairline flex items-center justify-between font-mono text-[11px] text-ink-muted uppercase tracking-wider">
          <span>ARCHIVAL PLATE № 08</span>
          <span>ANALOG FILM PRESERVATION</span>
        </div>
      </div>
    </div>
  );
}
