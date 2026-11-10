'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Container } from './Container';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/Button';
import { SparklesIcon, ArrowRightIcon } from '../icons/Icons';

export function EditorialHeader() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#EDE5D0]/88 dark:bg-[#12100D]/90 backdrop-blur-md border-b border-[#191A2B]/10 dark:border-amber-200/10 transition-colors duration-200">
      <Container size="wide">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Identity */}
          <Link
            href="/"
            className="group flex items-baseline gap-2.5 text-[#191A2B] dark:text-[#F7F3EC] focus-visible:outline-none"
          >
            <span className="font-serif text-2xl sm:text-3xl tracking-tight font-normal group-hover:text-[#FF684D] transition-colors">
              ECHOES
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#767C9D] dark:text-[#9E927F] opacity-80 hidden sm:inline">
              残響 · MEMORY VAULT
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-5 sm:gap-7 font-sans text-xs uppercase tracking-widest font-medium text-[#484C69] dark:text-[#C8BCAA]">
            <Link
              href="/showcase"
              className="hover:text-[#191A2B] dark:hover:text-[#F7F3EC] transition-colors"
            >
              Showcase
            </Link>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="text-[#FF684D] hover:text-[#191A2B] dark:hover:text-[#F7F3EC] transition-colors font-semibold flex items-center gap-1.5"
              >
                <span>Enter Vault</span>
                <ArrowRightIcon size={12} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="hover:text-[#191A2B] dark:hover:text-[#F7F3EC] transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isLoading ? (
              <div className="w-20 h-8 bg-[#191A2B]/5 dark:bg-white/5 rounded-sm animate-pulse" />
            ) : isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="cobalt" size="sm" icon={<SparklesIcon size={14} />}>
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button variant="coral" size="sm" icon={<ArrowRightIcon size={14} />}>
                  Get Started
                </Button>
              </Link>
            )}

            <ThemeToggle />
          </div>
        </div>
      </Container>
    </header>
  );
}
