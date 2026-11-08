import React from 'react';
import { FeatherIcon } from '../icons/Icons';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 sm:p-16 border border-dashed border-border-subtle rounded-sm bg-paper-warm/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-paper-elevated border border-border-hairline flex items-center justify-center text-terracotta mb-5">
        {icon || <FeatherIcon size={22} />}
      </div>

      <h3 className="font-serif text-2xl font-normal text-ink mb-2">{title}</h3>

      <p className="font-sans text-sm text-ink-muted max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
