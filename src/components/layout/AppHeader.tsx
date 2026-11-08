'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Container } from './Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LogOutIcon, MenuIcon, CloseIcon, SettingsIcon } from '@/components/icons/Icons';

export interface AppHeaderProps {
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

export function AppHeader({ onToggleMobileNav, isMobileNavOpen }: AppHeaderProps) {
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('[AppHeader] Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Derive user initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F7F3EC]/90 dark:bg-[#191A2B]/90 backdrop-blur-md border-b border-[#191A2B]/10 dark:border-white/10 transition-colors duration-200">
      <Container size="wide">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Brand Identity & Active Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Navigation Toggle Button */}
            <button
              type="button"
              onClick={onToggleMobileNav}
              className="md:hidden p-2 -ml-2 rounded-sm text-[#191A2B] dark:text-[#F7F3EC] hover:bg-[#191A2B]/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF684D]"
              aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileNavOpen}
            >
              {isMobileNavOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
            </button>

            <Link
              href="/dashboard"
              className="group flex items-baseline gap-2.5 text-[#191A2B] dark:text-[#F7F3EC] focus-visible:outline-none"
            >
              <span className="font-serif text-2xl sm:text-3xl tracking-tight font-normal group-hover:text-[#FF684D] transition-colors">
                ECHOES
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#767C9D] dark:text-[#A4AAC7] hidden sm:inline">
                残響 · PERSONAL VAULT
              </span>
            </Link>

            <Badge variant="coral" className="hidden lg:inline-flex">
              LIVE WORKSPACE
            </Badge>
          </div>

          {/* Right: User Profile, Sign Out, Settings, Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Authenticated User Status */}
            {user ? (
              <Link
                href="/profile"
                title="View your profile"
                className="flex items-center gap-2 sm:gap-3 bg-[#EFE9DE]/80 dark:bg-[#25283F]/80 border border-[#191A2B]/10 dark:border-white/10 hover:border-[#FF684D]/40 px-2.5 py-1.5 rounded-sm transition-colors group cursor-pointer"
              >
                {/* User Avatar Pill */}
                <div className="w-7 h-7 rounded-sm bg-[#4F66E8] text-white flex items-center justify-center font-mono text-xs font-bold shadow-xs group-hover:scale-105 transition-transform">
                  {initials}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-sans text-xs font-semibold text-[#191A2B] dark:text-[#F7F3EC] leading-tight max-w-[130px] truncate group-hover:text-[#FF684D] transition-colors">
                    {user.name}
                  </span>
                  <span className="font-mono text-[10px] text-[#767C9D] dark:text-[#A4AAC7] leading-tight max-w-[130px] truncate">
                    {user.email}
                  </span>
                </div>
              </Link>
            ) : isLoading ? (
              <div className="h-8 w-24 bg-[#191A2B]/5 dark:bg-white/5 animate-pulse rounded-sm" />
            ) : null}

            {/* Settings Quick Link */}
            {user && (
              <Link
                href="/settings"
                className="p-2 rounded-sm text-[#767C9D] dark:text-[#A4AAC7] hover:text-[#191A2B] dark:hover:text-white hover:bg-[#191A2B]/5 dark:hover:bg-white/5 transition-colors hidden sm:inline-flex"
                title="Account Settings"
                aria-label="Account Settings"
              >
                <SettingsIcon size={18} />
              </Link>
            )}

            {/* Logout Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              loading={isLoggingOut}
              icon={<LogOutIcon size={14} />}
              className="hidden sm:inline-flex"
              title="Sign out of your account"
            >
              Sign Out
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </Container>
    </header>
  );
}
