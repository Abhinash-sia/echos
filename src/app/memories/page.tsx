'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { memoriesApi } from '@/lib/api/memories';
import { MemoryItem, PaginationMeta } from '@/types/memory';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  FeatherIcon,
  CalendarIcon,
  CameraIcon,
  ArrowRightIcon,
  AlertCircleIcon,
  CloseIcon,
} from '@/components/icons/Icons';

export default function JournalPage() {
  const [, startTransition] = useTransition();

  // Query state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Data state
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available tags collection
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  // Search debouncing (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchQuery.trim());
        setCurrentPage(1); // Reset to first page on search change
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch memories from backend
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await memoriesApi.getMemories({
          search: debouncedSearch || undefined,
          tag: selectedTag || undefined,
          sortOrder,
          page: currentPage,
          limit: 8,
        });

        if (isMounted) {
          setMemories(res.data);
          setPagination(res.pagination);

          // Collect unique tags from fetched memories
          const tagSet = new Set<string>();
          res.data.forEach((m) => {
            if (Array.isArray(m.tags)) {
              m.tags.forEach((t) => tagSet.add(t));
            }
          });
          if (tagSet.size > 0) {
            setAvailableTags((prev) => Array.from(new Set([...prev, ...tagSet])));
          }
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('[Journal] Fetch error:', err);
          setError('Unable to load memory archives. Please check your connection.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedTag, sortOrder, currentPage, retryCount]);

  const handleTagToggle = (tag: string) => {
    setLoading(true);
    setSelectedTag((prev) => (prev === tag ? null : tag));
    setCurrentPage(1);
  };

  return (
    <AppShell>
      <div className="py-8 sm:py-12">
        <Container size="wide">
          {/* =========================================================================
              1. JOURNAL HEADER & ACTIONS
              ========================================================================= */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="coral">CHRONICLE INDEX</Badge>
                <span className="font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider">
                  Volume 2026 · Personal Journal
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#191A2B] dark:text-[#F7F3EC] tracking-tight">
                My Memory Journal
              </h1>
              <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] mt-1 max-w-lg">
                Reflective life events, analog photography contacts, and semantic thoughts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/memories/new">
                <Button variant="coral" size="md" icon={<FeatherIcon size={16} />}>
                  Compose Memory
                </Button>
              </Link>
            </div>
          </div>

          {/* =========================================================================
              2. SELECTIVE NEUMORPHIC SEARCH & FILTER CONTROLS
              ========================================================================= */}
          <div className="neu-raised p-4 sm:p-5 rounded-sm mb-8">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Search input with neu-inset style */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search memory reflections by title or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full neu-inset px-4 py-2.5 rounded-sm font-sans text-sm text-[#191A2B] dark:text-[#F7F3EC] placeholder:text-[#767C9D] focus:outline-none focus:ring-1 focus:ring-[#FF684D]"
                  aria-label="Search memories"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767C9D] hover:text-[#FF684D] p-1"
                    aria-label="Clear search"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>

              {/* Sorting and Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] uppercase mr-1">
                  Sort:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSortOrder('desc');
                    setCurrentPage(1);
                  }}
                  className={`neu-control px-3 py-1.5 rounded-sm font-mono text-xs cursor-pointer ${
                    sortOrder === 'desc'
                      ? 'neu-control-active bg-[#191A2B] text-white dark:bg-white dark:text-[#191A2B] font-bold'
                      : 'text-[#484C69] dark:text-[#A4AAC7]'
                  }`}
                >
                  Newest First
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortOrder('asc');
                    setCurrentPage(1);
                  }}
                  className={`neu-control px-3 py-1.5 rounded-sm font-mono text-xs cursor-pointer ${
                    sortOrder === 'asc'
                      ? 'neu-control-active bg-[#191A2B] text-white dark:bg-white dark:text-[#191A2B] font-bold'
                      : 'text-[#484C69] dark:text-[#A4AAC7]'
                  }`}
                >
                  Oldest First
                </button>
              </div>
            </div>

            {/* Tag Filter Chips */}
            {availableTags.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#191A2B]/10 dark:border-white/10 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] uppercase mr-1">
                  Tags:
                </span>
                {availableTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`neu-control px-2.5 py-1 rounded-sm font-mono text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#4F66E8] text-white font-bold shadow-xs'
                          : 'text-[#484C69] dark:text-[#A4AAC7] hover:text-[#FF684D]'
                      }`}
                    >
                      #{tag}
                      {isSelected && ' ✕'}
                    </button>
                  );
                })}
                {selectedTag && (
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="text-xs font-mono text-[#FF684D] hover:underline ml-2"
                  >
                    Clear tag
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-8 p-4 rounded-sm bg-[#FF684D]/10 border border-[#FF684D]/40 text-[#FF684D] flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <AlertCircleIcon size={18} />
                <span>{error}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  setRetryCount((c) => c + 1);
                }}
              >
                Retry
              </Button>
            </div>
          )}

          {/* =========================================================================
              3. MEMORY ARCHIVE GRID
              ========================================================================= */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-72 bg-white dark:bg-[#1E2035] rounded-sm p-6 border border-[#191A2B]/10 dark:border-white/10 animate-pulse"
                />
              ))}
            </div>
          ) : memories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memories.map((memory) => {
                  const formattedDate = new Date(memory.memoryDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  const photoCount = Array.isArray(memory.photos) ? memory.photos.length : 0;
                  const firstPhoto = memory.photos?.[0];

                  return (
                    <article
                      key={memory._id}
                      className="group bg-white dark:bg-[#1E2035] border-2 border-[#191A2B] dark:border-white/20 p-6 rounded-sm shadow-md hover:shadow-2xl transition-all duration-200 flex flex-col justify-between hover:-translate-y-1 relative animate-fadeIn"
                    >
                      <div>
                        {/* Photo Thumbnail Banner if photos exist */}
                        {firstPhoto?.signedUrl && (
                          <div className="relative w-full aspect-[16/10] rounded-xs overflow-hidden mb-4 border border-[#191A2B]/10 bg-[#EFE9DE]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={firstPhoto.signedUrl}
                              alt={memory.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {photoCount > 1 && (
                              <div className="absolute bottom-2 right-2 bg-[#191A2B]/85 text-white font-mono text-xs px-2 py-0.5 rounded-xs flex items-center gap-1 shadow-sm">
                                <CameraIcon size={12} />
                                <span>{photoCount} photos</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Date and tags header */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-[#FF684D] font-semibold">
                            <CalendarIcon size={14} />
                            <span>{formattedDate}</span>
                          </div>

                          {photoCount > 0 && !firstPhoto?.signedUrl && (
                            <span className="font-mono text-[11px] text-[#39BFAE] flex items-center gap-1">
                              <CameraIcon size={12} />
                              <span>{photoCount}</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="font-serif text-2xl font-normal text-[#191A2B] dark:text-[#F7F3EC] group-hover:text-[#FF684D] transition-colors line-clamp-2 mb-3 leading-snug">
                          <Link href={`/memories/${memory._id}`}>{memory.title}</Link>
                        </h2>

                        {/* Written Content Snippet */}
                        <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] line-clamp-3 leading-relaxed mb-4">
                          {memory.content}
                        </p>

                        {/* Tags */}
                        {memory.tags && memory.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {memory.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleTagToggle(t);
                                }}
                                className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-xs bg-[#EFE9DE] dark:bg-[#25283F] text-[#484C69] dark:text-[#A4AAC7] hover:text-[#FF684D] cursor-pointer"
                              >
                                #{t}
                              </span>
                            ))}
                            {memory.tags.length > 3 && (
                              <span className="font-mono text-[10px] text-[#767C9D]">
                                +{memory.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-4 border-t border-[#191A2B]/10 dark:border-white/10 flex items-center justify-between font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7]">
                        <Link
                          href={`/memories/${memory._id}`}
                          className="text-[#4F66E8] dark:text-[#FF684D] font-semibold hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Read Entry</span>
                          <ArrowRightIcon size={12} />
                        </Link>

                        <Link
                          href={`/memories/${memory._id}/edit`}
                          className="hover:text-[#191A2B] dark:hover:text-white"
                        >
                          Edit
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* =========================================================================
                  4. PAGINATION CONTROLS
                  ========================================================================= */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="neu-control px-4 py-2 rounded-sm font-mono text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    ← Previous
                  </button>

                  <div className="neu-inset px-4 py-2 rounded-sm font-mono text-xs text-[#191A2B] dark:text-[#F7F3EC]">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
                  </div>

                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="neu-control px-4 py-2 rounded-sm font-mono text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="neu-raised p-12 text-center rounded-sm max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#FF684D]/15 text-[#FF684D] flex items-center justify-center mx-auto mb-4">
                <FeatherIcon size={24} />
              </div>
              <h2 className="font-serif text-2xl text-[#191A2B] dark:text-[#F7F3EC] mb-2 font-normal">
                {debouncedSearch || selectedTag ? 'No Matching Entries' : 'No Memories Yet'}
              </h2>
              <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] mb-6">
                {debouncedSearch || selectedTag
                  ? 'Try modifying your search keywords or clearing active tag filters.'
                  : 'Start capturing your reflections and 35mm photograph archives today.'}
              </p>
              {debouncedSearch || selectedTag ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag(null);
                  }}
                >
                  Clear All Filters
                </Button>
              ) : (
                <Link href="/memories/new">
                  <Button variant="coral" size="md" icon={<FeatherIcon size={16} />}>
                    Compose Your First Memory
                  </Button>
                </Link>
              )}
            </div>
          )}
        </Container>
      </div>
    </AppShell>
  );
}
