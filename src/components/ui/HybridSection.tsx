import React from 'react';

export type HybridEnvironment = 'cream' | 'midnight' | 'coral' | 'cobalt' | 'teal' | 'split';

export interface HybridSectionProps extends React.HTMLAttributes<HTMLElement> {
  environment?: HybridEnvironment;
  bleed?: boolean;
  grain?: boolean;
  crosshairs?: boolean;
  as?: React.ElementType;
}

/**
 * HybridSection: First-class container for intentional hybrid light/dark visual environments.
 * Automatically configures foreground, background, border, and accent contrast tokens.
 */
export function HybridSection({
  environment = 'cream',
  bleed = false,
  grain = true,
  crosshairs = false,
  as: Component = 'section',
  className = '',
  children,
  ...props
}: HybridSectionProps) {
  const environmentStyles: Record<HybridEnvironment, string> = {
    cream:
      '[--text-primary:#191A2B] [--text-secondary:#484C69] [--text-muted:#767C9D] [--color-ink:#191A2B] [--color-ink-secondary:#484C69] [--color-ink-muted:#767C9D] bg-[#F7F3EC] text-[#191A2B] border-b border-[#191A2B]/10',
    midnight:
      '[--text-primary:#F7F3EC] [--text-secondary:#C5CAE8] [--text-muted:#888EB2] [--color-ink:#F7F3EC] [--color-ink-secondary:#C5CAE8] [--color-ink-muted:#888EB2] bg-[#191A2B] text-[#F7F3EC] border-b border-white/10 dark',
    coral:
      '[--text-primary:#FFFFFF] [--text-secondary:#FFE4DE] [--text-muted:#FFCDC2] [--color-ink:#FFFFFF] bg-[#FF684D] text-white border-b border-black/15 selection:bg-[#191A2B] selection:text-white',
    cobalt:
      '[--text-primary:#FFFFFF] [--text-secondary:#DDE3FF] [--text-muted:#C0CBFF] [--color-ink:#FFFFFF] bg-[#4F66E8] text-white border-b border-black/15 selection:bg-[#FFB93F] selection:text-[#191A2B]',
    teal: '[--text-primary:#191A2B] [--text-secondary:#1F4D47] [--text-muted:#28635B] [--color-ink:#191A2B] bg-[#39BFAE] text-[#191A2B] border-b border-black/15 selection:bg-[#FF684D] selection:text-white',
    split:
      '[--text-primary:#191A2B] [--color-ink:#191A2B] relative bg-[#F7F3EC] text-[#191A2B] border-b border-[#191A2B]/10',
  };

  return (
    <Component
      data-environment={environment}
      className={`relative w-full overflow-hidden transition-colors duration-300 ${
        bleed ? 'w-screen relative left-1/2 -translate-x-1/2' : ''
      } ${grain ? 'film-grain' : ''} ${environmentStyles[environment]} ${className}`}
      {...props}
    >
      {/* Editorial Crosshair Corner Markers */}
      {crosshairs && (
        <>
          <span
            aria-hidden="true"
            className="absolute top-3 left-4 font-mono text-xs opacity-30 select-none pointer-events-none"
          >
            +
          </span>
          <span
            aria-hidden="true"
            className="absolute top-3 right-4 font-mono text-xs opacity-30 select-none pointer-events-none"
          >
            +
          </span>
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-4 font-mono text-xs opacity-30 select-none pointer-events-none"
          >
            +
          </span>
          <span
            aria-hidden="true"
            className="absolute bottom-3 right-4 font-mono text-xs opacity-30 select-none pointer-events-none"
          >
            +
          </span>
        </>
      )}

      {children}
    </Component>
  );
}
