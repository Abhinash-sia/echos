'use client';

import React from 'react';
import { CheckIcon, AlertCircleIcon, CloseIcon, SparklesIcon } from '@/components/icons/Icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const typeConfig: Record<
    ToastType,
    {
      borderColor: string;
      accentBg: string;
      iconColor: string;
      icon: React.ReactNode;
      role: 'alert' | 'status';
      ariaLive: 'assertive' | 'polite';
    }
  > = {
    success: {
      borderColor: 'border-[#2D9CDB]/40 dark:border-[#2D9CDB]/40',
      accentBg: 'bg-[#2D9CDB]/10 text-[#2D9CDB]',
      iconColor: 'text-[#2D9CDB]',
      icon: <CheckIcon size={16} />,
      role: 'status',
      ariaLive: 'polite',
    },
    error: {
      borderColor: 'border-[#FF684D]/50 dark:border-[#FF684D]/50',
      accentBg: 'bg-[#FF684D]/10 text-[#FF684D]',
      iconColor: 'text-[#FF684D]',
      icon: <AlertCircleIcon size={16} />,
      role: 'alert',
      ariaLive: 'assertive',
    },
    warning: {
      borderColor: 'border-[#E0A838]/50 dark:border-[#E0A838]/50',
      accentBg: 'bg-[#E0A838]/10 text-[#E0A838]',
      iconColor: 'text-[#E0A838]',
      icon: <AlertCircleIcon size={16} />,
      role: 'alert',
      ariaLive: 'assertive',
    },
    info: {
      borderColor: 'border-[#4F66E8]/40 dark:border-[#4F66E8]/40',
      accentBg: 'bg-[#4F66E8]/10 text-[#4F66E8]',
      iconColor: 'text-[#4F66E8]',
      icon: <SparklesIcon size={16} />,
      role: 'status',
      ariaLive: 'polite',
    },
  };

  const config = typeConfig[toast.type];

  return (
    <div
      role={config.role}
      aria-live={config.ariaLive}
      className={`pointer-events-auto flex w-full max-w-sm sm:max-w-md items-start gap-3 p-3.5 rounded-sm bg-[#F7F3EC] dark:bg-[#1E2035] border ${config.borderColor} shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-top-2`}
    >
      <div
        className={`w-7 h-7 rounded-xs shrink-0 flex items-center justify-center ${config.accentBg}`}
      >
        {config.icon}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <p className="font-sans text-xs font-semibold text-[#191A2B] dark:text-[#F7F3EC] leading-snug">
          {toast.title}
        </p>
        {toast.message && (
          <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xs text-[#767C9D] dark:text-[#A4AAC7] hover:text-[#191A2B] dark:hover:text-white hover:bg-[#191A2B]/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF684D] relative before:absolute before:-inset-2 before:content-['']"
        aria-label="Dismiss notification"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
