'use client';

import React, { useEffect, useRef } from 'react';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/Icons';

export interface LightboxPhoto {
  signedUrl?: string;
  url?: string;
  caption?: string;
  _id?: string;
  id?: string;
}

export interface PhotoLightboxProps {
  isOpen: boolean;
  photos: LightboxPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate?: (newIndex: number) => void;
  title?: string;
}

export function PhotoLightbox({
  isOpen,
  photos,
  currentIndex,
  onClose,
  onNavigate,
  title = 'Photograph Preview',
}: PhotoLightboxProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const total = photos.length;
  const currentPhoto = photos[currentIndex] || photos[0];

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null;

    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'ArrowRight' && onNavigate && total > 1) {
        onNavigate((currentIndex + 1) % total);
      } else if (e.key === 'ArrowLeft' && onNavigate && total > 1) {
        onNavigate((currentIndex - 1 + total) % total);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, currentIndex, total, onClose, onNavigate]);

  if (!isOpen || !currentPhoto) return null;

  const photoUrl = currentPhoto.signedUrl || currentPhoto.url || '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 bg-[#191A2B]/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative max-w-5xl w-full max-h-[92vh] bg-white dark:bg-[#1E2035] border-2 border-[#191A2B]/30 dark:border-white/20 rounded-sm overflow-hidden p-3 sm:p-4 shadow-2xl flex flex-col items-center animate-fadeInScale outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#191A2B]/10 dark:border-white/10 font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7]">
          <span>{total > 1 ? `Photo ${currentIndex + 1} of ${total}` : 'Archival Exposure'}</span>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-sm bg-[#191A2B]/10 dark:bg-white/10 hover:bg-[#FF684D] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF684D]"
            aria-label="Close photo preview"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Photo Container with Navigation Overlays */}
        <div className="relative w-full flex-1 flex items-center justify-center min-h-[300px] max-h-[72vh] overflow-hidden rounded-xs bg-[#EFE9DE]/50 dark:bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={currentPhoto.caption || title}
            className="max-h-[70vh] max-w-full w-auto object-contain select-none transition-transform duration-300"
          />

          {/* Previous Photo Button */}
          {total > 1 && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate((currentIndex - 1 + total) % total)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#191A2B]/75 text-white hover:bg-[#FF684D] transition-all flex items-center justify-center shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF684D]"
              aria-label="Previous photograph"
            >
              <ChevronLeftIcon size={20} />
            </button>
          )}

          {/* Next Photo Button */}
          {total > 1 && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate((currentIndex + 1) % total)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#191A2B]/75 text-white hover:bg-[#FF684D] transition-all flex items-center justify-center shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF684D]"
              aria-label="Next photograph"
            >
              <ChevronRightIcon size={20} />
            </button>
          )}
        </div>

        {/* Caption */}
        {currentPhoto.caption && (
          <p className="font-mono text-xs text-center text-[#191A2B] dark:text-[#F7F3EC] mt-3 max-w-xl truncate px-4">
            {currentPhoto.caption}
          </p>
        )}
      </div>
    </div>
  );
}
