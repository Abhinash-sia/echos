'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { apiClient } from '@/lib/api/client';
import { memoriesApi } from '@/lib/api/memories';
import { MemoryItem } from '@/types/memory';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FloatingSticker } from '@/components/ui/FloatingSticker';
import { ArchivalStamp } from '@/components/ui/ArchivalStamp';
import { ScrollReveal } from '@/components/layout/ScrollReveal';
import {
  FeatherIcon,
  LockIcon,
  CalendarIcon,
  CheckIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  CameraIcon,
} from '@/components/icons/Icons';

interface DashboardMetrics {
  totalMemories: number;
  totalCapsules: number;
  sealedCapsules: number;
  recentMemories: MemoryItem[];
  recentPhotosCount: number;
  nextUnlockCapsule: {
    title: string;
    unlockDate: string;
    daysRemaining: number;
  } | null;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoadingMetrics(true);
        setMetricsError(null);

        // Derive metrics accurately from real backend endpoints
        const [memoriesRes, capsulesRes, sealedRes, upcomingRes] = await Promise.all([
          memoriesApi.getMemories({ limit: 4, sortOrder: 'desc' }),
          apiClient.get<Record<string, unknown>>('/api/capsules', {
            params: { limit: 1 },
          }),
          apiClient.get<Record<string, unknown>>('/api/capsules', {
            params: { limit: 1, status: 'locked' },
          }),
          apiClient.get<{ data?: Array<{ title?: string; unlockDate?: string }> }>(
            '/api/capsules',
            {
              params: { limit: 1, status: 'locked', sortOrder: 'asc' },
            }
          ),
        ]);

