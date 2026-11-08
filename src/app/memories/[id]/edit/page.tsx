'use client';

import React, { useState, useEffect, use } from 'react';
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
import { CheckIcon, AlertCircleIcon } from '@/components/icons/Icons';

function EditMemoryContent({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const resolvedParams = use(Promise.resolve(params));
  const memoryId = resolvedParams.id;

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Page State
  const [isLoadingMemory, setIsLoadingMemory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing memory
  useEffect(() => {
    let isMounted = true;

    async function fetchMemory() {
      try {
        setIsLoadingMemory(true);
        const data = await memoriesApi.getMemory(memoryId);
        if (isMounted) {
          setTitle(data.title);
          setContent(data.content);
          setMemoryDate(new Date(data.memoryDate).toISOString().split('T')[0]);
          setTags(Array.isArray(data.tags) ? data.tags : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[EditMemory] Fetch error:', err);
          setErrorMessage('Could not load memory for editing.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingMemory(false);
        }
      }
    }

    fetchMemory();

    return () => {
      isMounted = false;
    };
  }, [memoryId]);

  // Tag Handlers
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Memory title cannot be empty.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Memory content cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      await memoriesApi.updateMemory(memoryId, {
        title: title.trim(),
        content: content.trim(),
        memoryDate,
        tags,
      });

      toast.success('Memory Updated', `"${title.trim()}" has been saved.`);
      router.push(`/memories/${memoryId}`);
    } catch (err: unknown) {
      console.error('[EditMemory] Update error:', err);
      let errorText = 'Failed to save memory updates.';
      if (err instanceof ApiClientError) {
        errorText = err.message;
      } else if (err instanceof Error) {
        errorText = err.message;
      }
      setErrorMessage(errorText);
      toast.error('Failed to Update Memory', errorText);
      setIsSubmitting(false);
    }
  };

  if (isLoadingMemory) {
    return (
      <AppShell>
        <div className="py-12">
          <Container size="standard">
            <div className="neu-raised p-8 rounded-sm animate-pulse space-y-4">
              <div className="h-6 w-36 bg-[#191A2B]/10 dark:bg-white/10 rounded" />
              <div className="h-10 w-full bg-[#191A2B]/10 dark:bg-white/10 rounded" />
              <div className="h-40 w-full bg-[#191A2B]/10 dark:bg-white/10 rounded" />
            </div>
          </Container>
        </div>
      </AppShell>
    );
  }

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
            <Link
              href={`/memories/${memoryId}`}
              className="hover:text-[#191A2B] dark:hover:text-[#F7F3EC] truncate max-w-[150px]"
            >
              {title || 'Entry'}
            </Link>
            <span>/</span>
            <span className="text-[#FF684D] font-semibold">Edit</span>
          </nav>

          {/* Form Card */}
          <div className="relative bg-white dark:bg-[#1E2035] border-2 border-[#191A2B] dark:border-white/20 p-6 sm:p-10 rounded-sm shadow-xl">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="cobalt">EDIT CHRONICLE</Badge>
                <span className="font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider">
                  UPDATE RECORD
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#191A2B] dark:text-[#F7F3EC] tracking-tight">
                Edit Memory Record
              </h1>
              <p className="font-sans text-sm text-[#484C69] dark:text-[#A4AAC7] mt-1">
                Revise written content, tags, or memory occurrence date.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-sm bg-[#FF684D]/10 border border-[#FF684D]/40 text-[#191A2B] dark:text-[#F7F3EC] flex items-start gap-3"
              >
                <span className="text-[#FF684D] mt-0.5 shrink-0">
                  <AlertCircleIcon size={18} />
                </span>
                <div className="text-xs font-sans leading-relaxed">
                  <strong className="font-semibold block text-[#FF684D]">Update Error</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title & Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Input
                    id="edit-title"
                    label="Memory Title"
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
                    htmlFor="edit-date"
                    className="block font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7] font-semibold mb-1.5"
                  >
                    Memory Date
                  </label>
                  <input
                    id="edit-date"
                    type="date"
                    value={memoryDate}
                    onChange={(e) => setMemoryDate(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full bg-[#EFE9DE] dark:bg-[#161726] border border-[#191A2B]/15 dark:border-white/10 rounded-sm px-3.5 py-2 font-mono text-sm text-[#191A2B] dark:text-[#F7F3EC] focus:outline-none focus:ring-1 focus:ring-[#FF684D]"
                  />
                </div>
              </div>

              {/* Written Content */}
              <div>
                <Textarea
                  id="edit-content"
                  label="Reflection & Written Chronicle"
                  rows={12}
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
                  htmlFor="edit-tag-input"
                  className="block font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7] font-semibold mb-2"
                >
                  Semantic Tags (Press Enter or Comma to add)
                </label>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    id="edit-tag-input"
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

              {/* Submit Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-[#191A2B]/10 dark:border-white/10">
                <Link href={`/memories/${memoryId}`}>
                  <Button variant="ghost" size="md" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>

                <Button
                  type="submit"
                  variant="coral"
                  size="lg"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  icon={<CheckIcon size={16} />}
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Updates'}
                </Button>
              </div>
            </form>
          </div>
        </Container>
      </div>
    </AppShell>
  );
}

export default function EditMemoryPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F3EC] dark:bg-[#191A2B] flex flex-col justify-center items-center">
          <div className="w-10 h-10 border-4 border-[#FF684D] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <EditMemoryContent params={params} />
    </React.Suspense>
  );
}
