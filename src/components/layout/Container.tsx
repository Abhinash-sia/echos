import React from 'react';

type ContainerSize = 'prose' | 'narrow' | 'standard' | 'wide' | 'bleed';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  as?: React.ElementType;
}

export function Container({
  size = 'standard',
  as: Component = 'div',
  className = '',
  children,
  ...props
}: ContainerProps) {
  const sizeClasses: Record<ContainerSize, string> = {
    prose: 'max-w-prose',
    narrow: 'max-w-[840px]',
    standard: 'max-w-[1140px]',
    wide: 'max-w-[1360px]',
    bleed: 'max-w-[1600px]',
  };

  return (
    <Component
      className={`w-full mx-auto px-4 sm:px-6 md:px-8 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  as?: React.ElementType;
}

export function Section({
  spacing = 'lg',
  as: Component = 'section',
  className = '',
  children,
  ...props
}: SectionProps) {
  const spacingClasses = {
    sm: 'py-8 sm:py-12',
    md: 'py-12 sm:py-16 md:py-20',
    lg: 'py-16 sm:py-24 md:py-32',
    xl: 'py-24 sm:py-32 md:py-40',
  };

  return (
    <Component className={`${spacingClasses[spacing]} ${className}`} {...props}>
      {children}
    </Component>
  );
}
