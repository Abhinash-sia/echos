import React from 'react';
import Image from 'next/image';

export interface SurrealObjectFloatProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  width: number;
  height: number;
  floatVariant?: 'slow' | 'reverse' | 'gentle';
  glowColor?: 'coral' | 'cobalt' | 'lime' | 'yellow' | 'none';
  rotate?: number;
}

/**
 * SurrealObjectFloat: Displays floating 3D-inspired objects, cutouts, brass capsules,
 * and surreal elements with gentle ambient motion and optional colored luminescence.
 */
export function SurrealObjectFloat({
  src,
  alt,
  width,
  height,
  floatVariant = 'gentle',
  glowColor = 'none',
  rotate = 0,
  className = '',
  style,
  ...props
}: SurrealObjectFloatProps) {
  const floatClass =
    floatVariant === 'slow'
      ? 'animate-float-slow'
      : floatVariant === 'reverse'
        ? 'animate-float-slow'
        : 'animate-float';

  const glowStyles = {
    coral: 'drop-shadow-[0_0_25px_rgba(255,104,77,0.45)]',
    cobalt: 'drop-shadow-[0_0_25px_rgba(79,102,232,0.45)]',
    lime: 'drop-shadow-[0_0_25px_rgba(183,219,80,0.45)]',
    yellow: 'drop-shadow-[0_0_25px_rgba(247,216,75,0.45)]',
    none: '',
  };

  const combinedStyle = {
    transform: rotate !== 0 ? `rotate(${rotate}deg)` : undefined,
    ...style,
  };

  return (
    <div
      style={combinedStyle}
      className={`relative inline-block pointer-events-none select-none ${floatClass} ${glowStyles[glowColor]} ${className}`}
      {...props}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-auto h-auto object-contain"
      />
    </div>
  );
}
