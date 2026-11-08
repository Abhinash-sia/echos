import React from 'react';

type AspectRatio = '1/1' | '4/5' | '16/9' | '3/2' | '2/3';

export interface ImageFrameProps {
  src: string;
  alt: string;
  caption?: string;
  date?: string;
  location?: string;
  aspectRatio?: AspectRatio;
  borderStyle?: 'archival' | 'minimal' | 'contact-sheet';
  className?: string;
}

export function ImageFrame({
  src,
  alt,
  caption,
  date,
  location,
  aspectRatio = '3/2',
  borderStyle = 'archival',
  className = '',
}: ImageFrameProps) {
  const aspectClasses: Record<AspectRatio, string> = {
    '1/1': 'aspect-square',
    '4/5': 'aspect-[4/5]',
    '16/9': 'aspect-[16/9]',
    '3/2': 'aspect-[3/2]',
    '2/3': 'aspect-[2/3]',
  };

  return (
    <figure className={`flex flex-col ${className}`}>
      <div
        className={`relative overflow-hidden bg-paper-elevated ${
          borderStyle === 'archival'
            ? 'p-3 sm:p-4 bg-paper-warm border border-border-subtle shadow-paper rounded-xs'
            : borderStyle === 'contact-sheet'
              ? 'p-2 bg-[#121214] text-[#E0DDD5] border border-black rounded-none'
              : 'border border-border-hairline rounded-sm'
        }`}
      >
        <div className={`relative w-full ${aspectClasses[aspectRatio]} overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover grayscale-[15%] contrast-[1.05] transition-transform duration-700 hover:scale-[1.02]"
            loading="lazy"
          />
        </div>

        {borderStyle === 'contact-sheet' && (
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10 font-mono text-[10px] text-zinc-400">
            <span>EXP 36 · 400 ISO</span>
            <span>{date || 'FRAME #18'}</span>
          </div>
        )}
      </div>

      {(caption || date || location) && borderStyle !== 'contact-sheet' && (
        <figcaption className="mt-2.5 flex items-baseline justify-between text-xs text-ink-muted px-1 font-mono">
          <span className="font-sans italic text-ink-secondary text-sm">{caption}</span>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
            {location && <span>{location}</span>}
            {location && date && <span>·</span>}
            {date && <time dateTime={date}>{date}</time>}
          </div>
        </figcaption>
      )}
    </figure>
  );
}