        if (isMounted) {
          const memoriesList = memoriesRes.data || [];
          const totalMemories = memoriesRes.pagination?.total ?? 0;

          const capsulesPagination = (capsulesRes as unknown as { pagination?: { total?: number } })
            .pagination;
          const sealedPagination = (sealedRes as unknown as { pagination?: { total?: number } })
            .pagination;

          // Derivable photo count from retrieved memories
          const recentPhotosCount = memoriesList.reduce(
            (acc, m) => acc + (Array.isArray(m.photos) ? m.photos.length : 0),
            0
          );

          // Upcoming unlock calculation
          let nextUnlockCapsule: DashboardMetrics['nextUnlockCapsule'] = null;
          const upcomingItem = upcomingRes.data?.[0];
          if (upcomingItem?.unlockDate) {
            const unlockTime = new Date(upcomingItem.unlockDate).getTime();
            const nowTime = Date.now();
            const diffDays = Math.max(0, Math.ceil((unlockTime - nowTime) / (1000 * 60 * 60 * 24)));
            nextUnlockCapsule = {
              title: upcomingItem.title || 'Untitled Capsule',
              unlockDate: new Date(upcomingItem.unlockDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
              daysRemaining: diffDays,
            };
          }

          setMetrics({
            totalMemories,
            totalCapsules: capsulesPagination?.total ?? 0,
            sealedCapsules: sealedPagination?.total ?? 0,
            recentMemories: memoriesList,
            recentPhotosCount,
            nextUnlockCapsule,
          });
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[Dashboard] Error retrieving metrics:', err);
          setMetricsError('Could not load current vault metrics. Please refresh.');
        }
      } finally {
        if (isMounted) {
          setLoadingMetrics(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const isNewAccount = metrics && metrics.totalMemories === 0 && metrics.totalCapsules === 0;

  return (
    <AppShell>
      <div className="py-8 sm:py-12">
        <Container size="wide">
          {/* =========================================================================
              1. HERO WELCOME SECTION: Playful Surrealism Aesthetic with Selective Neumorphism
              ========================================================================= */}
          <ScrollReveal direction="up">
            <div className="relative bg-white dark:bg-[#1E2035] border-2 border-[#191A2B] dark:border-white/20 p-6 sm:p-10 rounded-sm shadow-xl mb-10 overflow-hidden">
              {/* Ambient sticker accent */}
              <div className="absolute top-4 right-4 pointer-events-none hidden sm:block">
                <FloatingSticker color="coral" rotate={5}>
                  SANCTUARY
                </FloatingSticker>
              </div>

              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="cobalt">ARCHIVAL DESK</Badge>
                  <span className="font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider">
                    EPOCH 2026 · PERSONAL INDEX
                  </span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#191A2B] dark:text-[#F7F3EC] tracking-tight mb-3">
                  Welcome back, {user?.name || 'Archivist'}
                </h1>

                <p className="font-sans text-sm sm:text-base text-[#484C69] dark:text-[#A4AAC7] leading-relaxed mb-6">
                  Your private memory vault is active. Document new reflections, attach 35mm
                  photographs, and explore your personal chronicle.
                </p>

                {/* Quick Actions Bar with Neumorphic Tactile Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/memories/new">
                    <Button variant="coral" size="md" icon={<FeatherIcon size={16} />}>
                      Compose Memory
                    </Button>
                  </Link>

                  <Link href="/memories">
                    <Button variant="paper" size="md" icon={<CameraIcon size={16} />}>
                      Open Journal
                    </Button>
                  </Link>

                  <Link href="/capsules">
                    <Button variant="secondary" size="md" icon={<LockIcon size={16} />}>
                      Time Capsules
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Metrics Error Alert Banner */}
          {metricsError && (
            <div className="mb-6 p-4 rounded-sm bg-[#FF684D]/10 border border-[#FF684D]/30 flex items-center gap-3 text-xs text-[#FF684D]">
              <AlertCircleIcon size={16} />
              <span>{metricsError}</span>
            </div>
          )}

          {/* =========================================================================
              2. REAL PRODUCT METRICS CARDS (Selective Neumorphism)
              ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Widget 1: Total Memories */}
            <ScrollReveal direction="up" delay={50}>
              <div className="neu-raised p-6 rounded-sm flex flex-col justify-between transition-all duration-200 h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7]">
                      Journal Entries
                    </span>
                    <div className="w-8 h-8 rounded-sm bg-[#FF684D]/15 text-[#FF684D] flex items-center justify-center">
                      <FeatherIcon size={16} />
                    </div>
                  </div>

                  <div className="font-serif text-4xl sm:text-5xl font-normal text-[#191A2B] dark:text-[#F7F3EC]">
                    {loadingMetrics ? (
                      <span className="inline-block w-12 h-10 bg-[#191A2B]/10 dark:bg-white/10 rounded animate-pulse" />
                    ) : (
                      (metrics?.totalMemories ?? 0)
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#191A2B]/10 dark:border-white/10 flex items-center justify-between text-xs font-mono text-[#767C9D] dark:text-[#A4AAC7]">
                  <span>Documented Stories</span>
                  <Link href="/memories" className="text-[#FF684D] hover:underline font-semibold">
                    Browse →
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Widget 2: Attached Photos */}
            <ScrollReveal direction="up" delay={100}>
              <div className="neu-raised p-6 rounded-sm flex flex-col justify-between transition-all duration-200 h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7]">
                      Recent Photos
                    </span>
                    <div className="w-8 h-8 rounded-sm bg-[#B7DB50]/20 text-[#191A2B] dark:text-[#B7DB50] flex items-center justify-center">
                      <CameraIcon size={16} />
                    </div>
                  </div>

                  <div className="font-serif text-4xl sm:text-5xl font-normal text-[#191A2B] dark:text-[#F7F3EC]">
                    {loadingMetrics ? (
                      <span className="inline-block w-12 h-10 bg-[#191A2B]/10 dark:bg-white/10 rounded animate-pulse" />
                    ) : (
                      (metrics?.recentPhotosCount ?? 0)
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#191A2B]/10 dark:border-white/10 flex items-center justify-between text-xs font-mono text-[#767C9D] dark:text-[#A4AAC7]">
                  <span>In Recent Entries</span>
                  <span className="text-[#39BFAE] font-semibold">35mm Archives</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Widget 3: Sealed Capsules */}
            <ScrollReveal direction="up" delay={150}>
              <div className="neu-raised p-6 rounded-sm flex flex-col justify-between transition-all duration-200 h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7]">
                      Sealed Capsules
                    </span>
                    <div className="w-8 h-8 rounded-sm bg-[#4F66E8]/15 text-[#4F66E8] flex items-center justify-center">
                      <LockIcon size={16} />
                    </div>
                  </div>

                  <div className="font-serif text-4xl sm:text-5xl font-normal text-[#191A2B] dark:text-[#F7F3EC]">
                    {loadingMetrics ? (
                      <span className="inline-block w-12 h-10 bg-[#191A2B]/10 dark:bg-white/10 rounded animate-pulse" />
                    ) : (
                      (metrics?.sealedCapsules ?? 0)
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#191A2B]/10 dark:border-white/10 flex items-center justify-between text-xs font-mono text-[#767C9D] dark:text-[#A4AAC7]">
                  <span>Date-Locked</span>
                  <Link href="/capsules" className="text-[#4F66E8] hover:underline font-semibold">
                    Inspect →
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Widget 4: Next Unlock Milestone */}
            <ScrollReveal direction="up" delay={200}>
              <div className="neu-raised p-6 rounded-sm flex flex-col justify-between transition-all duration-200 h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7]">
                      Next Milestone
                    </span>
                    <div className="w-8 h-8 rounded-sm bg-[#39BFAE]/15 text-[#39BFAE] flex items-center justify-center">
                      <CalendarIcon size={16} />
                    </div>
                  </div>

                  {loadingMetrics ? (
                    <span className="inline-block w-24 h-10 bg-[#191A2B]/10 dark:bg-white/10 rounded animate-pulse" />
                  ) : metrics?.nextUnlockCapsule ? (
                    <div>
                      <div className="font-serif text-2xl font-normal text-[#191A2B] dark:text-[#F7F3EC] truncate">
                        {metrics.nextUnlockCapsule.title}
                      </div>
                      <span className="font-mono text-xs text-[#FF684D] font-bold">
                        {metrics.nextUnlockCapsule.daysRemaining === 0
                          ? 'Ready to Open Today!'
                          : `${metrics.nextUnlockCapsule.daysRemaining} days remaining`}
                      </span>
                    </div>
                  ) : (
                    <div className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] italic">
                      No active capsules date-locked.
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#191A2B]/10 dark:border-white/10 flex items-center justify-between text-xs font-mono text-[#767C9D] dark:text-[#A4AAC7]">
                  <span>{metrics?.nextUnlockCapsule?.unlockDate || 'None Scheduled'}</span>
                  <Link href="/capsules" className="text-[#39BFAE] hover:underline font-semibold">
                    Capsules →
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* =========================================================================
              3. NEW USER ONBOARDING (Displayed when account has no memories)
              ========================================================================= */}
          {isNewAccount && (
            <ScrollReveal direction="up">
              <div className="mb-10 p-8 rounded-sm bg-white dark:bg-[#1E2035] border-2 border-[#191A2B] dark:border-white/20 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="lime">ONBOARDING GUIDE</Badge>
                  <span className="font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider">
                    Getting Started with Echoes
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl text-[#191A2B] dark:text-[#F7F3EC] mb-2 font-normal">
                  Begin Your Digital Archival Journey
                </h2>
                <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] max-w-xl mb-6">
                  Your vault is currently empty. Follow these three simple steps to start building
                  your personal memory sanctuary:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="neu-inset p-5 rounded-sm">
                    <div className="w-8 h-8 rounded-full bg-[#FF684D] text-white flex items-center justify-center font-bold text-sm mb-3">
                      1
                    </div>
                    <h3 className="font-serif text-lg font-normal mb-1">Write a Memory</h3>
                    <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mb-3">
                      Record a life event with markdown prose and semantic tags.
                    </p>
                    <Link
                      href="/memories/new"
                      className="text-xs font-semibold text-[#FF684D] hover:underline"
                    >
                      Compose Now →
                    </Link>
                  </div>

                  <div className="neu-inset p-5 rounded-sm">
                    <div className="w-8 h-8 rounded-full bg-[#4F66E8] text-white flex items-center justify-center font-bold text-sm mb-3">
                      2
                    </div>
                    <h3 className="font-serif text-lg font-normal mb-1">Upload 35mm Photos</h3>
                    <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mb-3">
                      Attach high-resolution photographs preserved with Cloudinary private storage.
                    </p>
                    <span className="text-xs font-mono text-[#767C9D] dark:text-[#A4AAC7]">
                      Included in memories
                    </span>
                  </div>

                  <div className="neu-inset p-5 rounded-sm">
                    <div className="w-8 h-8 rounded-full bg-[#39BFAE] text-white flex items-center justify-center font-bold text-sm mb-3">
                      3
                    </div>
                    <h3 className="font-serif text-lg font-normal mb-1">Seal a Time Capsule</h3>
                    <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mb-3">
                      Write to your future self with server-enforced date-locking.
                    </p>
                    <Link
                      href="/capsules"
                      className="text-xs font-semibold text-[#39BFAE] hover:underline"
                    >
                      View Capsules →
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* =========================================================================
              4. RECENT MEMORIES SECTION (Connected to real backend memories)
              ========================================================================= */}
          <ScrollReveal direction="up">
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#191A2B] dark:text-[#F7F3EC]">
                    Recent Reflections
                  </h2>
                  <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7]">
                    Your latest documented personal experiences
                  </p>
                </div>

                <Link href="/memories">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ArrowRightIcon size={14} />}
                    iconPosition="right"
                  >
                    View All Journal Entries
                  </Button>
                </Link>
              </div>

              {loadingMetrics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-56 bg-white dark:bg-[#1E2035] rounded-sm p-5 border border-[#191A2B]/10 dark:border-white/10 animate-pulse"
                    />
                  ))}
                </div>
              ) : metrics && metrics.recentMemories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {metrics.recentMemories.map((mem) => {
                    const formattedDate = new Date(mem.memoryDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    const photoCount = Array.isArray(mem.photos) ? mem.photos.length : 0;
                    const firstPhoto = mem.photos?.[0];

                    return (
                      <Link
                        key={mem._id}
                        href={`/memories/${mem._id}`}
                        className="group bg-white dark:bg-[#1E2035] border-2 border-[#191A2B] dark:border-white/20 p-5 rounded-sm shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between hover:-translate-y-1"
                      >
                        <div>
                          {/* Optional photo thumbnail */}
                          {firstPhoto?.signedUrl && (
                            <div className="relative w-full aspect-[16/10] rounded-xs overflow-hidden mb-3 border border-[#191A2B]/10 bg-[#EFE9DE]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={firstPhoto.signedUrl}
                                alt={mem.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {photoCount > 1 && (
                                <div className="absolute bottom-1.5 right-1.5 bg-[#191A2B]/80 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                                  <CameraIcon size={10} />
                                  <span>+{photoCount - 1}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-2 font-mono text-[11px] text-[#FF684D] font-semibold">
                            <CalendarIcon size={12} />
                            <span>{formattedDate}</span>
                          </div>

                          <h3 className="font-serif text-lg font-normal text-[#191A2B] dark:text-[#F7F3EC] group-hover:text-[#FF684D] transition-colors line-clamp-2 mb-2 leading-snug">
                            {mem.title}
                          </h3>

                          <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] line-clamp-3 leading-relaxed mb-3">
                            {mem.content}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#191A2B]/10 dark:border-white/10 flex items-center justify-between font-mono text-[10px] text-[#767C9D] dark:text-[#A4AAC7]">
                          <span className="truncate max-w-[120px]">
                            {mem.tags?.[0] ? `#${mem.tags[0]}` : 'Personal'}
                          </span>
                          <span className="text-[#4F66E8] group-hover:translate-x-0.5 transition-transform">
                            Read →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-sm bg-white dark:bg-[#1E2035] border border-[#191A2B]/10 dark:border-white/10 text-center">
                  <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] mb-4">
                    No memories documented yet.
                  </p>
                  <Link href="/memories/new">
                    <Button variant="coral" size="sm" icon={<FeatherIcon size={14} />}>
                      Create Your First Memory
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* =========================================================================
              5. SECURITY & ARCHIVAL ASSURANCE (Correction 3: Date-based access control)
              ========================================================================= */}
          <ScrollReveal direction="up" delay={50}>
            <div className="p-6 rounded-sm bg-[#EFE9DE]/80 dark:bg-[#25283F]/80 border border-[#191A2B]/10 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ArchivalStamp variant="wax" size="sm" />
                <div>
                  <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[#191A2B] dark:text-[#F7F3EC] block">
                    Server-Enforced Temporal Privacy
                  </span>
                  <span className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] block">
                    Time capsules are secured via server-enforced date-based access control.
                    Messages and photographs are strictly redacted by the API until the unlock date.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-[#39BFAE] font-semibold shrink-0">
                <CheckIcon size={14} />
                <span>HTTP-ONLY COOKIES ACTIVE</span>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </div>
    </AppShell>
  );
}
