'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircleIcon } from '@/components/icons/Icons';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isConfirming?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isConfirming = false,
}: ConfirmationDialogProps) {
  const buttonVariant =
    variant === 'danger' ? 'coral' : variant === 'warning' ? 'coral' : 'primary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center pt-2">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            variant === 'danger'
              ? 'bg-[#FF684D]/15 text-[#FF684D]'
              : variant === 'warning'
                ? 'bg-[#E0A838]/15 text-[#E0A838]'
                : 'bg-[#4F66E8]/15 text-[#4F66E8]'
          }`}
        >
          <AlertCircleIcon size={24} />
        </div>

        <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#191A2B] dark:text-[#F7F3EC] mb-2">
          {title}
        </h3>

        <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] leading-relaxed mb-6 max-w-sm">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3 w-full border-t border-[#191A2B]/10 dark:border-white/10 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isConfirming}>
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={buttonVariant}
            size="sm"
            onClick={onConfirm}
            loading={isConfirming}
            disabled={isConfirming}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
