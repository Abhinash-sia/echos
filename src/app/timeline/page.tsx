'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { timelineApi } from '@/lib/api/timeline';
import { TimelineItem, TimelineItemType, TimelinePaginationMeta } from '@/types/timeline';
import { TimelineItemCard } from '@/components/timeline/TimelineItemCard';
import {
  CalendarIcon,
  FilterIcon,
  SparklesIcon,
  FeatherIcon,
  LockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@/components/icons/Icons';
import { Button } from '@/components/ui/Button';

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [pagination, setPagination] = useState<TimelinePaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedType, setSelectedType] = useState<TimelineItemType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Cursor navigation state
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await timelineApi.getTimeline({
          type: selectedType,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sortOrder,
          limit: 10,
          cursor: currentCursor || undefined,
        });

        if (isMounted) {
          setItems(res.data);
          setPagination(res.pagination);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to fetch timeline:', err);
          setError(
            err instanceof Error ? err.message : 'Could not load your timeline. Please try again.'
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
  }, [selectedType, startDate, endDate, sortOrder, currentCursor, refreshTrigger]);

  // Cursor Next Page
  const handleNextPage = () => {
    if (pagination?.nextCursor) {
      setCursorHistory((prev) => [...prev, currentCursor || '']);
      setCurrentCursor(pagination.nextCursor);
    }
  };

  // Cursor Prev Page
  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prevCursor = cursorHistory[cursorHistory.length - 1];
      setCursorHistory((prev) => prev.slice(0, prev.length - 1));
      setCurrentCursor(prevCursor || undefined);
    }
  };

  // Reset date filters
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedType('all');
    setSortOrder('asc');
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  const handleTypeSelect = (type: TimelineItemType) => {
    setSelectedType(type);
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  const handleSortChange = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  // Group items by Month and Year
  const groupedItems = React.useMemo(() => {
    const groups: { [key: string]: TimelineItem[] } = {};
    items.forEach((item) => {
      const d = new Date(item.date);
      const groupKey = isNaN(d.getTime())
        ? 'Undated'
        : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    return groups;
  }, [items]);

  return (
    <AppShell>
      <div className="py-8 md:py-12">
        <Container>
          {/* Header & Mission Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-semibold bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] border border-[var(--electric-coral)]/20">
                <SparklesIcon size={14} />
                <span>Unified Archive Feed</span>
              </div>
              <h1 className="font-editorial text-4xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">
                The Personal Timeline
              </h1>
              <p className="text-sm md:text-base text-[var(--ink-muted)] leading-relaxed">
                A seamless chronological stream uniting your cherished journal entries and
                date-locked time capsules in temporal continuum.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Link href="/memories/new">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FeatherIcon size={14} />
                  <span>Write Reflection</span>
                </Button>
              </Link>
              <Link href="/capsules/new">
                <Button variant="coral" size="sm" className="gap-1.5">
                  <PlusIcon size={14} />
                  <span>Seal Capsule</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Filter & Control Bar */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] p-4 md:p-6 neu-raised mb-10 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Type Filter Pills (Selective Neumorphism) */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-black/5 dark:bg-white/5 neu-inset">
                <button
                  type="button"
                  onClick={() => handleTypeSelect('all')}
                  className={`px-4 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
                    selectedType === 'all'
                      ? 'bg-[var(--surface-color)] text-[var(--foreground)] shadow-sm neu-control'
                      : 'text-[var(--ink-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  All Entries
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSelect('memory')}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
                    selectedType === 'memory'
                      ? 'bg-[var(--vibrant-teal)] text-white shadow-sm'
                      : 'text-[var(--ink-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <FeatherIcon size={12} />
                  <span>Memories</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSelect('capsule')}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
                    selectedType === 'capsule'
                      ? 'bg-[var(--electric-coral)] text-white shadow-sm'
                      : 'text-[var(--ink-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <LockIcon size={12} />
                  <span>Capsules</span>
                </button>
              </div>

              {/* Sort Order Toggle */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[var(--ink-muted)]">Order:</span>
                <div className="inline-flex rounded-xl bg-black/5 dark:bg-white/5 p-1 neu-inset">
                  <button
                    type="button"
                    onClick={() => handleSortChange('asc')}
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold transition-all ${
                      sortOrder === 'asc'
                        ? 'bg-[var(--surface-color)] text-[var(--foreground)] shadow-sm neu-control'
                        : 'text-[var(--ink-muted)]'
                    }`}
                  >
                    Chronological (Past → Future)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSortChange('desc')}
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold transition-all ${
                      sortOrder === 'desc'
                        ? 'bg-[var(--surface-color)] text-[var(--foreground)] shadow-sm neu-control'
                        : 'text-[var(--ink-muted)]'
                    }`}
                  >
                    Latest First
                  </button>
                </div>
              </div>
            </div>

            {/* Date Range Boundary Inputs */}
            <div className="pt-3 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="text-[var(--ink-muted)] flex items-center gap-1.5 font-semibold">
                <FilterIcon size={14} />
                <span>Date Range:</span>
              </span>

              <div className="flex items-center gap-2">
                <label htmlFor="timeline-start-date" className="text-[var(--ink-muted)]">
                  From
                </label>
                <input
                  id="timeline-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] text-[var(--foreground)] font-mono text-xs neu-inset focus:outline-none focus:ring-1 focus:ring-[var(--electric-coral)]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="timeline-end-date" className="text-[var(--ink-muted)]">
                  To
                </label>
                <input
                  id="timeline-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] text-[var(--foreground)] font-mono text-xs neu-inset focus:outline-none focus:ring-1 focus:ring-[var(--electric-coral)]"
                />
              </div>

              {(startDate || endDate || selectedType !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[var(--electric-coral)] hover:underline ml-auto font-mono text-xs font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Loading Skeleton State */}
          {isLoading && (
            <div className="space-y-8 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 shrink-0" />
                  <div className="flex-1 rounded-2xl bg-black/5 dark:bg-white/5 h-36 border border-black/5 dark:border-white/5" />
                </div>
              ))}
            </div>
          )}

          {/* Error State with Retry */}
          {!isLoading && error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-4">
              <p className="font-mono text-sm text-rose-600 dark:text-rose-400 font-semibold">
                {error}
              </p>
              <Button variant="outline" size="sm" onClick={() => setRefreshTrigger((t) => t + 1)}>
                Try Again
              </Button>
            </div>
          )}

          {/* Empty Timeline State */}
          {!isLoading && !error && items.length === 0 && (
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] p-12 text-center neu-raised space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-[var(--ink-muted)]">
                <CalendarIcon size={32} />
              </div>
              <h3 className="font-editorial text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Your Timeline is Quiet
              </h3>
              <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                {startDate || endDate || selectedType !== 'all'
                  ? 'No entries match your chosen criteria. Try adjusting the date range or filter.'
                  : 'You have not added any journal memories or sealed any time capsules yet.'}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {startDate || endDate || selectedType !== 'all' ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                ) : (
                  <>
                    <Link href="/memories/new">
                      <Button variant="outline" size="sm">
                        Create Memory
                      </Button>
                    </Link>
                    <Link href="/capsules/new">
                      <Button variant="coral" size="sm">
                        Seal Capsule
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Timeline Stream with Connecting Spine and Date Groupings */}
          {!isLoading && !error && items.length > 0 && (
            <div className="relative">
              {/* Connecting vertical spine running down the feed */}
              <div
                aria-hidden="true"
                className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[var(--vibrant-teal)] via-[var(--electric-coral)] to-[var(--cobalt-blue)] opacity-30 pointer-events-none"
              />

              <div className="space-y-12">
                {Object.entries(groupedItems).map(([groupTitle, groupEntries]) => (
                  <section key={groupTitle} className="space-y-6">
                    {/* Group Header Badge */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-black/10 dark:border-white/10 bg-[var(--surface-color)] flex items-center justify-center shadow-sm shrink-0 z-10">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--electric-coral)]" />
                      </div>
                      <h2 className="font-editorial text-xl font-bold tracking-tight text-[var(--foreground)] uppercase tracking-wider">
                        {groupTitle}
                      </h2>
                      <div className="flex-1 border-b border-black/10 dark:border-white/10" />
                    </div>

                    {/* Timeline Items in this Group */}
                    <div className="space-y-6 pl-0">
                      {groupEntries.map((item) => (
                        <TimelineItemCard key={item.id || item._id} item={item} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {/* Cursor-Based Pagination Controls */}
              <div className="mt-12 pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-mono text-xs text-[var(--ink-muted)]">
                  {pagination ? `Total Records: ${pagination.total}` : ''}
                </span>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={cursorHistory.length === 0}
                    className="gap-1.5"
                  >
                    <ChevronLeftIcon size={14} />
                    <span>Previous</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!pagination?.hasNextPage}
                    className="gap-1.5"
                  >
                    <span>Next</span>
                    <ChevronRightIcon size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </div>
    </AppShell>
  );
}
