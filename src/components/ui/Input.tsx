import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  helperText,
  error,
  icon,
  className = '',
  id,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono text-xs uppercase tracking-wider text-ink-muted font-medium"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-ink-muted pointer-events-none">{icon}</span>
        )}
        <input
          id={inputId}
          className={`w-full bg-paper-warm text-ink placeholder:text-ink-subtle border rounded-xs px-3.5 py-2.5 font-sans text-sm transition-all duration-200 focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-terracotta/70 bg-terracotta/5'
              : 'border-border-subtle hover:border-ink/30'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="font-sans text-xs text-terracotta mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="font-sans text-xs text-ink-muted mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function Textarea({
  label,
  helperText,
  error,
  className = '',
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  const generatedId = React.useId();
  const textareaId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="font-mono text-xs uppercase tracking-wider text-ink-muted font-medium"
        >
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full bg-paper-warm text-ink placeholder:text-ink-subtle border rounded-xs p-3.5 font-serif text-base leading-relaxed transition-all duration-200 focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta ${
          error
            ? 'border-terracotta/70 bg-terracotta/5'
            : 'border-border-subtle hover:border-ink/30'
        } ${className}`}
        {...props}
      />

      {error ? (
        <p className="font-sans text-xs text-terracotta mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="font-sans text-xs text-ink-muted mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}

export function Toggle({ checked, onChange, label, description, className = '' }: ToggleProps) {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer select-none ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
          checked ? 'bg-terracotta' : 'bg-ink/20'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="font-sans text-sm font-medium text-ink">{label}</span>}
          {description && <span className="font-sans text-xs text-ink-muted">{description}</span>}
        </div>
      )}
    </label>
  );
}
