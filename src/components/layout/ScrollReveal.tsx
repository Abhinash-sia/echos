'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  variant?: 'fade-up' | 'scale' | 'fade';
  direction?: 'up' | 'down' | 'scale' | 'fade';
  stagger?: 1 | 2 | 3 | 4 | 5 | 6;
  delay?: number;
  delayMs?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li' | 'header';
}

export function ScrollReveal({
  children,
  variant,
  direction,
  stagger,
  delay,
  delayMs = 0,
  className = '',
  as: Component = 'div',
  style,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const effectiveVariant = variant || (direction === 'scale' ? 'scale' : 'fade-up');
  const effectiveDelay = delay ?? delayMs;

  useEffect(() => {
    // If reduced-motion is preferred, reveal immediately without animation
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const timer = setTimeout(() => setIsRevealed(true), 0);
      return () => clearTimeout(timer);
    }

    if (!ref.current || typeof IntersectionObserver === 'undefined') {
      const timer = setTimeout(() => setIsRevealed(true), 0);
      return () => clearTimeout(timer);
    }

    const element = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const variantClass = effectiveVariant === 'scale' ? 'scroll-reveal-scale' : 'scroll-reveal';
  const staggerClass = stagger ? `stagger-${stagger}` : '';
  const revealedClass = isRevealed ? 'is-revealed' : '';

  const customStyle: React.CSSProperties = {
    ...style,
    ...(effectiveDelay > 0 ? { transitionDelay: `${effectiveDelay}ms` } : {}),
  };

  return (
    <Component
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      style={customStyle}
      className={`${variantClass} ${staggerClass} ${revealedClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
