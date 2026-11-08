import React from 'react';

type BadgeVariant =
  | 'locked'
  | 'unlocked'
  | 'memory'
  | 'date'
  | 'terracotta'
  | 'brass'
  | 'sage'
  | 'mono'
  | 'coral'
  | 'cobalt'
  | 'lime'
  | 'teal'
  | 'pink'
  | 'yellow'
  | 'tangerine'
  | 'midnight';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export function Badge({ variant = 'mono', icon, className = '', children, ...props }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 font-mono text-[11px] tracking-wider uppercase rounded-xs transition-colors duration-200';

  const variantStyles: Record<BadgeVariant, string> = {
    locked: 'bg-[#FF684D]/15 text-[#FF684D] border border-[#FF684D]/30 font-semibold',
    unlocked: 'bg-[#F7D84B]/20 text-[#191A2B] border border-[#F7D84B]/50 font-bold',
    memory: 'bg-[#4F66E8]/10 text-[#4F66E8] border border-[#4F66E8]/30 font-medium',
    date: 'bg-paper-warm text-ink-muted border border-border-hairline font-normal',
    terracotta: 'bg-terracotta/15 text-terracotta border border-terracotta/30',
    brass: 'bg-brass/15 text-brass border border-brass/30',
    sage: 'bg-sage/15 text-sage border border-sage/30',
    mono: 'bg-ink/5 text-ink-muted border border-border-hairline',
    coral: 'bg-[#FF684D] text-white border border-[#191A2B] font-bold shadow-xs',
    cobalt: 'bg-[#4F66E8] text-white border border-[#191A2B] font-bold shadow-xs',
    lime: 'bg-[#B7DB50] text-[#191A2B] border border-[#191A2B] font-bold shadow-xs',
    teal: 'bg-[#39BFAE] text-[#191A2B] border border-[#191A2B] font-bold shadow-xs',
    pink: 'bg-[#F3A9D5] text-[#191A2B] border border-[#191A2B] font-bold shadow-xs',
    yellow: 'bg-[#F7D84B] text-[#191A2B] border border-[#191A2B] font-bold shadow-xs',
    tangerine: 'bg-[#FFB93F] text-[#191A2B] border border-[#191A2B] font-bold shadow-xs',
    midnight: 'bg-[#191A2B] text-[#F7F3EC] border border-white/20 font-bold shadow-xs',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
