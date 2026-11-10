'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { aiApi } from '@/lib/api/ai';
import { AiStatusData } from '@/types/ai';
import { RefreshIcon } from '@/components/icons/Icons';

interface AiConnectionBadgeProps {
  className?: string;
}

export function AiConnectionBadge({ className = '' }: AiConnectionBadgeProps) {
  const [status, setStatus] = useState<AiStatusData | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const handleRecheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const data = await aiApi.getStatus();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialStatus() {
      try {
        const data = await aiApi.getStatus();
        if (isMounted) {
          setStatus(data);
        }
      } catch {
        if (isMounted) {
          setStatus(null);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    }

    loadInitialStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking && !status) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] font-mono text-[11px] text-[var(--ink-muted)] ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>Checking LLM...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const isHealthy = status.connected && status.modelAvailable;
  const isPartial = status.connected && !status.modelAvailable;

  const dotClass = isHealthy
    ? 'bg-emerald-500'
    : isPartial || !status.configured
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const pillClass = isHealthy
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : isPartial || !status.configured
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      : 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300';

  const label = isHealthy
    ? `${status.providerType === 'local' ? 'Local LLM' : 'AI'} Connected · ${status.model}`
    : isPartial
      ? `Connected · Missing "${status.model}"`
      : !status.configured
        ? 'Heuristic Mode (No LLM Set)'
        : `${status.providerType === 'local' ? 'Local LLM' : 'AI'} Offline · Fallback Active`;

  return (
    <div
      title={status.message}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-[11px] font-medium ${pillClass} ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {isHealthy && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClass}`} />
      </span>
      <span className="truncate max-w-[260px]">{label}</span>
      {status.latencyMs !== null && isHealthy && (
        <span className="opacity-70 hidden sm:inline">({status.latencyMs}ms)</span>
      )}
      <button
        type="button"
        onClick={handleRecheck}
        disabled={isChecking}
        aria-label="Recheck LLM connection status"
        className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        <RefreshIcon size={11} className={isChecking ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
