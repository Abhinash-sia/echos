'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { memoriesApi } from '@/lib/api/memories';
import { ApiClientError } from '@/lib/api/types';
import { useToast } from '@/contexts/ToastContext';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FloatingSticker } from '@/components/ui/FloatingSticker';
import { CameraIcon, CheckIcon, AlertCircleIcon } from '@/components/icons/Icons';

export default function NewMemoryPage() {
  const router = useRouter();
  const toast = useToast();

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Photos to upload after creation
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Tag Handler
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed) && tags.length < 20) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Photo Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      // 10MB limit check
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" exceeds the 10MB maximum limit.`);
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a memory title.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Please write your reflection content.');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgressText('Persisting memory record...');

      // 1. Create Memory Record
      const effectiveDate = memoryDate || new Date().toISOString().split('T')[0];
      const createdMemory = await memoriesApi.createMemory({
        title: title.trim(),
        content: content.trim(),
        memoryDate: effectiveDate,
        tags,
      });

      // 2. Upload any selected photographs sequentially
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          setUploadProgressText(`Uploading photograph ${i + 1} of ${selectedFiles.length}...`);
          await memoriesApi.uploadPhoto(createdMemory._id, selectedFiles[i]);
        }
      }

      setUploadProgressText('Memory successfully archived!');
      toast.success(
        'Memory Created',
        `"${createdMemory.title}" has been successfully etched into your vault.`
      );
      router.push(`/memories/${createdMemory._id}`);
    } catch (err: unknown) {
      console.error('[NewMemory] Submission error:', err);
      let errorText = 'An unexpected error occurred while saving your memory.';
      if (err instanceof ApiClientError) {
        errorText = err.message;
      } else if (err instanceof Error) {
        errorText = err.message;
      }
      setErrorMessage(errorText);
      toast.error('Failed to Create Memory', errorText);
      setIsSubmitting(false);
      setUploadProgressText(null);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <AppShell>
      <div className="py-8 sm:py-12">
        <Container size="standard">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumbs"
            className="mb-6 font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] flex items-center gap-2"
          >
            <Link href="/dashboard" className="hover:text-[#191A2B] dark:hover:text-[#F7F3EC]">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/memories" className="hover:text-[#191A2B] dark:hover:text-[#F7F3EC]">
              Journal
            </Link>
            <span>/</span>
            <span className="text-[#FF684D] font-semibold">New Memory</span>
          </nav>

          {/* Form Card */}
          <div className="relative bg-white dark:bg-[#1E2035] border-2 border-[#191A2B] dark:border-white/20 p-6 sm:p-10 rounded-sm shadow-xl">
            <div className="absolute -top-5 -right-4 z-10 pointer-events-none hidden sm:block">
              <FloatingSticker color="yellow" rotate={4}>
                DRAFT № 01
              </FloatingSticker>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="coral">COMPOSITION DESK</Badge>
                <span className="font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider">
                  ARCHIVAL PRESERVATION
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#191A2B] dark:text-[#F7F3EC] tracking-tight">
                Document a Personal Memory
              </h1>
              <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] mt-1">
                Reflections and attached 35mm photography are stored privately in your personal
                vault.
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-sm bg-[#FF684D]/10 border border-[#FF684D]/40 text-[#191A2B] dark:text-[#F7F3EC] flex items-start gap-3"
              >
                <span className="text-[#FF684D] mt-0.5 shrink-0">
                  <AlertCircleIcon size={18} />
                </span>
                <div className="text-xs font-sans leading-relaxed">
                  <strong className="font-semibold block text-[#FF684D]">Validation Issue</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title & Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Input
                    id="memory-title"
                    label="Memory Title"
                    placeholder="e.g., Morning Sunlight Across Cedar Rafters"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    required
                    disabled={isSubmitting}
                    helperText={`${title.length}/200 characters`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="memory-date"
                    className="block font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7] font-semibold mb-1.5"
                  >
                    Memory Date
                  </label>
                  <input
                    id="memory-date"
                    type="date"
                    value={memoryDate}
                    onChange={(e) => setMemoryDate(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full bg-[#EFE9DE] dark:bg-[#161726] border border-[#191A2B]/15 dark:border-white/10 rounded-sm px-3.5 py-2 font-mono text-sm text-[#191A2B] dark:text-[#F7F3EC] focus:outline-none focus:ring-1 focus:ring-[#FF684D]"
                  />
                </div>
              </div>

              {/* Written Content Textarea */}
              <div>
                <Textarea
                  id="memory-content"
                  label="Reflection & Written Chronicle"
                  placeholder="Record your experience, observations, textures, feelings, and thoughts..."
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  disabled={isSubmitting}
                  helperText={`${wordCount} words · ${content.length}/50,000 characters`}
                />
              </div>

              {/* Tags Inset Builder */}
              <div className="neu-inset p-4 rounded-sm">
                <label
                  htmlFor="tag-input"
                  className="block font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7] font-semibold mb-2"
                >
                  Semantic Tags (Press Enter or Comma to add)
                </label>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    id="tag-input"
                    type="text"
                    placeholder="e.g., travel, analog, autumn"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    disabled={isSubmitting || tags.length >= 20}
                    className="flex-1 bg-white dark:bg-[#1E2035] border border-[#191A2B]/10 dark:border-white/10 px-3 py-1.5 rounded-sm font-mono text-xs text-[#191A2B] dark:text-[#F7F3EC] focus:outline-none focus:ring-1 focus:ring-[#4F66E8]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={isSubmitting || !tagInput.trim() || tags.length >= 20}
                    className="neu-control px-3 py-1.5 rounded-sm font-mono text-xs font-bold text-[#191A2B] dark:text-white cursor-pointer"
                  >
                    + Add Tag
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#4F66E8] text-white font-mono text-xs font-semibold shadow-xs"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-[#FF684D] ml-1"
                          aria-label={`Remove tag ${tag}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Attach Photographs Zone */}
              <div className="neu-inset p-5 rounded-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CameraIcon size={16} className="text-[#39BFAE]" />
                    <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#191A2B] dark:text-[#F7F3EC]">
                      Attach 35mm Photographs (Optional)
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#767C9D] dark:text-[#A4AAC7]">
                    JPEG, PNG, WebP up to 10MB
                  </span>
                </div>

                <input
                  id="photo-picker"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="block w-full font-mono text-xs text-[#767C9D] file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:font-mono file:text-xs file:font-semibold file:bg-[#191A2B] file:text-white dark:file:bg-white dark:file:text-[#191A2B] hover:file:cursor-pointer mb-4"
                />

                {/* Previews Grid */}
                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                    {filePreviews.map((preview, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xs overflow-hidden border border-[#191A2B]/20 group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt={`Attachment preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="absolute top-1.5 right-1.5 bg-[#191A2B]/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-[#FF684D]"
                          aria-label="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submission Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-[#191A2B]/10 dark:border-white/10">
                <Link href="/memories">
                  <Button variant="ghost" size="md" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>

                <div className="flex items-center gap-3">
                  {uploadProgressText && (
                    <span className="font-mono text-xs text-[#4F66E8] dark:text-[#39BFAE] animate-pulse">
                      {uploadProgressText}
                    </span>
                  )}
                  <Button
                    type="submit"
                    variant="coral"
                    size="lg"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    icon={<CheckIcon size={16} />}
                  >
                    {isSubmitting ? 'Archiving...' : 'Archive Memory'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Container>
      </div>
    </AppShell>
  );
}
