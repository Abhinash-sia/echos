import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'title' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 w-full rounded-xs',
    title: 'h-8 w-3/4 rounded-xs',
    rectangular: 'w-full h-48 rounded-sm',
    circular: 'w-10 h-10 rounded-full',
  };

  return (
    <div
      aria-hidden="true"
      className={`bg-border-subtle/30 animate-pulse ${variantStyles[variant]} ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
}
