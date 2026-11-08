'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Toast, ToastItem, ToastType } from '@/components/ui/Toast';

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => string;
  dismissToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = DEFAULT_DURATION) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      addToast('success', title, message, duration),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      addToast('error', title, message, duration),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      addToast('warning', title, message, duration),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      addToast('info', title, message, duration),
    [addToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      dismissToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, addToast, dismissToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Global Toast Viewport */}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm sm:max-w-md w-full px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
