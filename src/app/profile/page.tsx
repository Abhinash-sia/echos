'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { useAuth } from '@/contexts/AuthContext';
import { memoriesApi } from '@/lib/api/memories';
import { capsulesApi } from '@/lib/api/capsules';
import { timelineApi } from '@/lib/api/timeline';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArchivalStamp } from '@/components/ui/ArchivalStamp';
import { FloatingSticker } from '@/components/ui/FloatingSticker';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  UserIcon,
  MailIcon,
  CalendarIcon,
  LockIcon,
  UnlockIcon,
  FeatherIcon,
  CameraIcon,
  SparklesIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from '@/components/icons/Icons';

interface AccountStats {
  totalMemories: number;
  totalPhotos: number;
  totalCapsules: number;
  sealedCapsules: number;
  unlockedCapsules: number;
  timelineEvents: number;
}

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAccountStats() {
      try {
        setIsLoadingStats(true);

        // Fetch memories count and sample photos
        const [memoriesRes, capsulesRes, timelineRes] = await Promise.allSettled([
          memoriesApi.getMemories({ limit: 100 }),
          capsulesApi.getCapsules(),
          timelineApi.getTimeline({ limit: 1 }),
        ]);

        let totalMemories = 0;
        let totalPhotos = 0;
        if (memoriesRes.status === 'fulfilled') {
          totalMemories = memoriesRes.value.pagination.total;
          // Count photos in retrieved memories
          memoriesRes.value.data.forEach((mem) => {
            if (Array.isArray(mem.photos)) {
              totalPhotos += mem.photos.length;
            }
          });
        }

        let totalCapsules = 0;
        let sealedCapsules = 0;
        let unlockedCapsules = 0;
        if (capsulesRes.status === 'fulfilled') {
          const list = capsulesRes.value.data;
          totalCapsules = list.length;
          sealedCapsules = list.filter((c) => c.isLocked).length;
          unlockedCapsules = list.filter((c) => !c.isLocked || c.isOpened).length;
        }

        let timelineEvents = totalMemories + totalCapsules;
        if (timelineRes.status === 'fulfilled') {
          timelineEvents = timelineRes.value.pagination.total;
        }

        if (isMounted) {
          setStats({
            totalMemories,
            totalPhotos,
            totalCapsules,
            sealedCapsules,
            unlockedCapsules,
            timelineEvents,
          });
        }
      } catch (err) {
        console.error('Failed to aggregate profile stats:', err);
      } finally {
        if (isMounted) {
          setIsLoadingStats(false);
        }
      }
    }

    loadAccountStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedJoinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <AppShell>
      <div className="py-8 sm:py-12 flex-1">
        <Container size="wide">
          {/* Header Breadcrumb & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#191A2B]/10 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-widest text-[#767C9D] dark:text-[#A4AAC7]">
                <Link href="/dashboard" className="hover:text-[#FF684D] transition-colors">
                  Vault
                </Link>
                <span>/</span>
                <span className="text-[#191A2B] dark:text-[#F7F3EC] font-semibold">Profile</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#191A2B] dark:text-[#F7F3EC] font-normal">
                Archival Identity & Dossier
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/settings">
                <Button variant="secondary" size="sm" icon={<SettingsIcon size={16} />}>
                  Account Settings
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Identity Dossier Card */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="relative bg-[#EFE9DE] dark:bg-[#1E2035] border-2 border-[#191A2B] dark:border-white/15 rounded-sm p-6 sm:p-8 shadow-neu-raised">
                {/* Decorative sticker */}
                <div className="absolute -top-4 -right-3 pointer-events-none hidden sm:block">
                  <FloatingSticker color="coral" rotate={-6}>
                    VERIFIED
                  </FloatingSticker>
                </div>

                {/* Avatar & Main Identity */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-sm bg-[#4F66E8] text-white flex items-center justify-center font-mono text-2xl font-bold shadow-md shrink-0">
                    {userInitials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="coral">PRIMARY VAULT</Badge>
                      <Badge variant="cobalt">VERIFIED ARCHIVIST</Badge>
                    </div>
                    <h2 className="font-serif text-2xl font-normal text-[#191A2B] dark:text-[#F7F3EC] truncate">
                      {isAuthLoading ? (
                        <Skeleton variant="title" width={180} />
                      ) : (
                        user?.name || 'Vault Archivist'
                      )}
                    </h2>
                    <p className="font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] truncate mt-0.5">
                      {isAuthLoading ? <Skeleton variant="text" width={220} /> : user?.email}
                    </p>
                  </div>
                </div>

                {/* Account Details Table */}
                <div className="border-t border-b border-[#191A2B]/10 dark:border-white/10 py-4 my-6 flex flex-col gap-3 font-sans text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#767C9D] dark:text-[#A4AAC7] flex items-center gap-1.5">
                      <UserIcon size={14} /> Full Name
                    </span>
                    <span className="font-semibold text-[#191A2B] dark:text-[#F7F3EC]">
                      {user?.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#767C9D] dark:text-[#A4AAC7] flex items-center gap-1.5">
                      <MailIcon size={14} /> Email Address
                    </span>
                    <span className="font-semibold text-[#191A2B] dark:text-[#F7F3EC]">
                      {user?.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#767C9D] dark:text-[#A4AAC7] flex items-center gap-1.5">
                      <CalendarIcon size={14} /> Account Created
                    </span>
                    <span className="font-semibold text-[#191A2B] dark:text-[#F7F3EC]">
                      {formattedJoinDate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#767C9D] dark:text-[#A4AAC7] flex items-center gap-1.5">
                      <ShieldCheckIcon size={14} /> Vault Status
                    </span>
                    <span className="text-[#2D9CDB] font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#2D9CDB] inline-block" /> Active
                      Member
                    </span>
                  </div>
                </div>

                {/* Personal Vault Welcoming Notice */}
                <div className="p-4 rounded-xs bg-[#F7F3EC] dark:bg-[#25283F] border border-[#191A2B]/10 dark:border-white/10 text-xs text-[#767C9D] dark:text-[#A4AAC7] leading-relaxed flex items-start gap-2.5">
                  <div className="text-[#FF684D] mt-0.5 shrink-0">
                    <SparklesIcon size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-[#191A2B] dark:text-[#F7F3EC] block mb-0.5">
                      Personal Vault Preservation
                    </span>
                    Your archival record is safe, permanent, and private. To update your password,
                    manage session security, or adjust your visual theme, visit Account Settings.
                  </div>
                </div>
              </div>

              {/* Archival Keepsake Card */}
              <div className="p-6 rounded-sm bg-[#191A2B] text-[#F7F3EC] flex items-center justify-between relative overflow-hidden shadow-md">
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-[#FF684D] uppercase block mb-1">
                    Preserved Heritage
                  </span>
                  <h3 className="font-serif text-xl font-normal text-white">
                    Echoes Archival Keepsake
                  </h3>
                  <p className="font-sans text-xs text-[#A4AAC7] mt-1 max-w-xs">
                    Every memory, photograph, and sealed capsule is preserved in your private vault
                    for generations to come.
                  </p>
                </div>
                <ArchivalStamp variant="wax" size="md" className="opacity-80" />
              </div>
            </div>

            {/* Right Column: Real Account Statistics & Ledger Feed */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Stats Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Stat 1: Memories */}
                <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/10 dark:border-white/10 p-3.5 sm:p-5 rounded-sm shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-3 text-[#FF684D]">
                    <FeatherIcon size={20} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7]">
                      Journal
                    </span>
                  </div>
                  <div>
                    <span className="font-serif text-3xl font-normal text-[#191A2B] dark:text-[#F7F3EC] block">
                      {isLoadingStats ? (
                        <Skeleton variant="text" width={40} />
                      ) : (
                        (stats?.totalMemories ?? 0)
                      )}
                    </span>
                    <span className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Memories Archived
                    </span>
                  </div>
                </div>

                {/* Stat 2: Photos */}
                <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/10 dark:border-white/10 p-3.5 sm:p-5 rounded-sm shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-3 text-[#2D9CDB]">
                    <CameraIcon size={20} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7]">
                      Exposures
                    </span>
                  </div>
                  <div>
                    <span className="font-serif text-3xl font-normal text-[#191A2B] dark:text-[#F7F3EC] block">
                      {isLoadingStats ? (
                        <Skeleton variant="text" width={40} />
                      ) : (
                        (stats?.totalPhotos ?? 0)
                      )}
                    </span>
                    <span className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      35mm Photos Enclosed
                    </span>
                  </div>
                </div>

                {/* Stat 3: Total Capsules */}
                <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/10 dark:border-white/10 p-3.5 sm:p-5 rounded-sm shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-3 text-[#4F66E8]">
                    <LockIcon size={20} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7]">
                      Capsules
                    </span>
                  </div>
                  <div>
                    <span className="font-serif text-3xl font-normal text-[#191A2B] dark:text-[#F7F3EC] block">
                      {isLoadingStats ? (
                        <Skeleton variant="text" width={40} />
                      ) : (
                        (stats?.totalCapsules ?? 0)
                      )}
                    </span>
                    <span className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Total Time Capsules
                    </span>
                  </div>
                </div>

                {/* Stat 4: Sealed Capsules */}
                <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/10 dark:border-white/10 p-3.5 sm:p-5 rounded-sm shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-3 text-[#E0A838]">
                    <LockIcon size={20} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7]">
                      Pending
                    </span>
                  </div>
                  <div>
                    <span className="font-serif text-3xl font-normal text-[#191A2B] dark:text-[#F7F3EC] block">
                      {isLoadingStats ? (
                        <Skeleton variant="text" width={40} />
                      ) : (
                        (stats?.sealedCapsules ?? 0)
                      )}
                    </span>
                    <span className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Sealed & Locked
                    </span>
                  </div>
                </div>

                {/* Stat 5: Unlocked Capsules */}
                <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/10 dark:border-white/10 p-3.5 sm:p-5 rounded-sm shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-3 text-[#2D9CDB]">
                    <UnlockIcon size={20} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7]">
                      Matured
                    </span>
                  </div>
                  <div>
                    <span className="font-serif text-3xl font-normal text-[#191A2B] dark:text-[#F7F3EC] block">
                      {isLoadingStats ? (
                        <Skeleton variant="text" width={40} />
                      ) : (
                        (stats?.unlockedCapsules ?? 0)
                      )}
                    </span>
                    <span className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Unlocked Messages
                    </span>
                  </div>
                </div>

                {/* Stat 6: Timeline Items */}
                <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/10 dark:border-white/10 p-3.5 sm:p-5 rounded-sm shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-3 text-[#191A2B] dark:text-white">
                    <SparklesIcon size={20} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7]">
                      Chronology
                    </span>
                  </div>
                  <div>
                    <span className="font-serif text-3xl font-normal text-[#191A2B] dark:text-[#F7F3EC] block">
                      {isLoadingStats ? (
                        <Skeleton variant="text" width={40} />
                      ) : (
                        (stats?.timelineEvents ?? 0)
                      )}
                    </span>
                    <span className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Timeline Milestones
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Navigation Section */}
              <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/10 dark:border-white/10 p-6 rounded-sm shadow-sm">
                <h3 className="font-serif text-xl font-normal text-[#191A2B] dark:text-[#F7F3EC] mb-4">
                  Archive Quick Traversal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link
                    href="/memories"
                    className="p-3.5 rounded-sm bg-[#F7F3EC] dark:bg-[#25283F] border border-[#191A2B]/10 dark:border-white/10 hover:border-[#FF684D] transition-colors group"
                  >
                    <span className="font-serif text-sm font-semibold text-[#191A2B] dark:text-[#F7F3EC] group-hover:text-[#FF684D] transition-colors block">
                      Open Journal →
                    </span>
                    <span className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Review personal memories and reflections
                    </span>
                  </Link>

                  <Link
                    href="/capsules"
                    className="p-3.5 rounded-sm bg-[#F7F3EC] dark:bg-[#25283F] border border-[#191A2B]/10 dark:border-white/10 hover:border-[#FF684D] transition-colors group"
                  >
                    <span className="font-serif text-sm font-semibold text-[#191A2B] dark:text-[#F7F3EC] group-hover:text-[#FF684D] transition-colors block">
                      Time Capsules →
                    </span>
                    <span className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Check countdowns and seal new letters
                    </span>
                  </Link>

                  <Link
                    href="/timeline"
                    className="p-3.5 rounded-sm bg-[#F7F3EC] dark:bg-[#25283F] border border-[#191A2B]/10 dark:border-white/10 hover:border-[#FF684D] transition-colors group"
                  >
                    <span className="font-serif text-sm font-semibold text-[#191A2B] dark:text-[#F7F3EC] group-hover:text-[#FF684D] transition-colors block">
                      Unified Timeline →
                    </span>
                    <span className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Explore chronological life stream
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </AppShell>
  );
}
