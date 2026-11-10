'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { memoriesApi } from '@/lib/api/memories';
import { MemoryItem, MemoryPhoto } from '@/types/memory';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PhotoLightbox } from '@/components/ui/PhotoLightbox';
import { ArchivalStamp } from '@/components/ui/ArchivalStamp';
import { CalendarIcon, CameraIcon, AlertCircleIcon } from '@/components/icons/Icons';

function MemoryDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const toast = useToast();
  // Unwrap Next.js 16 dynamic route params directly without creating an uncached Promise
  const resolvedParams = use(params);
  const memoryId = resolvedParams.id;

  // Data State
  const [memory, setMemory] = useState<MemoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete Memory Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo Management State
  const [photoToDelete, setPhotoToDelete] = useState<MemoryPhoto | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedPhotoForView, setSelectedPhotoForView] = useState<MemoryPhoto | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Load Memory
  const loadMemory = useCallback(async () => {
    try {
      const data = await memoriesApi.getMemory(memoryId);
      setMemory(data);
      setError(null);
    } catch (err: unknown) {
      console.error('[MemoryDetail] Load error:', err);
      setError('Memory record not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [memoryId]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await memoriesApi.getMemory(memoryId);
        if (isMounted) {
          setMemory(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('[MemoryDetail] Load error:', err);
          setError('Memory record not found or access denied.');
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
  }, [memoryId]);

  // Delete Memory Handler
  const handleDeleteMemory = async () => {
    try {
      setIsDeleting(true);
      await memoriesApi.deleteMemory(memoryId);
      toast.success('Memory Deleted', 'The memory record was permanently removed from your vault.');
      router.push('/memories');
    } catch (err: unknown) {
      console.error('[MemoryDetail] Delete error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete memory.';
      toast.error('Deletion Failed', msg);
      setIsDeleting(false);
    }
  };

  // Upload Photo Handler
  const handlePhotoUpload = async (file: File) => {
    setUploadError(null);

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      const msg = `"${file.name}" exceeds the 10MB size limit.`;
      setUploadError(msg);
      toast.error('File Too Large', msg);
      return;
    }

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowed.includes(file.type)) {
      const msg = 'Invalid file type. Supported formats: JPEG, PNG, WebP, GIF, AVIF.';
      setUploadError(msg);
      toast.error('Invalid Format', msg);
      return;
    }

    try {
      setIsUploadingPhoto(true);
      await memoriesApi.uploadPhoto(memoryId, file);
      toast.success('Photograph Uploaded', `"${file.name}" added to archive.`);
      // Refresh memory to display updated photos with signed URLs
      await loadMemory();
    } catch (err: unknown) {
      console.error('[PhotoUpload] Error:', err);
      const msg = err instanceof Error ? err.message : 'Photo upload failed.';
      setUploadError(msg);
      toast.error('Upload Failed', msg);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoUpload(e.dataTransfer.files[0]);
    }
  };

  // Delete Photo Handler
  const handleDeletePhotoConfirm = async () => {
    if (!photoToDelete) return;

    try {
      setIsDeletingPhoto(true);
      await memoriesApi.deletePhoto(memoryId, photoToDelete._id);
      toast.success('Photograph Deleted', 'The image was removed from the memory record.');
      setPhotoToDelete(null);
      await loadMemory();
    } catch (err: unknown) {
      console.error('[DeletePhoto] Error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete photograph.';
      toast.error('Delete Failed', msg);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-12">
          <Container size="narrow">
            <div className="animate-pulse space-y-6">
              <div className="h-6 w-36 bg-[#191A2B]/10 dark:bg-white/10 rounded" />
              <div className="h-12 w-3/4 bg-[#191A2B]/10 dark:bg-white/10 rounded" />
              <div className="h-4 w-48 bg-[#191A2B]/10 dark:bg-white/10 rounded" />
              <div className="h-64 bg-[#191A2B]/5 dark:bg-white/5 rounded" />
            </div>
          </Container>
        </div>
      </AppShell>
    );
  }

  if (error || !memory) {
    return (
      <AppShell>
        <div className="py-12">
          <Container size="narrow">
            <div className="neu-raised p-8 rounded-sm text-center">
              <AlertCircleIcon size={32} className="mx-auto text-[#FF684D] mb-4" />
              <h1 className="font-serif text-2xl text-[#191A2B] dark:text-[#F7F3EC] mb-2">
                Entry Not Found
              </h1>
              <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] mb-6">
                {error || 'This memory does not exist or you do not have permission to access it.'}
              </p>
              <Link href="/memories">
                <Button variant="secondary" size="md">
                  Return to Journal
                </Button>
              </Link>
            </div>
          </Container>
        </div>
      </AppShell>
    );
  }

  const formattedMemoryDate = new Date(memory.memoryDate).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedCreatedDate = new Date(memory.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const photoCount = Array.isArray(memory.photos) ? memory.photos.length : 0;

  return (
    <AppShell>
      <div className="py-8 sm:py-12">
        <Container size="narrow">
          {/* Breadcrumbs Navigation */}
          <nav
            aria-label="Breadcrumb navigation"
            className="mb-8 font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="hover:text-[#191A2B] dark:hover:text-[#F7F3EC]">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/memories" className="hover:text-[#191A2B] dark:hover:text-[#F7F3EC]">
                Journal
              </Link>
              <span>/</span>
              <span className="text-[#FF684D] font-semibold truncate max-w-[150px] sm:max-w-[200px]">
                {memory.title}
              </span>
            </div>

            {/* Action Bar (Selective Neumorphism) */}
            <div className="flex items-center gap-2">
              <Link href={`/memories/${memory._id}/edit`}>
                <button
                  type="button"
                  className="neu-control px-3 py-1.5 rounded-sm font-mono text-xs font-semibold text-[#191A2B] dark:text-[#F7F3EC] cursor-pointer"
                >
                  Edit Memory
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="neu-control px-3 py-1.5 rounded-sm font-mono text-xs font-semibold text-[#FF684D] hover:bg-[#FF684D]/10 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </nav>

          {/* =========================================================================
              1. EDITORIAL READING SURFACE: Monograph Header & Typography
              ========================================================================= */}
          <article className="relative bg-white dark:bg-[#1E2035] border-2 border-[#191A2B] dark:border-white/20 p-4 sm:p-12 rounded-sm shadow-xl mb-12">
            {/* Header Plate */}
            <header className="mb-8 pb-8 border-b border-[#191A2B]/10 dark:border-white/10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 font-mono text-xs text-[#FF684D] font-bold">
                  <CalendarIcon size={16} />
                  <span>{formattedMemoryDate}</span>
                </div>

                <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[#767C9D] dark:text-[#A4AAC7]">
                  <span>Archived on {formattedCreatedDate}</span>
                </div>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#191A2B] dark:text-[#F7F3EC] tracking-tight leading-tight mb-4">
                {memory.title}
              </h1>

              {/* Tags */}
              {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {memory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-xs uppercase px-2.5 py-0.5 rounded-xs bg-[#EFE9DE] dark:bg-[#25283F] text-[#484C69] dark:text-[#A4AAC7] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Prose Body */}
            <div className="prose prose-lg dark:prose-invert max-w-none font-serif text-lg sm:text-xl leading-relaxed text-[#191A2B] dark:text-[#EFE9DE] whitespace-pre-wrap mb-10">
              {memory.content}
            </div>

            {/* Archival Authenticity Mark */}
            <div className="pt-6 border-t border-[#191A2B]/10 dark:border-white/10 flex items-center justify-between font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7]">
              <div className="flex items-center gap-2">
                <ArchivalStamp variant="wax" size="sm" />
                <span>Verified Private Sanctuary</span>
              </div>
              <span>ID: {memory._id}</span>
            </div>
          </article>

          {/* =========================================================================
              2. PHOTOGRAPH GALLERY & UPLOAD SECTION
              ========================================================================= */}
          <section className="neu-raised p-6 sm:p-8 rounded-sm mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CameraIcon size={18} className="text-[#39BFAE]" />
                  <h2 className="font-serif text-2xl font-normal text-[#191A2B] dark:text-[#F7F3EC]">
                    Photographic Archive ({photoCount})
                  </h2>
                </div>
                <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7]">
                  Private authenticated photographs delivered via signed Cloudinary links
                </p>
              </div>
            </div>

            {/* Gallery Grid */}
            {photoCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                {memory.photos.map((photo, index) => (
                  <div
                    key={photo._id || index}
                    className="group relative bg-[#EFE9DE] dark:bg-[#161726] border-2 border-[#191A2B] dark:border-white/20 rounded-xs overflow-hidden shadow-md"
                  >
                    <div
                      className="aspect-[4/3] relative cursor-pointer overflow-hidden"
                      onClick={() => setSelectedPhotoForView(photo)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.signedUrl || photo.secureUrl || photo.url}
                        alt={photo.caption || `Photograph ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Overlay Action Bar */}
                    <div className="p-3 bg-white dark:bg-[#1E2035] flex items-center justify-between border-t border-[#191A2B]/10 text-xs font-mono">
                      <span className="text-[#767C9D] dark:text-[#A4AAC7] truncate max-w-[120px]">
                        PLATE {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPhotoToDelete(photo)}
                        className="text-[#FF684D] hover:underline cursor-pointer"
                        title="Remove photo from memory"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 neu-inset rounded-sm text-center mb-6">
                <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7]">
                  No photographs attached to this memory yet.
                </p>
              </div>
            )}

            {/* Drag & Drop Photo Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`p-6 rounded-sm border-2 border-dashed transition-colors text-center ${
                isDragging
                  ? 'border-[#FF684D] bg-[#FF684D]/5'
                  : 'border-[#191A2B]/20 dark:border-white/20 neu-inset'
              }`}
            >
              <CameraIcon size={28} className="mx-auto text-[#FF684D] mb-2" />
              <h3 className="font-serif text-lg font-normal text-[#191A2B] dark:text-[#F7F3EC] mb-1">
                Upload New Photograph
              </h3>
              <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mb-4">
                Drag and drop your image here, or browse from your computer (JPEG, PNG, WebP up to
                10MB)
              </p>

              {uploadError && (
                <div className="mb-4 text-xs text-[#FF684D] font-mono">{uploadError}</div>
              )}

              <label className="neu-control inline-flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs font-bold text-[#191A2B] dark:text-white cursor-pointer">
                <span>{isUploadingPhoto ? 'Uploading to Private Vault...' : 'Choose File'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  onChange={handleFileInputChange}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>
          </section>

          {/* Delete Memory Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Memory Record?"
          >
            <div className="space-y-4">
              <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7]">
                Are you sure you want to permanently delete{' '}
                <strong className="text-[#191A2B] dark:text-[#F7F3EC] font-semibold">
                  &ldquo;{memory.title}&rdquo;
                </strong>
                ?
              </p>
              <p className="font-sans text-xs text-[#FF684D] bg-[#FF684D]/10 p-3 rounded-sm border border-[#FF684D]/30">
                This action is atomic and irreversible. All associated written chronicles and
                uploaded photographs will be deleted from MongoDB and Cloudinary.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#191A2B]/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="coral"
                  size="sm"
                  onClick={handleDeleteMemory}
                  loading={isDeleting}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Delete Photo Confirmation Modal */}
          <Modal
            isOpen={photoToDelete !== null}
            onClose={() => setPhotoToDelete(null)}
            title="Remove Photograph?"
          >
            <div className="space-y-4">
              <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7]">
                Are you sure you want to purge this photograph? It will be removed from Cloudinary
                and unlinked from this memory entry.
              </p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#191A2B]/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPhotoToDelete(null)}
                  disabled={isDeletingPhoto}
                >
                  Cancel
                </Button>
                <Button
                  variant="coral"
                  size="sm"
                  onClick={handleDeletePhotoConfirm}
                  loading={isDeletingPhoto}
                  disabled={isDeletingPhoto}
                >
                  {isDeletingPhoto ? 'Removing...' : 'Delete Photo'}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Photo Lightbox Modal */}
          <PhotoLightbox
            isOpen={Boolean(selectedPhotoForView)}
            photos={memory.photos || []}
            currentIndex={
              memory.photos
                ? Math.max(
                    0,
                    memory.photos.findIndex((p) => p._id === selectedPhotoForView?._id)
                  )
                : 0
            }
            onClose={() => setSelectedPhotoForView(null)}
            onNavigate={(newIdx) => {
              if (memory.photos && memory.photos[newIdx]) {
                setSelectedPhotoForView(memory.photos[newIdx]);
              }
            }}
            title={memory.title}
          />
        </Container>
      </div>
    </AppShell>
  );
}

export default function MemoryDetailPage({
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
      <MemoryDetailContent params={params} />
    </React.Suspense>
  );
}
