import React from 'react';
import Image from 'next/image';

export interface EditorialImageProps {
  src: string;
  alt: string;
  aspectRatio?: '16/9' | '4/3' | '3/2' | '1/1' | '2/3';
  caption?: string;
  plate?: string;
  date?: string;
  priority?: boolean;
  className?: string;
  overlayGradient?: boolean;
}

export function EditorialImage({
  src,
  alt,
  aspectRatio = '3/2',
  caption,
  plate,
  date,
  priority = false,
  className = '',
  overlayGradient = false,
}: EditorialImageProps) {
  const aspectClasses: Record<string, string> = {
    '16/9': 'aspect-[16/9]',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    '1/1': 'aspect-square',
    '2/3': 'aspect-[2/3]',
  };

  return (
    <figure className={`flex flex-col gap-2 group ${className}`}>
      <div
        className={`relative w-full ${aspectClasses[aspectRatio] || 'aspect-[3/2]'} overflow-hidden rounded-xs border border-border-hairline bg-paper-warm shadow-paper`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          className="object-cover transition-transform duration-1000 ease-editorial group-hover:scale-[1.03]"
        />

        {overlayGradient && (
          <div className="absolute inset-0 bg-gradient-to-t from-paper/80 via-transparent to-transparent pointer-events-none" />
        )}

        {/* Crosshair registration marks in corners */}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-paper-warm/80 pointer-events-none select-none">
          +
        </div>
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-paper-warm/80 pointer-events-none select-none">
          +
        </div>
      </div>

      {(caption || plate || date) && (
        <figcaption className="flex items-center justify-between px-1 text-[11px] font-mono text-ink-muted">
          <div className="flex items-center gap-2 truncate">
            {plate && <span className="text-terracotta uppercase font-semibold">{plate}</span>}
            {plate && caption && <span>·</span>}
            {caption && <span className="truncate text-ink-secondary">{caption}</span>}
          </div>
          {date && <span className="shrink-0">{date}</span>}
        </figcaption>
      )}
    </figure>
  );
}
