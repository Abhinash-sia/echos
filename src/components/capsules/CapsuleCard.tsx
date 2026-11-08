'use client';

import React from 'react';
import Link from 'next/link';
import { TimeCapsuleItem } from '@/types/capsule';
import { LockIcon, UnlockIcon, ArrowRightIcon, CalendarIcon } from '@/components/icons/Icons';
import { CountdownTimer } from './CountdownTimer';

export interface CapsuleCardProps {
  capsule: TimeCapsuleItem;
  className?: string;
}

export function CapsuleCard({ capsule, className = '' }: CapsuleCardProps) {
  const isLocked = Boolean(capsule.isLocked);
  const unlockDate = new Date(capsule.unlockDate || capsule.unlockAt!);
  const formattedUnlock = unlockDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedSealed = capsule.sealedAt
    ? new Date(capsule.sealedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fadeIn ${
        isLocked
          ? 'bg-[var(--surface-color)] border-black/10 dark:border-white/10 neu-raised hover:border-[var(--cobalt-blue)]/50'
          : 'bg-[var(--surface-color)] border-black/10 dark:border-white/10 neu-raised hover:border-[var(--electric-coral)]/50'
      } p-6 ${className}`}
    >
      {/* Top Header: Status Badges and Lock Indicator */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider bg-[var(--cobalt-blue)]/10 text-[var(--cobalt-blue)] border border-[var(--cobalt-blue)]/20">
              <LockIcon size={12} />
              <span>Sealed</span>
            </span>
          ) : capsule.isOpened ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <UnlockIcon size={12} />
              <span>Unsealed</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] border border-[var(--electric-coral)]/30 animate-pulse">
              <UnlockIcon size={12} />
              <span>Ready to Open</span>
            </span>
          )}

          {formattedSealed && (
            <span className="font-mono text-[10px] text-[var(--ink-muted)]">
              Sealed {formattedSealed}
            </span>
          )}
        </div>

        {/* Lock visual emblem */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
            isLocked
              ? 'bg-[var(--cobalt-blue)]/10 text-[var(--cobalt-blue)] border-[var(--cobalt-blue)]/20'
              : 'bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] border-[var(--electric-coral)]/20'
          }`}
        >
          {isLocked ? <LockIcon size={16} /> : <UnlockIcon size={16} />}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-3 mb-6">
        <h3 className="font-editorial text-2xl font-bold tracking-tight text-[var(--foreground)] group-hover:text-[var(--electric-coral)] transition-colors line-clamp-2">
          {capsule.title}
        </h3>

        {/* Date Details */}
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--ink-muted)]">
          <CalendarIcon size={14} />
          <span>Unlock Target: {formattedUnlock}</span>
        </div>

        {/* Locked Countdown or Message Excerpt */}
        {isLocked ? (
          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] block">
              Time Remaining Until Server Release
            </span>
            <CountdownTimer targetDate={unlockDate} size="sm" />
            <p className="font-mono text-[10px] text-[var(--ink-muted)] italic pt-1">
              Protected by server-enforced date locking. Contents hidden.
            </p>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
            {capsule.message ? (
              <p className="text-sm text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                {capsule.message}
              </p>
            ) : (
              <p className="text-xs text-[var(--ink-muted)] italic">
                The appointed time has arrived. Break the seal to view the letter.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
        <span className="font-mono text-xs text-[var(--ink-muted)]">
          {isLocked ? 'Date-Locked' : capsule.isOpened ? 'Archived Letter' : 'Awaiting Unsealing'}
        </span>

        <Link
          href={`/capsules/${capsule._id}`}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono text-xs font-semibold transition-all duration-200 ${
            isLocked
              ? 'bg-black/5 dark:bg-white/5 hover:bg-[var(--cobalt-blue)] hover:text-white text-[var(--foreground)]'
              : 'bg-[var(--electric-coral)] text-white hover:opacity-90 shadow-sm'
          }`}
        >
          <span>
            {isLocked ? 'View Status' : capsule.isOpened ? 'Read Letter' : 'Open Capsule'}
          </span>
          <ArrowRightIcon size={14} />
        </Link>
      </div>
    </article>
  );
}
