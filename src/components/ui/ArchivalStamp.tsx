import React from 'react';
import Image from 'next/image';

export interface ArchivalStampProps {
  variant?: 'wax' | 'postal' | 'seal-vector';
  label?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ArchivalStamp({
  variant = 'wax',
  label,
  sublabel,
  size = 'md',
  className = '',
}: ArchivalStampProps) {
  const sizeMap = {
    sm: { px: 48, text: 'text-[9px]' },
    md: { px: 72, text: 'text-[10px]' },
    lg: { px: 110, text: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'seal-vector') {
    return (
      <div
        className={`inline-flex flex-col items-center select-none transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
      >
        <Image
          src="/images/illustrations/illustration_archival_seal.svg"
          alt="Echoes Archival Seal"
          width={currentSize.px}
          height={currentSize.px}
          className="w-auto h-auto"
        />
        {label && (
          <span
            className={`font-mono ${currentSize.text} uppercase tracking-widest text-terracotta mt-1`}
          >
            {label}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'postal') {
    return (
      <div
        className={`inline-flex flex-col items-center select-none transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
      >
        <Image
          src="/images/cutouts/cutout_postal_stamp.webp"
          alt="Vintage Archival Stamp"
          width={currentSize.px}
          height={currentSize.px}
          className="w-auto h-auto drop-shadow-sm rotate-1"
        />
        {label && (
          <span
            className={`font-mono ${currentSize.text} uppercase tracking-wider text-ink-muted mt-1`}
          >
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex flex-col items-center select-none transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
    >
      <Image
        src="/images/cutouts/cutout_wax_seal.webp"
        alt="Terracotta Wax Seal"
        width={currentSize.px}
        height={currentSize.px}
        className="w-auto h-auto drop-shadow-[0_4px_12px_rgba(195,83,43,0.25)]"
      />
      {label && (
        <span
          className={`font-mono ${currentSize.text} uppercase tracking-widest text-terracotta font-semibold mt-1`}
        >
          {label}
        </span>
      )}
      {sublabel && (
        <span className={`font-mono text-[9px] uppercase tracking-wider text-ink-muted`}>
          {sublabel}
        </span>
      )}
    </div>
  );
}
