import React from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'paper'
  | 'ghost'
  | 'capsule'
  | 'coral'
  | 'cobalt'
  | 'lime'
  | 'teal'
  | 'midnight'
  | 'cream'
  | 'sticker';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-sans font-medium tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF684D] focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none select-none active:scale-[0.98] cursor-pointer';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-sm',
    md: 'text-sm px-5 py-2.5 gap-2 rounded-sm',
    lg: 'text-base px-7 py-3.5 gap-2.5 rounded-sm font-semibold',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#191A2B] text-[#F7F3EC] hover:bg-[#25283F] shadow-sm border border-transparent',
    secondary:
      'bg-transparent text-[#191A2B] border border-[#191A2B]/25 hover:border-[#191A2B] hover:bg-[#191A2B]/5 dark:text-[#F7F3EC] dark:border-white/30 dark:hover:border-white dark:hover:bg-white/10',
    outline:
      'bg-transparent text-[#191A2B] border border-[#191A2B]/25 hover:border-[#191A2B] hover:bg-[#191A2B]/5 dark:text-[#F7F3EC] dark:border-white/30 dark:hover:border-white dark:hover:bg-white/10',
    paper:
      'bg-paper-warm text-ink border border-border-subtle hover:bg-paper-elevated shadow-paper',
    ghost:
      'bg-transparent text-ink-secondary hover:text-ink hover:bg-ink/5 border border-transparent',
    capsule:
      'bg-[#FF684D] text-white hover:bg-[#FF684D]/90 shadow-sm border border-transparent tracking-wide font-mono text-xs uppercase',
    coral:
      'bg-[#FF684D] text-white hover:bg-[#e8583e] border-2 border-[#191A2B] sticker-shadow active:translate-x-0.5 active:translate-y-0.5',
    cobalt:
      'bg-[#4F66E8] text-white hover:bg-[#3d52c7] border-2 border-[#191A2B] sticker-shadow active:translate-x-0.5 active:translate-y-0.5',
    lime: 'bg-[#B7DB50] text-[#191A2B] hover:bg-[#a5c93e] border-2 border-[#191A2B] sticker-shadow font-semibold active:translate-x-0.5 active:translate-y-0.5',
    teal: 'bg-[#39BFAE] text-[#191A2B] hover:bg-[#2fa899] border-2 border-[#191A2B] sticker-shadow font-semibold active:translate-x-0.5 active:translate-y-0.5',
    midnight:
      'bg-[#191A2B] text-[#F7F3EC] hover:bg-[#24263e] border-2 border-[#F7F3EC]/30 sticker-shadow active:translate-x-0.5 active:translate-y-0.5',
    cream:
      'bg-[#F7F3EC] text-[#191A2B] hover:bg-[#eae3d5] border-2 border-[#191A2B] sticker-shadow font-semibold active:translate-x-0.5 active:translate-y-0.5',
    sticker:
      'bg-[#F7D84B] text-[#191A2B] hover:bg-[#ebd044] border-2 border-[#191A2B] sticker-shadow font-bold active:translate-x-0.5 active:translate-y-0.5',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
}

export interface EditorialLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  subtle?: boolean;
}

export function EditorialLink({
  subtle = false,
  className = '',
  children,
  ...props
}: EditorialLinkProps) {
  return (
    <a
      className={`group relative inline-flex items-center gap-1.5 font-sans font-medium transition-colors duration-200 cursor-pointer ${
        subtle ? 'text-ink-muted hover:text-ink' : 'text-ink hover:text-terracotta'
      } ${className}`}
      {...props}
    >
      <span className="relative">
        {children}
        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-current opacity-40 group-hover:opacity-100 transition-opacity duration-200" />
      </span>
    </a>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'ghost' | 'paper' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  const sizeMap = {
    sm: 'w-7 h-7 p-1',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5',
  };

  const variantMap = {
    ghost: 'text-ink-secondary hover:text-ink hover:bg-ink/5',
    paper:
      'bg-paper-warm text-ink border border-border-subtle hover:bg-paper-elevated shadow-paper',
    secondary: 'text-ink border border-ink/20 hover:border-ink/60',
  };

  return (
    <button
      aria-label={label}
      title={label}
      className={`relative inline-flex items-center justify-center rounded-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer before:absolute before:-inset-1.5 before:content-[''] ${sizeMap[size]} ${variantMap[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
