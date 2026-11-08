'use client';

import { useEffect } from 'react';

export function ThemeInitializer() {
  useEffect(() => {
    const syncTheme = () => {
      const saved = localStorage.getItem('echoes-theme');
      const isDark = saved === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Initial sync
    syncTheme();

    const handleStorageChange = (e: StorageEvent | Event) => {
      if ('key' in e && e.key !== 'echoes-theme' && e.key !== null) return;
      syncTheme();
    };

    window.addEventListener('echoes-theme-change', syncTheme);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('echoes-theme-change', syncTheme);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return null;
}
