'use client';

import React, { useState } from 'react';

export interface TooltipProps {
  content: string;
  children: React.ReactElement<{
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    'aria-describedby'?: string;
  }>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const id = React.useId();

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    children.props.onMouseEnter?.(e);
    setIsVisible(true);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    children.props.onMouseLeave?.(e);
    setIsVisible(false);
  };

  const handleFocus = (e: React.FocusEvent) => {
    children.props.onFocus?.(e);
    setIsVisible(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    children.props.onBlur?.(e);
    setIsVisible(false);
  };

  return (
    <div className="relative inline-flex items-center">
      {React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        'aria-describedby': isVisible ? id : undefined,
      })}

      {isVisible && (
        <div
          id={id}
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap px-2.5 py-1 text-xs font-sans font-medium text-[#F7F3EC] bg-[#191A2B] dark:text-[#191A2B] dark:bg-[#F7F3EC] rounded-xs shadow-md pointer-events-none transition-opacity duration-150 animate-in fade-in ${positionStyles[position]} ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
