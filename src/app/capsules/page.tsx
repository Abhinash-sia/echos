'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { capsulesApi } from '@/lib/api/capsules';
import { TimeCapsuleItem, CapsulePaginationMeta } from '@/types/capsule';
import { CapsuleCard } from '@/components/capsules/CapsuleCard';
import {
  LockIcon,
  UnlockIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons/Icons';
import { Button } from '@/components/ui/Button';

type FilterStatus = 'all' | 'locked' | 'unlocked';

export default function CapsulesPage() {
  const [capsules, setCapsules] = useState<TimeCapsuleItem[]>([]);
  const [pagination, setPagination] = useState<CapsulePaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & pagination states
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await capsulesApi.getCapsules({
          page,
          limit: 9,
          sortOrder,
          status: statusFilter === 'all' ? undefined : statusFilter,
        });

        if (isMounted) {
          setCapsules(res.data);
          setPagination(res.pagination);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load capsules:', err);
          setError(
            err instanceof Error ? err.message : 'Could not load time capsules. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [page, sortOrder, statusFilter, refreshTrigger]);

  const handleFilterChange = (status: FilterStatus) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <AppShell>
      <div className="py-8 md:py-12">
        <Container>
          {/* Header & Hero */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-semibold bg-[var(--cobalt-blue)]/10 text-[var(--cobalt-blue)] border border-[var(--cobalt-blue)]/20">
                <LockIcon size={14} />
                <span>Date-Locked Vault</span>
              </div>
              <h1 className="font-editorial text-4xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">
                Time Capsules
              </h1>
              <p className="text-sm md:text-base text-[var(--ink-muted)] leading-relaxed">
                Letters, artifacts, and reflections sealed in time. Protected by
                server-authoritative date locks until their appointed release dates.
              </p>
            </div>

            <Link href="/capsules/new">
              <Button variant="coral" size="md" className="gap-2 shadow-md">
                <PlusIcon size={16} />
                <span>Seal a Time Capsule</span>
              </Button>
            </Link>
          </div>

          {/* Filter Tabs & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            {/* Filter Pills with Selective Neumorphism */}
            <div className="inline-flex p-1 rounded-xl bg-black/5 dark:bg-white/5 neu-inset">
              <button
                type="button"
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[var(--surface-color)] text-[var(--foreground)] shadow-sm neu-control'
                    : 'text-[var(--ink-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                All Capsules
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('locked')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                  statusFilter === 'locked'
                    ? 'bg-[var(--cobalt-blue)] text-white shadow-sm'
                    : 'text-[var(--ink-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <LockIcon size={12} />
                <span>Sealed & Locked</span>
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('unlocked')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                  statusFilter === 'unlocked'
                    ? 'bg-[var(--electric-coral)] text-white shadow-sm'
                    : 'text-[var(--ink-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <UnlockIcon size={12} />
                <span>Unlocked & Ready</span>
              </button>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[var(--ink-muted)]">Sort:</span>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-[var(--surface-color)] text-[var(--foreground)] neu-control font-semibold"
              >
                {sortOrder === 'asc' ? 'Earliest Unlock First' : 'Latest Unlock First'}
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 h-64 p-6"
                />
              ))}
            </div>
          )}

          {/* Error Banner */}
          {!isLoading && error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-4">
              <p className="font-mono text-sm text-rose-600 dark:text-rose-400 font-semibold">
                {error}
              </p>
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && capsules.length === 0 && (
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] p-12 text-center neu-raised space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-[var(--cobalt-blue)]/10 text-[var(--cobalt-blue)] flex items-center justify-center mx-auto">
                <LockIcon size={32} />
              </div>
              <h3 className="font-editorial text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {statusFilter === 'all'
                  ? 'No Time Capsules in Vault'
                  : statusFilter === 'locked'
                    ? 'No Sealed Capsules Found'
                    : 'No Unlocked Capsules Ready'}
              </h3>
              <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                {statusFilter === 'all'
                  ? 'Craft your first letter to the future. Select a target unlock date and secure it with a server-enforced temporal lock.'
                  : 'Try selecting a different filter tab or create a new capsule for the future.'}
              </p>
              <div className="pt-2">
                <Link href="/capsules/new">
                  <Button variant="coral" size="sm" className="gap-2">
                    <PlusIcon size={14} />
                    <span>Seal New Capsule</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Capsule Cards Grid */}
          {!isLoading && !error && capsules.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capsules.map((capsule) => (
                <CapsuleCard key={capsule._id} capsule={capsule} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && !error && pagination && pagination.totalPages > 1 && (
            <div className="mt-12 pt-6 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--ink-muted)]">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} capsules
                total)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="gap-1"
                >
                  <ChevronLeftIcon size={14} />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage}
                  className="gap-1"
                >
                  <span>Next</span>
                  <ChevronRightIcon size={14} />
                </Button>
              </div>
            </div>
          )}
        </Container>
      </div>
    </AppShell>
  );
}
