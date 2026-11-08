import React from 'react';

export interface PosterPanelProps {
  title: string;
  subtitle?: string;
  location?: string;
  coordinates?: string;
  variant?: 'terracotta' | 'olive' | 'paper';
  className?: string;
}

export function PosterPanel({
  title,
  subtitle = 'DIGITAL MEMORY ARCHIVE',
  location,
  coordinates,
  variant = 'terracotta',
  className = '',
}: PosterPanelProps) {
  const variantStyles = {
    terracotta: 'bg-terracotta text-white shadow-elevated border-t-0',
    olive: 'bg-olive-charcoal text-paper shadow-elevated border-t-0',
    paper: 'bg-paper-elevated text-ink border border-border-subtle shadow-paper',
  };

  return (
    <aside
      className={`relative flex flex-col justify-between py-8 px-4 sm:px-6 select-none ${variantStyles[variant]} ${className}`}
    >
      {/* Top Header / Emblem */}
      <div className="flex flex-col items-center text-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] opacity-80">
        <span className="w-1.5 h-1.5 rounded-full bg-current mb-1" />
        <span>{subtitle}</span>
      </div>

      {/* Center Vertical Dramatic Typography */}
      <div className="my-10 flex items-center justify-center overflow-hidden">
        <h2 className="writing-vertical font-condensed text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.18em] uppercase whitespace-nowrap leading-none drop-shadow-sm">
          {title}
        </h2>
      </div>

      {/* Bottom Metadata & Coordinates */}
      <div className="flex flex-col items-center text-center gap-1 font-mono text-[9px] uppercase tracking-widest opacity-75 pt-4 border-t border-current/20">
        {location && <span>{location}</span>}
        {coordinates && <span className="opacity-60">{coordinates}</span>}
      </div>
    </aside>
  );
}
