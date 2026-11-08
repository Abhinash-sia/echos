'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from './AppHeader';
import { AppNavigation } from './AppNavigation';
import { Container } from './Container';
import { Button } from '@/components/ui/Button';
import { ArchivalStamp } from '@/components/ui/ArchivalStamp';
import { LockIcon, SparklesIcon } from '@/components/icons/Icons';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { status, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Client-side UX redirect fallback if session check yields unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      const target = `/login?from=${encodeURIComponent(pathname)}`;
      router.push(target);
    }
  }, [status, pathname, router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EC] dark:bg-[#191A2B] text-[#191A2B] dark:text-[#F7F3EC] transition-colors duration-200">
      {/* 1. Master Application Header */}
      <AppHeader
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
      />

      {/* 2. Primary Navigation Bar */}
      <AppNavigation
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* 3. Main Content Area or State Fallbacks */}
      <main className="flex-1 flex flex-col">
        {isLoading ? (
          /* High-Contrast Playful Surrealism Loading State */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center flex flex-col items-center">
              <div className="relative mb-6">
                <ArchivalStamp variant="wax" size="md" className="animate-spin-slow opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center text-[#FF684D]">
                  <SparklesIcon size={20} />
                </div>
              </div>
              <h2 className="font-serif text-2xl font-normal text-[#191A2B] dark:text-[#F7F3EC] mb-2">
                Consulting the Archives
              </h2>
              <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] max-w-xs mb-6">
                Restoring your private session through server-enforced credentials...
              </p>
              <div className="w-48 h-1.5 bg-[#EFE9DE] dark:bg-[#25283F] rounded-full overflow-hidden">
                <div className="h-full bg-[#FF684D] rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          </div>
        ) : !isAuthenticated ? (
          /* Unauthenticated State Fallback */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white dark:bg-[#25283F] border-2 border-[#191A2B] dark:border-white/20 p-8 rounded-sm shadow-xl text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-sm bg-[#FF684D]/15 text-[#FF684D] flex items-center justify-center mb-4">
                <LockIcon size={24} />
              </div>
              <h2 className="font-serif text-2xl font-normal text-[#191A2B] dark:text-[#F7F3EC] mb-2">
                Authentication Required
              </h2>
              <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] mb-6">
                This memory vault requires an active authenticated session.
              </p>
              <Button
                variant="coral"
                size="md"
                onClick={() => router.push(`/login?from=${encodeURIComponent(pathname)}`)}
                className="w-full justify-center"
              >
                Sign In to Vault
              </Button>
            </div>
          </div>
        ) : (
          /* Authenticated Workspace Content with Hardware-Accelerated Page Entrance */
          <div key={pathname} className="animate-fadeIn flex-1 flex flex-col">
            {children}
          </div>
        )}
      </main>

      {/* 4. Minimalist Archival Footer */}
      <footer className="w-full border-t border-[#191A2B]/10 dark:border-white/10 py-6 bg-[#EFE9DE]/50 dark:bg-[#1E2035]/50">
        <Container size="wide">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7]">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-[#191A2B] dark:text-[#F7F3EC]">
                ECHOES
              </span>
              <span>· Digital Memory Vault & Personal Time Capsule</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-[#39BFAE] font-semibold">● SESSION SECURED</span>
              <span>·</span>
              <span>Inviolable Date-Locking</span>
              <span>·</span>
              <span>Phase 5A</span>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
