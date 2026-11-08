import React from 'react';
import Image from 'next/image';

export type CutoutType = 'botanical-fern' | 'wax-seal' | 'postal-stamp';

export interface DecorativeCutoutProps {
  type: CutoutType;
  className?: string;
  size?: number;
  rotation?: number;
  float?: boolean;
  alt?: string;
}

const CUTOUT_ASSETS: Record<CutoutType, { src: string; alt: string; defaultSize: number }> = {
  'botanical-fern': {
    src: '/images/cutouts/cutout_botanical_fern.webp',
    alt: 'Preserved botanical fern leaf specimen',
    defaultSize: 180,
  },
  'wax-seal': {
    src: '/images/cutouts/cutout_wax_seal.webp',
    alt: 'Terracotta embossed astronomical wax seal',
    defaultSize: 120,
  },
  'postal-stamp': {
    src: '/images/cutouts/cutout_postal_stamp.webp',
    alt: 'Vintage cancelled archival postage stamp',
    defaultSize: 110,
  },
};

export function DecorativeCutout({
  type,
  className = '',
  size,
  rotation = 0,
  float = false,
  alt,
}: DecorativeCutoutProps) {
  const meta = CUTOUT_ASSETS[type];
  const dimension = size || meta.defaultSize;

  return (
    <div
      className={`pointer-events-none select-none transition-transform duration-700 ease-editorial ${
        float ? 'animate-pulse' : ''
      } ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
      aria-hidden="true"
    >
      <Image
        src={meta.src}
        alt={alt || meta.alt}
        width={dimension}
        height={dimension}
        className="w-auto h-auto object-contain drop-shadow-[0_8px_16px_rgba(28,26,23,0.18)]"
        priority={false}
      />
    </div>
  );
}
