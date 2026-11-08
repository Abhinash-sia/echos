'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TimelineItem } from '@/types/timeline';
import {
  FeatherIcon,
  LockIcon,
  UnlockIcon,
  CalendarIcon,
  ArrowRightIcon,
  CameraIcon,
} from '@/components/icons/Icons';
import { CountdownTimer } from '@/components/capsules/CountdownTimer';

export interface TimelineItemCardProps {
  item: TimelineItem;
  className?: string;
}

export function TimelineItemCard({ item, className = '' }: TimelineItemCardProps) {
  const isMemory = item.type === 'memory';
  const itemDate = new Date(item.date);
  const formattedDate = itemDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (isMemory) {
    const memory = item;
    const hasPhotos = Array.isArray(memory.photos) && memory.photos.length > 0;

    return (
      <div className={`relative flex items-start gap-4 md:gap-6 group ${className}`}>
        {/* Timeline Marker on Spine */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--vibrant-teal)]/40 bg-[var(--surface-color)] neu-control flex items-center justify-center text-[var(--vibrant-teal)] group-hover:scale-110 transition-transform">
            <FeatherIcon size={16} />
          </div>
        </div>

        {/* Card Body */}
        <article className="flex-1 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] p-6 neu-raised hover:border-[var(--vibrant-teal)]/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-[var(--vibrant-teal)]/10 text-[var(--vibrant-teal)] border border-[var(--vibrant-teal)]/20">
                Memory
              </span>
              <span className="font-mono text-xs text-[var(--ink-muted)] flex items-center gap-1">
                <CalendarIcon size={12} />
                {formattedDate}
              </span>
            </div>

            {hasPhotos && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--ink-muted)]">
                <CameraIcon size={13} />
                <span>
                  {memory.photos.length} photo{memory.photos.length > 1 ? 's' : ''}
                </span>
              </span>
            )}
          </div>

          <h3 className="font-editorial text-2xl font-bold tracking-tight text-[var(--foreground)] group-hover:text-[var(--vibrant-teal)] transition-colors mb-2">
            <Link href={`/memories/${memory.id || memory._id}`}>{memory.title}</Link>
          </h3>

          {memory.content && (
            <p className="text-sm text-[var(--ink-muted)] line-clamp-3 leading-relaxed mb-4">
              {memory.content}
            </p>
          )}

          {/* Photo Preview Strip */}
          {hasPhotos && (
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {memory.photos.slice(0, 4).map((photo, pIdx) => {
                const photoSrc = photo.signedUrl || photo.url;
                if (!photoSrc) return null;
                return (
                  <div
                    key={photo._id || photo.id || pIdx}
                    className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/10 dark:border-white/10 shadow-sm"
                  >
                    <Image
                      src={photoSrc}
                      alt={photo.caption || memory.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                );
              })}
              {memory.photos.length > 4 && (
                <div className="w-16 h-16 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center font-mono text-xs text-[var(--ink-muted)] shrink-0">
                  +{memory.photos.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Tags and Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 dark:border-white/5">
            <div className="flex flex-wrap items-center gap-1.5">
              {memory.tags &&
                memory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[var(--ink-muted)]"
                  >
                    #{tag}
                  </span>
                ))}
            </div>

            <Link
              href={`/memories/${memory.id || memory._id}`}
              className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[var(--vibrant-teal)] hover:underline"
            >
              <span>Read reflection</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        </article>
      </div>
    );
  }

  // Capsule Item
  const capsule = item;
  const isLocked = Boolean(capsule.isLocked);
  const unlockTargetDate = new Date(capsule.unlockDate || capsule.date);

  return (
    <div className={`relative flex items-start gap-4 md:gap-6 group ${className}`}>
      {/* Timeline Marker on Spine */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-10 h-10 rounded-full border-2 bg-[var(--surface-color)] neu-control flex items-center justify-center transition-transform group-hover:scale-110 ${
            isLocked
              ? 'border-[var(--cobalt-blue)]/50 text-[var(--cobalt-blue)]'
              : 'border-[var(--electric-coral)]/50 text-[var(--electric-coral)]'
          }`}
        >
          {isLocked ? <LockIcon size={16} /> : <UnlockIcon size={16} />}
        </div>
      </div>

      {/* Card Body */}
      <article
        className={`flex-1 overflow-hidden rounded-2xl border bg-[var(--surface-color)] p-6 neu-raised hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 animate-fadeIn ${
          isLocked
            ? 'border-black/10 dark:border-white/10 hover:border-[var(--cobalt-blue)]/40'
            : 'border-black/10 dark:border-white/10 hover:border-[var(--electric-coral)]/40'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                isLocked
                  ? 'bg-[var(--cobalt-blue)]/10 text-[var(--cobalt-blue)] border border-[var(--cobalt-blue)]/20'
                  : 'bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] border border-[var(--electric-coral)]/30'
              }`}
            >
              {isLocked ? (
                <>
                  <LockIcon size={10} />
                  <span>Sealed Capsule</span>
                </>
              ) : (
                <>
                  <UnlockIcon size={10} />
                  <span>Unlocked Capsule</span>
                </>
              )}
            </span>

            <span className="font-mono text-xs text-[var(--ink-muted)] flex items-center gap-1">
              <CalendarIcon size={12} />
              {isLocked ? `Unlocks: ${formattedDate}` : `Unlocked: ${formattedDate}`}
            </span>
          </div>

          {capsule.sealedAt && (
            <span className="font-mono text-[10px] text-[var(--ink-muted)]">
              Sealed{' '}
              {new Date(capsule.sealedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        <h3
          className={`font-editorial text-2xl font-bold tracking-tight text-[var(--foreground)] transition-colors mb-2 ${
            isLocked
              ? 'group-hover:text-[var(--cobalt-blue)]'
              : 'group-hover:text-[var(--electric-coral)]'
          }`}
        >
          <Link href={`/capsules/${capsule.id || capsule._id}`}>{capsule.title}</Link>
        </h3>

        {/* Content depending on locked status */}
        {isLocked ? (
          <div className="space-y-3 my-4 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] block">
              Protected by Server-Enforced Date Locking
            </span>
            <CountdownTimer targetDate={unlockTargetDate} size="sm" />
            <p className="text-xs text-[var(--ink-muted)] italic">
              Letter contents and attachments are sealed on the server and will unlock on{' '}
              {formattedDate}.
            </p>
          </div>
        ) : (
          <div className="my-3">
            {capsule.message || capsule.content ? (
              <p className="text-sm text-[var(--ink-muted)] line-clamp-3 leading-relaxed">
                {capsule.message || capsule.content}
              </p>
            ) : (
              <p className="text-xs text-[var(--ink-muted)] italic">
                The appointed unlock time has arrived. Break the seal to view your letter.
              </p>
            )}
          </div>
        )}

        {/* Action Link */}
        <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
          <span className="font-mono text-xs text-[var(--ink-muted)]">
            {isLocked
              ? 'Immutable Storage'
              : capsule.isOpened
                ? 'Archived Capsule'
                : 'Awaiting Opening'}
          </span>

          <Link
            href={`/capsules/${capsule.id || capsule._id}`}
            className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
              isLocked
                ? 'text-[var(--cobalt-blue)] hover:underline'
                : 'text-[var(--electric-coral)] hover:underline'
            }`}
          >
            <span>
              {isLocked ? 'View Status' : capsule.isOpened ? 'Read Letter' : 'Open Capsule'}
            </span>
            <ArrowRightIcon size={12} />
          </Link>
        </div>
      </article>
    </div>
  );
}
