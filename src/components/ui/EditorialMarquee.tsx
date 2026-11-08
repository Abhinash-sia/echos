import React from 'react';

export interface EditorialMarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  items: string[];
  colorScheme?:
    'lime-midnight' | 'tangerine-midnight' | 'coral-cream' | 'midnight-cream' | 'pink-midnight';
  speed?: 'normal' | 'fast' | 'slow';
  separator?: string;
}

/**
 * EditorialMarquee: High-contrast moving typographic ticker tape.
 * Infuses experimental editorial rhythm and Playful Surrealism energy.
 */
export function EditorialMarquee({
  items,
  colorScheme = 'lime-midnight',
  speed = 'normal',
  separator = '✦',
  className = '',
  ...props
}: EditorialMarqueeProps) {
  const schemeStyles = {
    'lime-midnight': 'bg-[#B7DB50] text-[#191A2B] border-y-2 border-[#191A2B]',
    'tangerine-midnight': 'bg-[#FFB93F] text-[#191A2B] border-y-2 border-[#191A2B]',
    'coral-cream': 'bg-[#FF684D] text-[#F7F3EC] border-y-2 border-[#191A2B]',
    'midnight-cream': 'bg-[#191A2B] text-[#F7F3EC] border-y-2 border-white/20',
    'pink-midnight': 'bg-[#F3A9D5] text-[#191A2B] border-y-2 border-[#191A2B]',
  };

  const speedStyles = {
    normal: '[animation-duration:24s]',
    fast: '[animation-duration:14s]',
    slow: '[animation-duration:36s]',
  };

  const content = items.map((item, idx) => (
    <span key={idx} className="inline-flex items-center gap-6 px-4">
      <span className="font-condensed text-xl sm:text-2xl font-bold uppercase tracking-wider">
        {item}
      </span>
      <span className="opacity-70 font-mono text-base">{separator}</span>
    </span>
  ));

  return (
    <div
      className={`relative w-full overflow-hidden py-2 select-none ${schemeStyles[colorScheme]} ${className}`}
      {...props}
    >
      <div className={`animate-marquee ${speedStyles[speed]} flex whitespace-nowrap`}>
        {content}
        {content}
        {content}
      </div>
    </div>
  );
}
