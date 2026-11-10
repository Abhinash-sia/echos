'use client';

import React, { useCallback, useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { capsulesApi } from '@/lib/api/capsules';
import { ApiClientError } from '@/lib/api/types';
import { TimeCapsuleItem } from '@/types/capsule';
import { MemoryPhoto } from '@/types/memory';
import { CountdownTimer } from '@/components/capsules/CountdownTimer';
import {
  LockIcon,
  UnlockIcon,
  ChevronLeftIcon,
  TrashIcon,
  SparklesIcon,
  CameraIcon,
  AlertCircleIcon,
} from '@/components/icons/Icons';
import { Button } from '@/components/ui/Button';
import { PhotoLightbox } from '@/components/ui/PhotoLightbox';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/contexts/ToastContext';

function CapsuleDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const toast = useToast();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [capsule, setCapsule] = useState<TimeCapsuleItem | null>(null);
  const [isLockedByServer, setIsLockedByServer] = useState<boolean | null>(null);
  const [lockedUnlockDate, setLockedUnlockDate] = useState<string | null>(null);
  const [lockedTitle, setLockedTitle] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unsealing action states
  const [isUnsealing, setIsUnsealing] = useState(false);
  const [unsealError, setUnsealError] = useState<string | null>(null);
  const [justUnsealed, setJustUnsealed] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Photo lightbox state
  const [activePhoto, setActivePhoto] = useState<MemoryPhoto | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCapsule = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    async function load() {
      setIsLoading(true);
      setError(null);
      setUnsealError(null);

      try {
        // First attempt direct detail retrieval
        const data = await capsulesApi.getCapsule(id);
        if (isMounted) {
          setCapsule(data);
          setIsLockedByServer(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;

        if (err instanceof ApiClientError && err.status === 403) {
          // Locked state strictly enforced by server!
          setIsLockedByServer(true);

          // Extract unlock date if returned by server
          const raw = err.raw as { unlockDate?: string; isLocked?: boolean } | undefined;
          if (raw?.unlockDate) {
            setLockedUnlockDate(raw.unlockDate);
          }

          // Check if title is returned via list API for authenticated user
          try {
            const listRes = await capsulesApi.getCapsules({ limit: 50 });
            if (isMounted) {
              const matched = listRes.data.find((c) => c._id === id);
              if (matched) {
                if (matched.title) setLockedTitle(matched.title);
                if (matched.unlockDate && !raw?.unlockDate) setLockedUnlockDate(matched.unlockDate);
              }
            }
          } catch {
            // Ignore secondary list failure
          }
        } else if (err instanceof ApiClientError && err.status === 404) {
          setError('Time capsule not found or access denied.');
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred while retrieving the time capsule.'
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
  }, [id, refreshTrigger]);

  // Handle explicit open action
  const handleOpenCapsule = async () => {
    if (!id) return;
    setIsUnsealing(true);
    setUnsealError(null);

    try {
      // Server authoritative unseal endpoint
      const updated = await capsulesApi.openCapsule(id);
      setCapsule(updated);
      setIsLockedByServer(false);
      setJustUnsealed(true);
      toast.success(
        'Time Capsule Unlocked',
        `"${updated.title}" has reached its temporal destination.`
      );
    } catch (err: unknown) {
      console.error('Failed to unseal capsule:', err);
      let errorMsg = 'Could not unseal the time capsule. Please try again.';
      if (err instanceof ApiClientError && err.status === 403) {
        errorMsg =
          'Server temporal boundary not yet reached. Client and server clocks must align; the server clock is authoritative.';
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setUnsealError(errorMsg);
      toast.error('Cannot Unseal Capsule', errorMsg);
    } finally {
      setIsUnsealing(false);
    }
  };

  // Handle capsule deletion
  const handleDeleteCapsule = async () => {
    if (!id) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await capsulesApi.deleteCapsule(id);
      toast.success('Capsule Destroyed', 'The time capsule record has been expunged.');
      router.push('/capsules');
    } catch (err: unknown) {
      console.error('Failed to delete capsule:', err);
      const msg =
        err instanceof Error ? err.message : 'Failed to delete capsule. Please try again.';
      setDeleteError(msg);
      toast.error('Deletion Failed', msg);
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="py-8 md:py-12">
        <Container>
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/capsules"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--ink-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <ChevronLeftIcon size={14} />
              <span>Back to Time Capsules</span>
            </Link>

            {/* Delete button (available in both states with confirmation) */}
            {!isLoading && !error && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 font-mono text-xs transition-colors"
              >
                <TrashIcon size={13} />
                <span>Delete Capsule</span>
              </button>
            )}
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
              <div className="h-8 w-48 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="h-12 w-3/4 bg-black/10 dark:bg-white/10 rounded-2xl" />
              <div className="h-64 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5" />
            </div>
          )}

          {/* Fatal Error State (e.g. 404 Not Found) */}
          {!isLoading && error && (
            <div className="max-w-lg mx-auto rounded-3xl border border-rose-500/20 bg-rose-500/10 p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <AlertCircleIcon size={28} />
              </div>
              <h2 className="font-editorial text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Access Denied or Not Found
              </h2>
              <p className="font-mono text-xs text-rose-600 dark:text-rose-400">{error}</p>
              <div className="pt-2">
                <Link href="/capsules">
                  <Button variant="outline" size="sm">
                    Return to Vault
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* =========================================================================
              LOCKED STATE: Server-authoritative temporal restriction
             ========================================================================= */}
          {!isLoading && !error && isLockedByServer && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
              {/* Sealed Capsule Chamber */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-[var(--cobalt-blue)]/30 bg-[var(--surface-color)] p-5 sm:p-8 md:p-12 neu-raised text-center flex flex-col items-center">
                {/* Visual Lock Emblem */}
                <div className="relative my-4">
                  <div className="w-24 h-24 rounded-full border-2 border-[var(--cobalt-blue)]/30 bg-[var(--cobalt-blue)]/10 flex items-center justify-center text-[var(--cobalt-blue)] neu-control shadow-xl">
                    <LockIcon size={40} />
                  </div>
                  <div className="absolute -inset-2 rounded-full border border-[var(--cobalt-blue)]/20 animate-ping pointer-events-none" />
                </div>

                {/* Status Badges */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-semibold bg-[var(--cobalt-blue)]/10 text-[var(--cobalt-blue)] border border-[var(--cobalt-blue)]/20 mb-3">
                  <LockIcon size={12} />
                  <span>Server-Enforced Temporal Seal</span>
                </div>

                {/* Title (displayed only if returned by API) */}
                {lockedTitle && (
                  <h1 className="font-editorial text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] mb-3">
                    {lockedTitle}
                  </h1>
                )}

                {/* Target Unlock Date (displayed only if returned by API) */}
                {lockedUnlockDate ? (
                  <div className="space-y-4 my-4 w-full">
                    <p className="font-mono text-xs text-[var(--ink-muted)]">
                      Scheduled for unsealing on{' '}
                      <span className="font-bold text-[var(--foreground)]">
                        {new Date(lockedUnlockDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>

                    {/* Live Countdown Clock */}
                    <div className="flex justify-center my-6">
                      <CountdownTimer
                        targetDate={lockedUnlockDate}
                        size="lg"
                        onExpire={() => {
                          // When clock reaches 0, recheck with authoritative server
                          fetchCapsule();
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="font-mono text-xs text-[var(--ink-muted)] my-4">
                    Unlock schedule strictly verified by the server.
                  </p>
                )}

                {/* Explicit Privacy & Security Notice */}
                <div className="w-full rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-4 text-xs font-mono text-[var(--ink-muted)] text-left space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-[var(--foreground)] font-bold">
                    <LockIcon size={14} />
                    <span>Inviolable Privacy Invariant</span>
                  </div>
                  <p className="leading-relaxed">
                    Personal message contents and attached photographs are completely protected on
                    the backend server and omitted from all responses. Client-side clock
                    manipulation cannot bypass this lock.
                  </p>
                </div>

                {/* Check status button to verify with server */}
                <div className="pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCapsule}
                    className="font-mono text-xs"
                  >
                    Check Server Unlock Status
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              UNLOCKED STATE: Letter revealed after server verification
             ========================================================================= */}
          {!isLoading && !error && !isLockedByServer && capsule && (
            <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
              {/* Unsealing announcement if just unsealed */}
              {justUnsealed && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <SparklesIcon size={16} />
                  <span>The seal has been broken! Your time capsule is unsealed.</span>
                </div>
              )}

              {/* Unseal error alert if server rejects */}
              {unsealError && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 font-mono text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircleIcon size={16} />
                  <span>{unsealError}</span>
                </div>
              )}

              {/* If unlocked on server but not yet opened by user: show "Break Seal" prompt */}
              {!capsule.isOpened ? (
                <div className="rounded-3xl border-2 border-[var(--electric-coral)]/30 bg-[var(--surface-color)] p-5 sm:p-8 md:p-12 text-center neu-raised space-y-6 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] flex items-center justify-center neu-control mb-2 animate-bounce">
                    <UnlockIcon size={36} />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-semibold bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] border border-[var(--electric-coral)]/30">
                    <span>The Appointed Time Has Arrived</span>
                  </div>

                  <h1 className="font-editorial text-3xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">
                    {capsule.title}
                  </h1>

                  <p className="text-sm md:text-base text-[var(--ink-muted)] max-w-lg leading-relaxed">
                    This capsule was sealed on{' '}
                    {new Date(capsule.sealedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    . The server unlock time has officially passed. Break the archival seal to read
                    your letter.
                  </p>

                  <div className="pt-4">
                    <Button
                      variant="coral"
                      size="lg"
                      onClick={handleOpenCapsule}
                      disabled={isUnsealing}
                      className="gap-2 shadow-xl px-8 text-base"
                    >
                      <UnlockIcon size={18} />
                      <span>{isUnsealing ? 'Breaking Seal...' : 'Break Seal & Open Capsule'}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Unsealed Letter Reading Experience */
                <article className="rounded-3xl border-2 border-black/10 dark:border-white/10 bg-[var(--surface-color)] p-5 sm:p-8 md:p-12 neu-raised space-y-8">
                  {/* Letter Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <UnlockIcon size={12} />
                        <span>Unsealed Time Capsule</span>
                      </div>
                      <div className="font-mono text-xs text-[var(--ink-muted)]">
                        Unsealed on{' '}
                        {capsule.openedAt
                          ? new Date(capsule.openedAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Unlocked'}
                      </div>
                    </div>

                    <div className="font-mono text-xs text-[var(--ink-muted)] text-right">
                      <div>
                        Sealed:{' '}
                        {new Date(capsule.sealedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Letter Title */}
                  <h1 className="font-editorial text-4xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">
                    {capsule.title}
                  </h1>

                  {/* Letter Message Body */}
                  <div className="prose dark:prose-invert max-w-none font-serif text-lg md:text-xl leading-relaxed text-[var(--foreground)] whitespace-pre-wrap py-4 border-y border-black/5 dark:border-white/5">
                    {capsule.message || (
                      <p className="italic text-[var(--ink-muted)]">No message body recorded.</p>
                    )}
                  </div>

                  {/* Attached Photographs Gallery */}
                  {Array.isArray(capsule.photos) && capsule.photos.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                        <CameraIcon size={14} />
                        <span>Enclosed Photographs ({capsule.photos.length})</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {capsule.photos.map((photo, pIdx) => {
                          const p = typeof photo === 'string' ? null : photo;
                          const photoUrl = p?.signedUrl || p?.url;
                          if (!photoUrl) return null;

                          return (
                            <button
                              type="button"
                              key={p?._id || p?.id || pIdx}
                              onClick={() => setActivePhoto(p)}
                              className="group relative aspect-square rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 neu-control shadow-sm hover:scale-105 transition-all text-left"
                            >
                              <Image
                                src={photoUrl}
                                alt={p?.caption || capsule.title}
                                fill
                                className="object-cover"
                                sizes="200px"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-xs">
                                View Full
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              )}
            </div>
          )}
        </Container>
      </div>

      {/* Photo Lightbox Modal */}
      <PhotoLightbox
        isOpen={Boolean(activePhoto)}
        photos={
          capsule?.photos ? capsule.photos.map((p) => (typeof p === 'string' ? { url: p } : p)) : []
        }
        currentIndex={
          capsule?.photos
            ? Math.max(
                0,
                capsule.photos.findIndex((p) => {
                  const pid = typeof p === 'string' ? p : p._id || p.id;
                  const activeId = activePhoto?._id || activePhoto?.id;
                  return pid === activeId;
                })
              )
            : 0
        }
        onClose={() => setActivePhoto(null)}
        onNavigate={(newIdx) => {
          if (capsule?.photos && capsule.photos[newIdx]) {
            const nextPhoto = capsule.photos[newIdx];
            if (typeof nextPhoto !== 'string') {
              setActivePhoto(nextPhoto);
            }
          }
        }}
        title={capsule?.title || 'Capsule Photograph'}
      />

      {/* Capsule Deletion Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCapsule}
        title="Permanently Delete Capsule?"
        description={
          deleteError
            ? `${deleteError} Please try again.`
            : 'This action cannot be undone. The time capsule letter and any exclusively attached assets will be permanently purged from the vault.'
        }
        confirmLabel="Confirm Deletion"
        cancelLabel="Keep Capsule"
        variant="danger"
        isConfirming={isDeleting}
      />
    </AppShell>
  );
}

export default function CapsuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F3EC] dark:bg-[#191A2B] flex flex-col justify-center items-center">
          <div className="w-10 h-10 border-4 border-[#FF684D] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CapsuleDetailContent params={params} />
    </React.Suspense>
  );
}
