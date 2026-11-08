import React from 'react';
import Image from 'next/image';
import { DecorativeCutout } from './DecorativeCutout';

export interface PhotoCollageItem {
  src: string;
  alt: string;
  caption?: string;
  plate?: string;
}

export interface PhotoCollageProps {
  primary: PhotoCollageItem;
  secondary: PhotoCollageItem;
  tertiary?: PhotoCollageItem;
  stampType?: 'botanical-fern' | 'wax-seal' | 'postal-stamp';
  className?: string;
}

export function PhotoCollage({
  primary,
  secondary,
  tertiary,
  stampType = 'wax-seal',
  className = '',
}: PhotoCollageProps) {
  return (
    <div className={`relative w-full min-h-[460px] sm:min-h-[540px] ${className}`}>
      {/* Primary Main Photograph */}
      <div className="absolute top-0 left-0 w-[78%] sm:w-[70%] aspect-[4/3] rounded-xs overflow-hidden border border-border-hairline bg-paper-warm shadow-elevated z-10 transition-transform duration-700 ease-editorial hover:z-30 hover:scale-[1.02]">
        <Image
          src={primary.src}
          alt={primary.alt}
          fill
          sizes="(max-width: 768px) 90vw, 50vw"
          className="object-cover"
        />
        {primary.plate && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-paper/85 backdrop-blur-xs font-mono text-[10px] uppercase text-terracotta tracking-wider border border-border-hairline">
            {primary.plate}
          </div>
        )}
      </div>

      {/* Secondary Overlapping Photograph (Rotated) */}
      <div className="absolute bottom-4 right-0 w-[58%] sm:w-[50%] aspect-[3/2] rounded-xs overflow-hidden border-2 border-paper bg-paper-warm shadow-elevated z-20 rotate-2 transition-transform duration-700 ease-editorial hover:rotate-0 hover:z-30 hover:scale-[1.03]">
        <Image
          src={secondary.src}
          alt={secondary.alt}
          fill
          sizes="(max-width: 768px) 70vw, 35vw"
          className="object-cover"
        />
        {secondary.plate && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-paper/85 backdrop-blur-xs font-mono text-[10px] uppercase text-ink-muted tracking-wider border border-border-hairline">
            {secondary.plate}
          </div>
        )}
      </div>

      {/* Tertiary Optional Photograph or Floating Cutout */}
      {tertiary && (
        <div className="absolute top-8 right-4 w-[38%] aspect-square rounded-xs overflow-hidden border border-border-hairline bg-paper shadow-paper z-15 -rotate-3 transition-transform duration-700 ease-editorial hover:rotate-0 hover:z-30">
          <Image src={tertiary.src} alt={tertiary.alt} fill sizes="25vw" className="object-cover" />
        </div>
      )}

      {/* Floating Genuine Transparent Decorative Cutout */}
      <div className="absolute -top-3 left-[62%] z-25 pointer-events-none">
        <DecorativeCutout
          type={stampType}
          size={stampType === 'botanical-fern' ? 140 : 90}
          rotation={-8}
        />
      </div>

      {/* Vintage Air Mail Accent Stripe on Bottom Edge */}
      <div
        className="absolute -bottom-2 left-4 w-48 h-3 opacity-60 z-30 pointer-events-none"
        style={{
          backgroundImage: "url('/images/decorative/decorative_postal_stripes.svg')",
          backgroundRepeat: 'repeat-x',
          backgroundSize: '36px 12px',
        }}
      />
    </div>
  );
}
