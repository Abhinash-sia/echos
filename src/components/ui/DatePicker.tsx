'use client';

import React from 'react';
import { CalendarIcon } from '@/components/icons/Icons';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function DatePicker({
  label,
  helperText,
  error,
  className = '',
  id,
  min,
  max,
  ...props
}: DatePickerProps) {
  const generatedId = React.useId();
  const dateId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={dateId}
          className="font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7] font-medium"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-[#767C9D] dark:text-[#A4AAC7] pointer-events-none">
          <CalendarIcon size={16} />
        </span>
        <input
          type="date"
          id={dateId}
          min={min}
          max={max}
          className={`w-full bg-[#EFE9DE] dark:bg-[#1E2035] text-[#191A2B] dark:text-[#F7F3EC] border rounded-xs pl-10 pr-3.5 py-2.5 font-mono text-sm transition-all duration-200 focus:outline-none focus:border-[#FF684D] focus:ring-1 focus:ring-[#FF684D] ${
            error
              ? 'border-[#FF684D]/70 bg-[#FF684D]/5'
              : 'border-[#191A2B]/15 dark:border-white/15 hover:border-[#191A2B]/30 dark:border-white/30'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="font-sans text-xs text-[#FF684D] mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
