import React from 'react';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingVariant =
  'display' | 'headline' | 'title' | 'subhead' | 'kicker' | 'poster' | 'condensed';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  variant?: HeadingVariant;
  italic?: boolean;
  as?: React.ElementType;
}

export function Heading({
  level = 2,
  variant,
  italic = false,
  as,
  className = '',
  children,
  ...props
}: HeadingProps) {
  const Component = as || (`h${level}` as React.ElementType);
  const activeVariant =
    variant ||
    (level === 1 ? 'display' : level === 2 ? 'headline' : level === 3 ? 'title' : 'subhead');

  const variantStyles: Record<HeadingVariant, string> = {
    display:
      'font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.1]',
    headline:
      'font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight leading-[1.15]',
    title: 'font-serif text-2xl sm:text-3xl font-medium tracking-normal leading-[1.2]',
    subhead: 'font-sans text-lg sm:text-xl font-medium tracking-tight leading-[1.3]',
    kicker: 'font-mono text-xs uppercase tracking-[0.25em] font-semibold text-terracotta',
    poster:
      'font-condensed text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.14em] uppercase leading-none',
    condensed:
      'font-condensed text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[0.16em] uppercase leading-tight',
  };

  const fontClass =
    activeVariant === 'subhead' ||
    activeVariant === 'kicker' ||
    activeVariant === 'poster' ||
    activeVariant === 'condensed'
      ? ''
      : 'font-serif';
  const italicClass = italic ? 'italic' : '';

  const colorClass = className.includes('text-') ? '' : 'text-ink';

  return (
    <Component
      className={`${colorClass} ${fontClass} ${variantStyles[activeVariant]} ${italicClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

type TextVariant = 'lead' | 'body' | 'caption' | 'mono';

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant;
  muted?: boolean;
  subtle?: boolean;
  as?: React.ElementType;
}

export function Text({
  variant = 'body',
  muted = false,
  subtle = false,
  as = 'p',
  className = '',
  children,
  ...props
}: TextProps) {
  const Component = as;

  const variantStyles: Record<TextVariant, string> = {
    lead: 'text-lg sm:text-xl font-normal leading-relaxed',
    body: 'text-base font-normal leading-relaxed',
    caption: 'text-xs sm:text-sm font-normal leading-normal',
    mono: 'font-mono text-xs sm:text-sm tracking-tight',
  };

  const colorClass = subtle ? 'text-ink-subtle' : muted ? 'text-ink-muted' : 'text-ink-secondary';

  return (
    <Component className={`${variantStyles[variant]} ${colorClass} ${className}`} {...props}>
      {children}
    </Component>
  );
}

export interface KickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  numeral?: string;
}

export function Kicker({ numeral, className = '', children, ...props }: KickerProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted ${className}`}
      {...props}
    >
      {numeral && <span className="text-terracotta font-semibold">[{numeral}]</span>}
      <span className="font-medium text-ink-secondary">{children}</span>
    </div>
  );
}

export interface QuoteProps extends React.HTMLAttributes<HTMLQuoteElement> {
  citation?: string;
  source?: string;
}

export function Quote({ citation, source, className = '', children, ...props }: QuoteProps) {
  return (
    <blockquote
      className={`relative pl-6 sm:pl-8 border-l border-terracotta/40 my-8 sm:my-10 ${className}`}
      {...props}
    >
      <p className="font-serif italic text-xl sm:text-2xl md:text-3xl text-ink leading-[1.3] font-light">
        “{children}”
      </p>
      {(citation || source) && (
        <footer className="mt-3 text-xs sm:text-sm font-mono tracking-wider uppercase text-ink-muted">
          — {citation} {source && <span className="opacity-60">· {source}</span>}
        </footer>
      )}
    </blockquote>
  );
}
