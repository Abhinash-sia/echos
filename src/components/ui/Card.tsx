import React from 'react';
import { Badge } from './Badge';
import { LockIcon, UnlockIcon, FeatherIcon, CalendarIcon } from '../icons/Icons';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'paper' | 'elevated' | 'outline' | 'film' | 'surreal' | 'midnight' | 'cream';
  hoverable?: boolean;
}

export function Card({
  variant = 'paper',
  hoverable = true,
  className = '',
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    paper: 'bg-paper-warm border border-border-hairline shadow-paper',
    elevated: 'bg-paper-elevated border border-border-subtle shadow-elevated',
    outline: 'bg-transparent border border-border-subtle',
    film: 'bg-paper border border-border-strong relative',
    surreal:
      'bg-white text-[#191A2B] border-2 border-[#191A2B] sticker-shadow rounded-sm dark:bg-[#22253B] dark:text-[#F7F3EC] dark:border-white/20',
    midnight: 'bg-[#191A2B] text-[#F7F3EC] border border-white/15 shadow-elevated rounded-sm dark',
    cream: 'bg-[#F7F3EC] text-[#191A2B] border border-[#191A2B]/15 shadow-paper rounded-sm',
  };

  const hoverStyles = hoverable ? 'transition-all duration-200 hover:-translate-y-0.5' : '';

  return (
    <div
      className={`rounded-sm p-6 sm:p-7 text-ink ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface MemoryCardProps {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  tags?: string[];
  photoCount?: number;
  imageUrl?: string;
  className?: string;
  onClick?: () => void;
}

export function MemoryCard({
  title,
  date,
  excerpt,
  tags = [],
  photoCount = 0,
  imageUrl,
  className = '',
  onClick,
}: MemoryCardProps) {
  return (
    <article
      onClick={onClick}
      className={`group relative flex flex-col justify-between bg-paper-warm border border-border-hairline p-6 sm:p-7 rounded-sm transition-all duration-300 hover:border-ink/25 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-ink-muted font-mono text-xs">
            <CalendarIcon size={14} className="opacity-70" />
            <time dateTime={date}>{date}</time>
          </div>
          <Badge variant="memory" icon={<FeatherIcon size={11} />}>
            Memory
          </Badge>
        </div>

        <h3 className="font-serif text-2xl font-normal text-ink group-hover:text-terracotta transition-colors duration-200 leading-snug mb-3">
          {title}
        </h3>

        <p className="font-sans text-sm text-ink-secondary line-clamp-3 leading-relaxed mb-6">
          {excerpt}
        </p>
      </div>

      {imageUrl && (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xs bg-paper-elevated border border-border-hairline mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border-hairline/60">
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
        {photoCount > 0 && (
          <span className="font-mono text-xs text-ink-muted">
            {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
          </span>
        )}
      </div>
    </article>
  );
}

export interface CapsuleTeaserCardProps {
  id: string;
  title: string;
  unlockDate: string;
  sealedAt: string;
  isLocked: boolean;
  timeRemaining?: string;
  className?: string;
  onClick?: () => void;
}

export function CapsuleTeaserCard({
  title,
  unlockDate,
  sealedAt,
  isLocked,
  timeRemaining = 'Sealed until unlock date',
  className = '',
  onClick,
}: CapsuleTeaserCardProps) {
  return (
    <article
      onClick={onClick}
      className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-sm border transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${
        isLocked
          ? 'bg-paper-warm border-terracotta/25 hover:border-terracotta/60 hover:shadow-glow'
          : 'bg-paper-warm border-brass/30 hover:border-brass/70 hover:shadow-elevated'
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <Badge
            variant={isLocked ? 'locked' : 'unlocked'}
            icon={isLocked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
          >
            {isLocked ? 'Temporal Lock' : 'Ready to Open'}
          </Badge>
          <span className="font-mono text-[11px] text-ink-muted">Sealed {sealedAt}</span>
        </div>

        <h3 className="font-serif text-2xl font-normal text-ink group-hover:text-terracotta transition-colors duration-200 leading-snug mb-3">
          {title}
        </h3>

        <div className="p-4 rounded-xs bg-paper/60 border border-border-hairline mb-6 font-mono text-xs">
          <div className="text-ink-muted uppercase tracking-wider mb-1">Unlock Milestone</div>
          <div className="text-sm font-semibold text-ink flex items-center gap-2">
            <CalendarIcon size={14} className="text-terracotta" />
            <span>{unlockDate}</span>
          </div>
          {isLocked && (
            <div className="mt-2 text-xs text-terracotta font-medium flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
              <span>{timeRemaining}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border-hairline/60">
        <span className="font-mono text-xs text-ink-muted">
          {isLocked ? 'Secret Letter Sealed' : 'Artifacts Revealed'}
        </span>
        <span className="font-mono text-xs font-semibold text-terracotta group-hover:translate-x-1 transition-transform">
          {isLocked ? 'Inspect Vault →' : 'Unseal Now →'}
        </span>
      </div>
    </article>
  );
}
