'use client';

import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
}

export function Select({
  label,
  helperText,
  error,
  options,
  children,
  className = '',
  id,
  ...props
}: SelectProps) {
  const generatedId = React.useId();
  const selectId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7] font-medium"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          className={`w-full appearance-none bg-[#EFE9DE] dark:bg-[#1E2035] text-[#191A2B] dark:text-[#F7F3EC] border rounded-xs px-3.5 py-2.5 pr-10 font-sans text-sm transition-all duration-200 focus:outline-none focus:border-[#FF684D] focus:ring-1 focus:ring-[#FF684D] ${
            error
              ? 'border-[#FF684D]/70 bg-[#FF684D]/5'
              : 'border-[#191A2B]/15 dark:border-white/15 hover:border-[#191A2B]/30 dark:hover:border-white/30'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {/* Custom Chevron Indicator */}
        <div className="absolute right-3.5 pointer-events-none text-[#767C9D] dark:text-[#A4AAC7]">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {error ? (
        <p className="font-sans text-xs text-[#FF684D] mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
