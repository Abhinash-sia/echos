import React from 'react';

export type StickerColor =
  'coral' | 'cobalt' | 'lime' | 'teal' | 'yellow' | 'pink' | 'tangerine' | 'midnight' | 'cream';

export interface FloatingStickerProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: StickerColor;
  rotate?: -6 | -4 | -2 | 0 | 2 | 4 | 6 | number;
  pin?: boolean;
  animated?: boolean;
  shadow?: boolean;
}

/**
 * FloatingSticker: Reusable Playful Surrealism collage element.
 * Tactile graphic sticker with hard-edged offset shadow and subtle tilt.
 */
export function FloatingSticker({
  color = 'yellow',
  rotate = -2,
  pin = false,
  animated = false,
  shadow = true,
  className = '',
  children,
  style,
  ...props
}: FloatingStickerProps) {
  const colorStyles: Record<StickerColor, string> = {
    coral: 'bg-[#FF684D] text-white border-2 border-[#191A2B]',
    cobalt: 'bg-[#4F66E8] text-white border-2 border-[#191A2B]',
    lime: 'bg-[#B7DB50] text-[#191A2B] border-2 border-[#191A2B]',
    teal: 'bg-[#39BFAE] text-[#191A2B] border-2 border-[#191A2B]',
    yellow: 'bg-[#F7D84B] text-[#191A2B] border-2 border-[#191A2B]',
    pink: 'bg-[#F3A9D5] text-[#191A2B] border-2 border-[#191A2B]',
    tangerine: 'bg-[#FFB93F] text-[#191A2B] border-2 border-[#191A2B]',
    midnight: 'bg-[#191A2B] text-[#F7F3EC] border-2 border-[#F7F3EC]',
    cream: 'bg-[#F7F3EC] text-[#191A2B] border-2 border-[#191A2B]',
  };

  const shadowClass = shadow ? 'sticker-shadow' : '';
  const animClass = animated ? 'animate-float' : '';

  const rotationStyle = {
    transform: `rotate(${rotate}deg)`,
    ...style,
  };

  return (
    <div
      style={rotationStyle}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs uppercase font-bold tracking-wider rounded-sm select-none transition-transform duration-200 hover:scale-105 ${colorStyles[color]} ${shadowClass} ${animClass} ${className}`}
      {...props}
    >
      {pin && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#191A2B] border-2 border-white shadow-sm"
        />
      )}
      {children}
    </div>
  );
}
