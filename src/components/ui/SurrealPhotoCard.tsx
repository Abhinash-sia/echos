import React from 'react';
import Image from 'next/image';

export type CardBackdropColor =
  'coral' | 'cobalt' | 'lime' | 'teal' | 'yellow' | 'pink' | 'midnight';

export interface SurrealPhotoCardProps {
  src: string;
  alt: string;
  title?: string;
  date?: string;
  tag?: string;
  backdropColor?: CardBackdropColor;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  badgeText?: string;
  className?: string;
  priority?: boolean;
}

/**
 * SurrealPhotoCard: Layered photographic composition with asymmetric colored backdrop,
 * experimental editorial typography, and high-contrast archival details.
 */
export function SurrealPhotoCard({
  src,
  alt,
  title,
  date,
  tag,
  backdropColor = 'coral',
  aspectRatio = 'landscape',
  badgeText,
  className = '',
  priority = false,
}: SurrealPhotoCardProps) {
  const backdropClasses: Record<CardBackdropColor, string> = {
    coral: 'bg-[#FF684D]',
    cobalt: 'bg-[#4F66E8]',
    lime: 'bg-[#B7DB50]',
    teal: 'bg-[#39BFAE]',
    yellow: 'bg-[#F7D84B]',
    pink: 'bg-[#F3A9D5]',
    midnight: 'bg-[#191A2B]',
  };

  const aspectClasses = {
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    square: 'aspect-square',
  };

  return (
    <div className={`group relative ${className}`}>
      {/* Asymmetric Offset Graphic Backdrop */}
      <div
        className={`absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-sm border-2 border-[#191A2B] transition-transform duration-300 group-hover:translate-x-3.5 group-hover:translate-y-3.5 ${backdropClasses[backdropColor]}`}
      />

      {/* Main Photographic Card */}
      <div className="relative bg-white border-2 border-[#191A2B] rounded-sm overflow-hidden p-2 transition-transform duration-300 group-hover:-translate-y-1">
        <div
          className={`relative w-full ${aspectClasses[aspectRatio]} overflow-hidden rounded-xs bg-[#EFE9DE]`}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {badgeText && (
            <div className="absolute top-2.5 left-2.5 bg-[#191A2B] text-white font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-xs border border-white/20">
              {badgeText}
            </div>
          )}
        </div>

        {(title || date || tag) && (
          <div className="p-3 bg-white text-[#191A2B]">
            <div className="flex items-center justify-between gap-2 mb-1">
              {tag && (
                <span className="font-mono text-[11px] font-bold text-[#FF684D] uppercase tracking-wider">
                  #{tag}
                </span>
              )}
              {date && (
                <time dateTime={date} className="font-mono text-[11px] text-[#767C9D] ml-auto">
                  {date}
                </time>
              )}
            </div>
            {title && (
              <h4 className="font-serif text-lg font-normal leading-snug line-clamp-1 group-hover:text-[#4F66E8] transition-colors">
                {title}
              </h4>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
