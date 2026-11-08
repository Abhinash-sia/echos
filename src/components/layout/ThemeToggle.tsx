'use client';

import React, { useSyncExternalStore } from 'react';
import { SunIcon, MoonIcon } from '../icons/Icons';
import { IconButton } from '../ui/Button';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('echoes-theme-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('echoes-theme-change', callback);
  };
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('echoes-theme') === 'dark';
}

function getServerSnapshot(): boolean {
  return false;
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const nextDark = !isDark;
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('echoes-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('echoes-theme', 'light');
    }
    window.dispatchEvent(new CustomEvent('echoes-theme-change', { detail: { isDark: nextDark } }));
  };

  return (
    <IconButton
      label={isDark ? 'Switch to Editorial Light' : 'Switch to Cinematic Dark'}
      variant="ghost"
      size="md"
      data-theme-toggle="true"
      onClick={toggleTheme}
      className={`text-[#191A2B] dark:text-[#F7F3EC] hover:text-[#FF684D] active:scale-90 transition-transform ${className}`}
    >
      <span
        className={`inline-flex transition-transform duration-300 ease-out ${
          isDark ? 'rotate-90 text-[#FF684D]' : 'rotate-0 text-[#191A2B]'
        }`}
      >
        {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
      </span>
    </IconButton>
  );
}
