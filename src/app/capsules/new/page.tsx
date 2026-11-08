'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { capsulesApi } from '@/lib/api/capsules';
import { memoriesApi } from '@/lib/api/memories';
import { MemoryPhoto } from '@/types/memory';
import { SealingAnimationModal } from '@/components/capsules/SealingAnimationModal';
import { LockIcon, SparklesIcon, ChevronLeftIcon, CheckIcon } from '@/components/icons/Icons';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

export default function NewCapsulePage() {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [isFutureDate, setIsFutureDate] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [availablePhotos, setAvailablePhotos] = useState<MemoryPhoto[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sealing ceremony animation state
  const [sealingSuccessId, setSealingSuccessId] = useState<string | null>(null);
  const [showSealingModal, setShowSealingModal] = useState(false);

  // Fetch available photos from existing memories
  useEffect(() => {
    async function loadUserPhotos() {
      try {
        const res = await memoriesApi.getMemories({ limit: 50 });
        const photosList: MemoryPhoto[] = [];
        const seenIds = new Set<string>();

        res.data.forEach((mem) => {
          if (Array.isArray(mem.photos)) {
            mem.photos.forEach((p) => {
              const pid = p._id || p.publicId;
              if (pid && !seenIds.has(pid)) {
                seenIds.add(pid);
                photosList.push(p);
              }
            });
          }
        });

        setAvailablePhotos(photosList);
      } catch (err) {
        console.error('Could not load user photos for capsule attachment:', err);
      }
    }

    loadUserPhotos();
  }, []);

  const updateDateValue = (val: string) => {
    setUnlockDate(val);
    if (!val) {
      setIsFutureDate(false);
    } else {
      const d = new Date(val).getTime();
      setIsFutureDate(!isNaN(d) && d > Date.now());
    }
  };

  // Quick preset helper
  const handleQuickPreset = (daysInFuture: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysInFuture);
    // Format to YYYY-MM-DDThh:mm
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localISOTime = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    updateDateValue(localISOTime);
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Capsule title is required.');
      return;
    }

    if (!message.trim()) {
      setError('Please write your letter to the future.');
      return;
    }

    if (!unlockDate) {
      setError('Please specify an unlock date.');
      return;
    }

    const targetDate = new Date(unlockDate);
    if (isNaN(targetDate.getTime()) || targetDate.getTime() <= Date.now()) {
      setError('Unlock date must be strictly in the future.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await capsulesApi.createCapsule({
        title: title.trim(),
        message: message.trim(),
        unlockDate: targetDate.toISOString(),
        photos: selectedPhotoIds.length > 0 ? selectedPhotoIds : undefined,
      });

      // Trigger tactile sealing ceremony modal
      setSealingSuccessId(res._id);
      setShowSealingModal(true);
    } catch (err: unknown) {
      console.error('Failed to create capsule:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to seal your time capsule. Please check the fields and try again.';
      setError(msg);
      toast.error('Sealing Failed', msg);
      setIsSubmitting(false);
    }
  };

  const handleCeremonyComplete = () => {
    toast.success(
      'Time Capsule Sealed',
      `"${title.trim()}" has been locked against the passage of time.`
    );
    if (sealingSuccessId) {
      router.push(`/capsules/${sealingSuccessId}`);
    }
  };

  return (
    <AppShell>
      <div className="py-8 md:py-12">
        <Container>
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              href="/capsules"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--ink-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <ChevronLeftIcon size={14} />
              <span>Back to Time Capsules</span>
            </Link>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            {/* Header banner */}
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-semibold bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] border border-[var(--electric-coral)]/20">
                <SparklesIcon size={14} />
                <span>Letter to the Future</span>
              </div>
              <h1 className="font-editorial text-4xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">
                Seal a Time Capsule
              </h1>
              <p className="text-sm md:text-base text-[var(--ink-muted)] leading-relaxed">
                Pen a message to your future self or loved ones. Once sealed, server-enforced date
                locking will protect the letter until the exact arrival moment.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-mono text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Main Form: Letter-Writing Experience */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Parchment Letter Container */}
              <div className="relative rounded-3xl border-2 border-black/10 dark:border-white/10 bg-[var(--surface-color)] p-6 md:p-10 neu-raised space-y-6">
                {/* Decorative Archival Header Stamp */}
                <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
                  <div className="font-mono text-xs tracking-widest uppercase text-[var(--ink-muted)] font-bold">
                    Official Time Capsule Dispatch
                  </div>
                  <div className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--cobalt-blue)]">
                    <LockIcon size={13} />
                    <span>Server Date-Locked</span>
                  </div>
                </div>

                {/* Title Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="capsule-title"
                    className="block font-mono text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]"
                  >
                    Capsule Title <span className="text-[var(--electric-coral)]">*</span>
                  </label>
                  <input
                    id="capsule-title"
                    type="text"
                    required
                    maxLength={200}
                    placeholder="e.g. Reflections for My 30th Birthday, Letter on Leaving Tokyo..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] text-[var(--foreground)] font-editorial text-xl neu-inset focus:outline-none focus:ring-2 focus:ring-[var(--electric-coral)]"
                  />
                  <div className="flex justify-end font-mono text-[10px] text-[var(--ink-muted)]">
                    {title.length}/200 characters
                  </div>
                </div>

                {/* Future Unlock Date Picker & Quick Presets */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label
                      htmlFor="capsule-unlock-date"
                      className="block font-mono text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]"
                    >
                      Future Unlock Date & Time{' '}
                      <span className="text-[var(--electric-coral)]">*</span>
                    </label>
                    <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                      Authoritative server verification applies
                    </span>
                  </div>

                  {/* Preset Quick Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickPreset(30)}
                      className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 font-mono text-xs font-semibold hover:bg-[var(--cobalt-blue)] hover:text-white transition-colors"
                    >
                      +1 Month
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset(180)}
                      className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 font-mono text-xs font-semibold hover:bg-[var(--cobalt-blue)] hover:text-white transition-colors"
                    >
                      +6 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset(365)}
                      className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 font-mono text-xs font-semibold hover:bg-[var(--cobalt-blue)] hover:text-white transition-colors"
                    >
                      +1 Year
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset(1825)}
                      className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 font-mono text-xs font-semibold hover:bg-[var(--cobalt-blue)] hover:text-white transition-colors"
                    >
                      +5 Years
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="capsule-unlock-date"
                      type="datetime-local"
                      required
                      value={unlockDate}
                      onChange={(e) => updateDateValue(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] text-[var(--foreground)] font-mono text-sm neu-inset focus:outline-none focus:ring-2 focus:ring-[var(--electric-coral)]"
                    />
                  </div>

                  {unlockDate && (
                    <div className="font-mono text-xs">
                      {isFutureDate ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckIcon size={14} />
                          Valid future unlock date scheduled
                        </span>
                      ) : (
                        <span className="text-rose-500 font-semibold">
                          ⚠️ Unlock date must be in the future.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Personal Letter Message Field */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="capsule-message"
                      className="block font-mono text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]"
                    >
                      Letter Message <span className="text-[var(--electric-coral)]">*</span>
                    </label>
                    <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                      {message.length}/100,000 chars
                    </span>
                  </div>

                  <textarea
                    id="capsule-message"
                    required
                    rows={10}
                    maxLength={100000}
                    placeholder="Dear Future Me,&#10;&#10;Today, things feel very specific and fleeting. I am writing this to capture what matters right now..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] text-[var(--foreground)] font-serif text-base leading-relaxed neu-inset focus:outline-none focus:ring-2 focus:ring-[var(--electric-coral)] resize-y"
                  />
                </div>

                {/* Attached Photo Assets Selection */}
                {availablePhotos.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-black/10 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                        Enclose Vault Photographs (Optional)
                      </label>
                      <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                        {selectedPhotoIds.length} attached
                      </span>
                    </div>

                    <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                      Select photographs from your existing memory journal to seal into this
                      capsule. Their signed delivery will remain inaccessible until the unlock date.
                    </p>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 pt-1 max-h-48 overflow-y-auto p-1">
                      {availablePhotos.map((photo) => {
                        const pid = photo._id || photo.id || '';
                        const isSelected = selectedPhotoIds.includes(pid);
                        const photoSrc = photo.signedUrl || photo.url;
                        if (!photoSrc) return null;

                        return (
                          <button
                            type="button"
                            key={pid}
                            onClick={() => togglePhotoSelection(pid)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                              isSelected
                                ? 'border-[var(--electric-coral)] ring-2 ring-[var(--electric-coral)]/40 scale-95'
                                : 'border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <Image
                              src={photoSrc}
                              alt={photo.caption || 'Vault photo'}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[var(--electric-coral)]/30 flex items-center justify-center text-white">
                                <CheckIcon size={16} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Security & Access Clarification Note */}
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-[var(--ink-muted)] leading-relaxed space-y-1">
                <p className="font-semibold text-[var(--foreground)]">
                  🔒 Server-Enforced Date Locking:
                </p>
                <p>
                  Your time capsule letter will be sealed on the backend database. Unlocking is
                  governed strictly by server-verified timestamps. Client-side time modifications
                  cannot expose sealed contents prematurely.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-4">
                <Link href="/capsules">
                  <Button variant="outline" type="button" size="md">
                    Cancel
                  </Button>
                </Link>

                <Button
                  variant="coral"
                  type="submit"
                  size="md"
                  disabled={isSubmitting || !isFutureDate}
                  className="gap-2 shadow-lg"
                >
                  <LockIcon size={16} />
                  <span>{isSubmitting ? 'Sealing Capsule...' : 'Seal in Time'}</span>
                </Button>
              </div>
            </form>
          </div>
        </Container>
      </div>

      {/* Atmospheric Sealing Animation Ceremony Modal */}
      <SealingAnimationModal
        isOpen={showSealingModal}
        title={title}
        unlockDate={unlockDate}
        onComplete={handleCeremonyComplete}
      />
    </AppShell>
  );
}
