'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { aiApi } from '@/lib/api/ai';
import { MemoryBoardData } from '@/types/ai';
import { PinboardView } from '@/components/board/PinboardView';
import { AiConnectionBadge } from '@/components/ai/AiConnectionBadge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import {
  CheckIcon,
  CloseIcon,
  FeatherIcon,
  LayoutGridIcon,
  LockIcon,
  RefreshIcon,
  SparklesIcon,
  TrashIcon,
} from '@/components/icons/Icons';

export default function AiBoardPage() {
  const toast = useToast();

  const [savedBoards, setSavedBoards] = useState<MemoryBoardData[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [draftBoard, setDraftBoard] = useState<MemoryBoardData | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusPrompt, setFocusPrompt] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadSavedBoards() {
      try {
        setIsLoading(true);
        setError(null);
        const boards = await aiApi.getBoards();
        if (isMounted) {
          setSavedBoards(boards);
          if (boards.length > 0) {
            setSelectedSavedId(boards[0]._id);
            if (boards[0].focusPrompt) {
              setFocusPrompt(boards[0].focusPrompt);
            }
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Could not load your saved AI boards.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSavedBoards();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedSavedBoard =
    savedBoards.find((b) => b._id === selectedSavedId) ?? savedBoards[0] ?? null;
  const activeBoard = draftBoard ?? selectedSavedBoard;

  const handleGenerateDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const preview = await aiApi.generateBoardDraft(focusPrompt);
      setDraftBoard(preview);
      setDraftTitle(preview.boardTitle);
      toast.info(
        'Board Preview Ready',
        'Review the arrangement below and click Save Board if you want to keep it.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to arrange your AI pinboard.';
      setError(msg);
      toast.error('Board Arrangement Failed', msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async (replaceId?: string) => {
    if (!draftBoard) return;
    setIsSaving(true);
    setError(null);

    try {
      const saved = await aiApi.saveBoard(draftBoard, {
        boardTitle: draftTitle.trim() || draftBoard.boardTitle,
        boardId: replaceId,
      });

      setSavedBoards((prev) => {
        if (replaceId) {
          return prev.map((b) => (b._id === replaceId ? saved : b));
        }
        return [saved, ...prev];
      });
      setSelectedSavedId(saved._id);
      setDraftBoard(null);
      setDraftTitle('');
      toast.success(
        replaceId ? 'Board Updated' : 'Board Saved',
        `"${saved.boardTitle}" is saved to your vault.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save this board.';
      setError(msg);
      toast.error('Save Failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardDraft = () => {
    setDraftBoard(null);
    setDraftTitle('');
  };

  const handleSelectSavedBoard = (board: MemoryBoardData) => {
    setDraftBoard(null);
    setDraftTitle('');
    setSelectedSavedId(board._id);
    setFocusPrompt(board.focusPrompt || '');
  };

  const handleDeleteSavedBoard = async (board: MemoryBoardData, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(board._id);
    try {
      await aiApi.deleteBoard(board._id);
      setSavedBoards((prev) => {
        const next = prev.filter((b) => b._id !== board._id);
        if (selectedSavedId === board._id) {
          setSelectedSavedId(next[0]?._id ?? null);
        }
        return next;
      });
      toast.success('Board Deleted', `"${board.boardTitle}" was removed.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete saved board.';
      toast.error('Delete Failed', msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell>
      <div className="py-8 md:py-12">
        <Container size="wide">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-semibold bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] border border-[var(--electric-coral)]/20">
                <LayoutGridIcon size={14} />
                <span>AI Memory Pinboard</span>
              </div>
              <h1 className="font-editorial text-4xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">
                The Curated Bulletin Board
              </h1>
              <p className="text-sm md:text-base text-[var(--ink-muted)] leading-relaxed">
                Let ECHOES organize your memories, photos, and capsules into themed boards. Preview
                any arrangement first, then save the boards you want to keep.
              </p>
            </div>
            <AiConnectionBadge className="self-start lg:self-end shrink-0" />
          </div>

          {/* Saved Boards Switcher */}
          {!isLoading && savedBoards.length > 0 && (
            <div className="mb-6 space-y-2">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Saved Boards ({savedBoards.length})
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {savedBoards.map((board) => {
                  const isActive = !draftBoard && selectedSavedBoard?._id === board._id;
                  return (
                    <div
                      key={board._id}
                      onClick={() => handleSelectSavedBoard(board)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectSavedBoard(board);
                        }
                      }}
                      className={`group inline-flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full border font-mono text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-[#191A2B] text-[#F7F3EC] dark:bg-white dark:text-[#191A2B] border-transparent shadow-sm font-semibold'
                          : 'border-black/10 dark:border-white/10 bg-[var(--surface-color)] text-[var(--foreground)] hover:border-[var(--electric-coral)]/40'
                      }`}
                    >
                      <span className="truncate max-w-[200px]">{board.boardTitle}</span>
                      <span className="opacity-65 text-[10px]">({board.pins.length})</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedBoard(board, e)}
                        disabled={deletingId === board._id}
                        aria-label={`Delete saved board ${board.boardTitle}`}
                        className={`p-1 rounded-full transition-colors ${
                          isActive
                            ? 'hover:bg-white/20 dark:hover:bg-black/15'
                            : 'text-[var(--ink-muted)] hover:text-rose-500 hover:bg-rose-500/10'
                        }`}
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Curator Focus & Generate Preview Controls */}
          <form
            onSubmit={handleGenerateDraft}
            className="rounded-2xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] p-4 md:p-6 neu-raised mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3"
          >
            <div className="flex-1">
              <label htmlFor="board-focus-prompt" className="sr-only">
                Optional curation focus
              </label>
              <input
                id="board-focus-prompt"
                type="text"
                value={focusPrompt}
                onChange={(e) => setFocusPrompt(e.target.value)}
                maxLength={200}
                placeholder='Topic or focus (e.g. "lady", "poop", "Group by mood", or leave blank for full vault)'
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-sm text-[var(--foreground)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--electric-coral)]/40"
              />
            </div>

            <Button
              type="submit"
              variant="coral"
              size="md"
              disabled={isGenerating || isLoading}
              className="gap-2 shrink-0"
            >
              {activeBoard ? <RefreshIcon size={15} /> : <SparklesIcon size={15} />}
              <span>
                {isGenerating
                  ? 'Arranging Preview...'
                  : activeBoard
                    ? 'Generate New Preview'
                    : 'Arrange Board with AI'}
              </span>
            </Button>
          </form>

          {/* Unsaved Draft Confirmation Bar ("Ask before saving") */}
          {draftBoard && (
            <div className="rounded-2xl border-2 border-[var(--electric-coral)]/50 bg-[var(--electric-coral)]/8 p-4 md:p-5 mb-8 space-y-3 animate-fadeIn">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--electric-coral)]">
                    Unsaved Preview · Save this board to your vault?
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Your existing saved boards are untouched until you choose to save or replace.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    maxLength={140}
                    aria-label="Board title to save"
                    placeholder="Name this board..."
                    className="px-3.5 py-2 rounded-xl border border-black/15 dark:border-white/15 bg-[var(--surface-color)] text-sm font-medium text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--electric-coral)]/40 min-w-[200px]"
                  />

                  <Button
                    type="button"
                    variant="coral"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => handleSaveDraft()}
                    className="gap-1.5 shrink-0"
                  >
                    <CheckIcon size={14} />
                    <span>{isSaving ? 'Saving...' : 'Save as New Board'}</span>
                  </Button>

                  {selectedSavedBoard && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => handleSaveDraft(selectedSavedBoard._id)}
                      className="gap-1.5 shrink-0"
                    >
                      <span>Replace &ldquo;{selectedSavedBoard.boardTitle.slice(0, 20)}&rdquo;</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleDiscardDraft}
                    className="gap-1 shrink-0"
                  >
                    <CloseIcon size={13} />
                    <span>Discard</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 mb-8 text-center space-y-2">
              <p className="font-mono text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-semibold">
                {error}
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !activeBoard && (
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] p-10 md:p-14 text-center neu-raised space-y-5 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] flex items-center justify-center mx-auto">
                <SparklesIcon size={30} />
              </div>
              <h2 className="font-editorial text-2xl md:text-3xl font-bold text-[var(--foreground)]">
                Your Pinboard Is Ready to Curate
              </h2>
              <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                Click <strong>Arrange Board with AI</strong> above to generate a preview of your
                memories, photos, and capsules, then save as many themed boards as you like.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="coral"
                  size="sm"
                  onClick={() => handleGenerateDraft()}
                  disabled={isGenerating}
                  className="gap-1.5"
                >
                  <SparklesIcon size={14} />
                  <span>{isGenerating ? 'Arranging...' : 'Arrange My Vault Now'}</span>
                </Button>
                <Link href="/memories/new">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <FeatherIcon size={14} />
                    <span>New Memory</span>
                  </Button>
                </Link>
                <Link href="/capsules/new">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <LockIcon size={14} />
                    <span>Seal Capsule</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Hydrated Clustered Pinboard */}
          {!isLoading && activeBoard && <PinboardView board={activeBoard} />}
        </Container>
      </div>
    </AppShell>
  );
}
