'use client';

import React from 'react';
import { AlertCircleIcon } from '@/components/icons/Icons';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred while communicating with the archive. Please try again.',
  retryLabel = 'Try Again',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-[#FF684D]/30 rounded-sm bg-[#FF684D]/5 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#FF684D]/15 text-[#FF684D] flex items-center justify-center mb-4">
        <AlertCircleIcon size={24} />
      </div>

      <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#191A2B] dark:text-[#F7F3EC] mb-2">
        {title}
      </h3>

      <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {onRetry && (
        <Button variant="coral" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
