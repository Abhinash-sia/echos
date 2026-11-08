import React from 'react';

type SunDiskSize = 'sm' | 'md' | 'lg' | 'xl' | 'poster';

export interface SunDiskProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SunDiskSize;
  glow?: boolean;
}

export function SunDisk({ size = 'md', glow = true, className = '', ...props }: SunDiskProps) {
  const sizeMap: Record<SunDiskSize, string> = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
    poster: 'w-48 h-48 sm:w-60 sm:h-60',
  };

  return (
    <div
      aria-hidden="true"
      className={`relative rounded-full sun-disk-gradient shrink-0 select-none overflow-hidden ${
        glow ? 'shadow-sun' : ''
      } ${sizeMap[size]} ${className}`}
      {...props}
    >
      {/* Subtle organic surface texture layer */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(circle_at_20%_20%,#fff_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_bottom,#000_0%,transparent_70%)]" />
    </div>
  );
}
