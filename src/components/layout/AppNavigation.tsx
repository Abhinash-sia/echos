'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from './Container';
import { useAuth } from '@/contexts/AuthContext';
import {
  FeatherIcon,
  LockIcon,
  CalendarIcon,
  SparklesIcon,
  UserIcon,
  SettingsIcon,
  LayoutGridIcon,
} from '@/components/icons/Icons';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  tag?: string;
}

export const APP_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <SparklesIcon size={16} />,
  },
  {
    label: 'My Journal',
    href: '/memories',
    icon: <FeatherIcon size={16} />,
  },
  {
    label: 'Time Capsules',
    href: '/capsules',
    icon: <LockIcon size={16} />,
  },
  {
    label: 'Timeline',
    href: '/timeline',
    icon: <CalendarIcon size={16} />,
  },
  {
    label: 'AI Board',
    href: '/board',
    icon: <LayoutGridIcon size={16} />,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: <UserIcon size={16} />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <SettingsIcon size={16} />,
  },
];

export interface AppNavigationProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AppNavigation({ isMobileOpen = false, onCloseMobile }: AppNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {/* =========================================================================
          1. DESKTOP SUB-HEADER NAVIGATION BAR
          ========================================================================= */}
      <nav
        aria-label="Application navigation"
        className="w-full bg-[#EFE9DE]/90 dark:bg-[#1E2035]/90 border-b border-[#191A2B]/10 dark:border-white/10 hidden md:block"
      >
        <Container size="wide">
          <div className="flex items-center justify-between h-12">
            <ul className="flex items-center gap-1.5 list-none p-0 m-0">
              {APP_NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm font-sans text-xs tracking-wide font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-[#191A2B] text-[#F7F3EC] dark:bg-white dark:text-[#191A2B] shadow-xs font-semibold'
                          : 'text-[#484C69] dark:text-[#A4AAC7] hover:text-[#191A2B] dark:hover:text-white hover:bg-[#191A2B]/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className={isActive ? 'text-[#FF684D]' : 'opacity-70'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-4 text-xs font-mono text-[#767C9D] dark:text-[#A4AAC7]">
              <Link
                href="/showcase"
                className="hover:text-[#FF684D] transition-colors flex items-center gap-1"
              >
                <span>Design Showcase</span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-[#4F66E8]/10 text-[#4F66E8] font-bold">
                  v5A
                </span>
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      {/* =========================================================================
          2. MOBILE SLIDE-OUT / DRAWER OVERLAY (Animated & Accessible)
          ========================================================================= */}
      {isMobileOpen && (
        <MobileNavDrawer
          pathname={pathname}
          user={user}
          onClose={onCloseMobile}
        />
      )}
    </>
  );
}

interface MobileNavDrawerProps {
  pathname: string;
  user: { name?: string; email?: string } | null;
  onClose?: () => void;
}

function MobileNavDrawer({ pathname, user, onClose }: MobileNavDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Body scroll lock while drawer is open
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && onClose) {
        onClose();
        return;
      }

      // Trap Tab focus inside mobile drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !drawerRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !drawerRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
      className="fixed inset-0 z-50 md:hidden bg-[#191A2B]/60 backdrop-blur-xs flex flex-col animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="w-full max-w-xs bg-[#F7F3EC] dark:bg-[#191A2B] h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-fadeIn outline-none transition-transform duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header inside drawer */}
          <div className="flex items-center justify-between pb-4 border-b border-[#191A2B]/10 dark:border-white/10 mb-6">
            <span className="font-serif text-xl text-[#191A2B] dark:text-[#F7F3EC]">ECHOES</span>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-sm text-[#767C9D] hover:text-[#191A2B] dark:hover:text-[#F7F3EC] hover:bg-[#191A2B]/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF684D]"
              aria-label="Close navigation menu"
            >
              ✕
            </button>
          </div>

          {/* User profile strip */}
          {user && (
            <Link
              href="/profile"
              onClick={onClose}
              className="mb-6 p-3 rounded-sm bg-[#EFE9DE] dark:bg-[#25283F] border border-[#191A2B]/10 dark:border-white/10 flex items-center gap-3 hover:border-[#FF684D]/40 transition-colors cursor-pointer group"
              title="View your profile"
            >
              <div className="w-8 h-8 rounded-sm bg-[#4F66E8] text-white flex items-center justify-center font-mono text-xs font-bold group-hover:scale-105 transition-transform">
                <UserIcon size={14} />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-sans text-xs font-semibold text-[#191A2B] dark:text-[#F7F3EC] group-hover:text-[#FF684D] transition-colors truncate">
                  {user.name}
                </span>
                <span className="font-mono text-[10px] text-[#767C9D] dark:text-[#A4AAC7] truncate">
                  {user.email}
                </span>
              </div>
            </Link>
          )}

          {/* Nav links */}
          <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
            {APP_NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-sm font-sans text-sm tracking-wide transition-all ${
                      isActive
                        ? 'bg-[#191A2B] text-[#F7F3EC] dark:bg-white dark:text-[#191A2B] font-semibold shadow-xs'
                        : 'text-[#484C69] dark:text-[#A4AAC7] hover:bg-[#191A2B]/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className={isActive ? 'text-[#FF684D]' : 'opacity-70'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 pt-4 border-t border-[#191A2B]/10 dark:border-white/10">
            <Link
              href="/showcase"
              onClick={onClose}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono text-[#767C9D] dark:text-[#A4AAC7] hover:text-[#FF684D] transition-colors"
            >
              <SparklesIcon size={14} />
              <span>Design Showcase</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
