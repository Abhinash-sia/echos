'use client';

import React, { useEffect, useRef, useId } from 'react';
import { CloseIcon } from '../icons/Icons';
import { IconButton } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className = '',
}: ModalProps) {
  const modalCardRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element for focus restoration upon modal dismissal
    previouslyFocusedElementRef.current =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null;

    // Focus initial element inside modal
    const focusTimer = setTimeout(() => {
      if (modalCardRef.current) {
        const focusable = modalCardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          modalCardRef.current.focus();
        }
      }
    }, 50);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      // Focus trapping within the modal dialog
      if (e.key === 'Tab') {
        if (!modalCardRef.current) return;

        const focusableElements = Array.from(
          modalCardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null); // only visible elements

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (
            document.activeElement === firstElement ||
            !modalCardRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (
            document.activeElement === lastElement ||
            !modalCardRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);

      // Restore focus to original element when modal closes
      if (previouslyFocusedElementRef.current && previouslyFocusedElementRef.current.focus) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    full: 'max-w-5xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalCardRef}
        tabIndex={-1}
        className={`relative w-full ${sizeClasses[size]} bg-paper border border-border-subtle shadow-elevated rounded-sm p-6 sm:p-8 z-10 transition-all duration-300 animate-in zoom-in-95 outline-none ${className}`}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            {title && (
              <h2
                id={titleId}
                className="font-serif text-2xl sm:text-3xl font-normal text-ink leading-tight"
              >
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="font-sans text-sm text-ink-muted mt-1">
                {description}
              </p>
            )}
          </div>

          <IconButton
            label="Close dialog"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-ink-muted hover:text-ink shrink-0"
          >
            <CloseIcon size={18} />
          </IconButton>
        </div>

        <div className="text-ink">{children}</div>
      </div>
    </div>
  );
}
