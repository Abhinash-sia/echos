'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BoardClusterColor,
  BoardConnection,
  HydratedBoardPin,
  MemoryBoardData,
} from '@/types/ai';
import {
  CalendarIcon,
  CameraIcon,
  FeatherIcon,
  LinkIcon,
  LockIcon,
  SparklesIcon,
  UnlockIcon,
  ArrowRightIcon,
} from '@/components/icons/Icons';

interface PinboardViewProps {
  board: MemoryBoardData;
}

const CLUSTER_STYLE_MAP: Record<
  BoardClusterColor,
  {
    badge: string;
    border: string;
    dot: string;
    wash: string;
  }
> = {
  coral: {
    badge: 'bg-[#FF684D]/12 text-[#FF684D] border-[#FF684D]/30',
    border: 'border-[#FF684D]/30',
    dot: 'bg-[#FF684D]',
    wash: 'from-[#FF684D]/8 to-transparent',
  },
  teal: {
    badge: 'bg-[#1EA896]/12 text-[#1EA896] border-[#1EA896]/30',
    border: 'border-[#1EA896]/30',
    dot: 'bg-[#1EA896]',
    wash: 'from-[#1EA896]/8 to-transparent',
  },
  cobalt: {
    badge: 'bg-[#4F66E8]/12 text-[#4F66E8] border-[#4F66E8]/30',
    border: 'border-[#4F66E8]/30',
    dot: 'bg-[#4F66E8]',
    wash: 'from-[#4F66E8]/8 to-transparent',
  },
  yellow: {
    badge: 'bg-[#E5A93B]/15 text-[#B47B14] dark:text-[#F5C451] border-[#E5A93B]/35',
    border: 'border-[#E5A93B]/35',
    dot: 'bg-[#E5A93B]',
    wash: 'from-[#E5A93B]/10 to-transparent',
  },
  pink: {
    badge: 'bg-[#EC5B96]/12 text-[#EC5B96] border-[#EC5B96]/30',
    border: 'border-[#EC5B96]/30',
    dot: 'bg-[#EC5B96]',
    wash: 'from-[#EC5B96]/8 to-transparent',
  },
};

export function PinboardView({ board }: PinboardViewProps) {
  const [activeClusterId, setActiveClusterId] = useState<string>('all');
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const pinById = useMemo(() => {
    const map = new Map<string, HydratedBoardPin>();
    for (const pin of board.pins) {
      map.set(pin.itemId, pin);
    }
    return map;
  }, [board.pins]);

  const connectionsByPinId = useMemo(() => {
    const map = new Map<
      string,
      Array<{ otherPin: HydratedBoardPin; connection: BoardConnection }>
    >();
    for (const conn of board.connections) {
      const fromPin = pinById.get(conn.fromItemId);
      const toPin = pinById.get(conn.toItemId);
      if (!fromPin || !toPin) continue;

      if (!map.has(conn.fromItemId)) map.set(conn.fromItemId, []);
      if (!map.has(conn.toItemId)) map.set(conn.toItemId, []);

      map.get(conn.fromItemId)!.push({ otherPin: toPin, connection: conn });
      map.get(conn.toItemId)!.push({ otherPin: fromPin, connection: conn });
    }
    return map;
  }, [board.connections, pinById]);

  const highlightedNeighborIds = useMemo(() => {
    const set = new Set<string>();
    if (!selectedPinId) return set;
    const links = connectionsByPinId.get(selectedPinId) || [];
    for (const l of links) {
      set.add(l.otherPin.itemId);
    }
    return set;
  }, [selectedPinId, connectionsByPinId]);

  const visibleClusters = useMemo(() => {
    if (activeClusterId === 'all') return board.clusters;
    return board.clusters.filter((c) => c.id === activeClusterId);
  }, [board.clusters, activeClusterId]);

  return (
    <div className="space-y-8">
      {/* Board Header Banner & Curator Note */}
      <div className="rounded-3xl border-2 border-[#191A2B]/15 dark:border-white/15 bg-[var(--surface-color)] p-6 md:p-8 neu-raised space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] border border-[var(--electric-coral)]/25">
                <SparklesIcon size={12} />
                <span>
                  {board.generationMode === 'ai'
                    ? `Curated by ${board.modelName}`
                    : 'Local Smart Pinboard'}
                </span>
              </span>
              <span className="font-mono text-xs text-[var(--ink-muted)]">
                {board.pins.length} pinned item{board.pins.length === 1 ? '' : 's'} ·{' '}
                {board.clusters.length} cluster{board.clusters.length === 1 ? '' : 's'} ·{' '}
                {board.connections.length} connection{board.connections.length === 1 ? '' : 's'}
              </span>
            </div>

            <h2 className="font-editorial text-2xl md:text-3xl font-bold text-[var(--foreground)]">
              {board.boardTitle}
            </h2>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed">{board.curatorNote}</p>
          </div>

          <div className="font-mono text-[11px] text-[var(--ink-muted)] shrink-0">
            Arranged{' '}
            {new Date(board.generatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>

        {board.warning && (
          <p className="font-mono text-[11px] text-[var(--ink-muted)] bg-black/5 dark:bg-white/5 px-3 py-2 rounded-xl">
            {board.warning}
          </p>
        )}

        {/* Cluster Filter Pills */}
        {board.clusters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setActiveClusterId('all')}
              className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-semibold border transition-all ${
                activeClusterId === 'all'
                  ? 'bg-[#191A2B] text-[#F7F3EC] dark:bg-white dark:text-[#191A2B] border-transparent shadow-sm'
                  : 'border-black/10 dark:border-white/10 text-[var(--ink-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              All Clusters ({board.pins.length} pins)
            </button>

            {board.clusters.map((cluster) => {
              const count = board.pins.filter((p) => p.clusterId === cluster.id).length;
              const style = CLUSTER_STYLE_MAP[cluster.color] || CLUSTER_STYLE_MAP.coral;
              const isActive = activeClusterId === cluster.id;
              return (
                <button
                  key={cluster.id}
                  type="button"
                  onClick={() => setActiveClusterId(cluster.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-semibold border transition-all ${
                    isActive
                      ? `${style.badge} ring-2 ring-offset-1 ring-current`
                      : 'border-black/10 dark:border-white/10 text-[var(--ink-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span>
                    {cluster.label} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty Focus Match State */}
      {board.pins.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-black/15 dark:border-white/15 bg-[var(--surface-color)] p-10 text-center space-y-2">
          <p className="font-editorial text-xl font-bold text-[var(--foreground)]">
            No matching memories or capsules pinned
          </p>
          <p className="font-mono text-xs text-[var(--ink-muted)]">
            Clear the focus prompt above and click Regenerate Board to view your full vault, or
            try another keyword.
          </p>
        </div>
      )}

      {/* Selected Pin Connection Inspector Banner */}
      {selectedPinId && pinById.get(selectedPinId) && (
        <div className="rounded-2xl border-2 border-[var(--electric-coral)]/40 bg-[var(--surface-color)] p-5 neu-raised space-y-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--electric-coral)] uppercase tracking-wider">
              <LinkIcon size={14} />
              <span>
                Red-String Connections for &ldquo;{pinById.get(selectedPinId)!.title}&rdquo;
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPinId(null)}
              className="font-mono text-xs text-[var(--ink-muted)] hover:text-[var(--foreground)] underline"
            >
              Clear Focus
            </button>
          </div>

          {(connectionsByPinId.get(selectedPinId) || []).length === 0 ? (
            <p className="text-xs font-mono text-[var(--ink-muted)]">
              No cross-pin threads attached to this card. Select another pin with a link badge to
              trace connections.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(connectionsByPinId.get(selectedPinId) || []).map(({ otherPin, connection }, i) => (
                <div
                  key={`${otherPin.itemId}-${i}`}
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-3 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {otherPin.title}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--electric-coral)]">
                      {connection.reason}
                    </div>
                  </div>
                  <Link
                    href={
                      otherPin.itemType === 'memory'
                        ? `/memories/${otherPin.itemId}`
                        : `/capsules/${otherPin.itemId}`
                    }
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold bg-black/5 dark:bg-white/10 hover:bg-[var(--electric-coral)] hover:text-white transition-colors"
                  >
                    <span>Open</span>
                    <ArrowRightIcon size={11} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Corkboard / Drafting Grid Clusters */}
      {board.pins.length > 0 && (
        <div
          className="rounded-3xl border-2 border-[#191A2B]/15 dark:border-white/15 p-5 sm:p-8 space-y-10"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(120, 120, 140, 0.22) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        >
          {visibleClusters.map((cluster) => {
          const clusterPins = board.pins.filter((p) => p.clusterId === cluster.id);
          const style = CLUSTER_STYLE_MAP[cluster.color] || CLUSTER_STYLE_MAP.coral;

          if (clusterPins.length === 0) return null;

          return (
            <section
              key={cluster.id}
              className={`rounded-3xl border ${style.border} bg-gradient-to-br ${style.wash} bg-[var(--surface-color)]/85 backdrop-blur-xs p-5 md:p-7 space-y-6`}
            >
              {/* Cluster Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-black/10 dark:border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${style.dot} shadow-sm`} />
                    <h3 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                      {cluster.label}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${style.badge}`}
                    >
                      {clusterPins.length} {clusterPins.length === 1 ? 'pin' : 'pins'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--ink-muted)]">{cluster.summary}</p>
                </div>
              </div>

              {/* Bento Pinned Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                {clusterPins.map((pin) => {
                  const links = connectionsByPinId.get(pin.itemId) || [];
                  const isSelected = selectedPinId === pin.itemId;
                  const isNeighbor = highlightedNeighborIds.has(pin.itemId);
                  const primaryPhoto = pin.photos[0];
                  const href =
                    pin.itemType === 'memory'
                      ? `/memories/${pin.itemId}`
                      : `/capsules/${pin.itemId}`;

                  const formattedDate = new Date(pin.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  const cardBg =
                    pin.pinStyle === 'sticky'
                      ? 'bg-[#FFF5CC] dark:bg-[#2E2A1B] border-[#E5A93B]/40'
                      : pin.pinStyle === 'wax-seal'
                        ? 'bg-[var(--surface-color)] border-[var(--cobalt-blue)]/30'
                        : 'bg-white dark:bg-[#1E2035] border-[#191A2B]/15 dark:border-white/15';

                  return (
                    <article
                      key={pin.itemId}
                      style={{ transform: `rotate(${pin.rotation}deg)` }}
                      className={`group relative rounded-2xl border-2 ${cardBg} p-4 pt-6 shadow-md hover:rotate-0! hover:-translate-y-1 hover:shadow-xl transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-[var(--electric-coral)] border-[var(--electric-coral)]!'
                          : isNeighbor
                            ? 'ring-2 ring-[var(--vibrant-teal)] border-[var(--vibrant-teal)]!'
                            : ''
                      }`}
                    >
                      {/* Tactile Pushpin Tack */}
                      <div
                        aria-hidden="true"
                        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full ${style.dot} border-2 border-white dark:border-[#191A2B] shadow-md`}
                      />

                      {/* Polaroid Photo Frame (if photos attached and unlocked) */}
                      {primaryPhoto && !pin.isLocked && (
                        <Link
                          href={href}
                          className="block relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-black/10 dark:border-white/10 mb-3 bg-black/5"
                        >
                          <Image
                            src={primaryPhoto.signedUrl || primaryPhoto.url}
                            alt={pin.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          {pin.photos.length > 1 && (
                            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 text-white font-mono text-[10px]">
                              <CameraIcon size={11} />
                              <span>+{pin.photos.length - 1}</span>
                            </span>
                          )}
                        </Link>
                      )}

                      {/* Type & Date Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                            pin.itemType === 'capsule'
                              ? pin.isLocked
                                ? 'bg-[var(--cobalt-blue)]/10 text-[var(--cobalt-blue)]'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-[var(--vibrant-teal)]/10 text-[var(--vibrant-teal)]'
                          }`}
                        >
                          {pin.itemType === 'capsule' ? (
                            pin.isLocked ? (
                              <>
                                <LockIcon size={10} />
                                <span>Sealed Capsule</span>
                              </>
                            ) : (
                              <>
                                <UnlockIcon size={10} />
                                <span>Time Capsule</span>
                              </>
                            )
                          ) : (
                            <>
                              <FeatherIcon size={10} />
                              <span>Memory</span>
                            </>
                          )}
                        </span>

                        <span className="font-mono text-[11px] text-[var(--ink-muted)] flex items-center gap-1">
                          <CalendarIcon size={11} />
                          {formattedDate}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-editorial text-lg font-bold text-[var(--foreground)] leading-snug mb-1.5">
                        <Link href={href} className="hover:text-[var(--electric-coral)] transition-colors">
                          {pin.title}
                        </Link>
                      </h4>

                      {/* Excerpt */}
                      <p className="text-xs text-[var(--ink-muted)] line-clamp-3 leading-relaxed mb-3">
                        {pin.excerpt}
                      </p>

                      {/* AI Sticky Note Annotation */}
                      <div className="rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-dashed border-black/15 dark:border-white/15 px-3 py-2 mb-3">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--electric-coral)] mb-0.5">
                          AI Curator Note
                        </div>
                        <p className="text-xs text-[var(--foreground)]/90 leading-snug">
                          {pin.stickyNote}
                        </p>
                      </div>

                      {/* Footer: Tags + Red-String Thread Button + Open Link */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                        <div className="flex flex-wrap items-center gap-1">
                          {pin.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-black/5 dark:bg-white/10 text-[var(--ink-muted)]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          {links.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPinId((prev) =>
                                  prev === pin.itemId ? null : pin.itemId
                                )
                              }
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-mono text-[10px] font-semibold transition-colors ${
                                isSelected
                                  ? 'bg-[var(--electric-coral)] text-white'
                                  : 'bg-[var(--electric-coral)]/10 text-[var(--electric-coral)] hover:bg-[var(--electric-coral)]/20'
                              }`}
                            >
                              <LinkIcon size={10} />
                              <span>
                                {links.length} link{links.length > 1 ? 's' : ''}
                              </span>
                            </button>
                          )}

                          <Link
                            href={href}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[var(--foreground)] hover:text-[var(--electric-coral)] transition-colors"
                          >
                            <span>View</span>
                            <ArrowRightIcon size={11} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
        </div>
      )}

      {/* Full Red-String Threads Directory */}
      {board.connections.length > 0 && (
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--surface-color)] p-6 neu-raised space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
            <LinkIcon size={14} className="text-[var(--electric-coral)]" />
            <span>Discovered Cross-Memory Threads ({board.connections.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {board.connections.map((conn, idx) => {
              const from = pinById.get(conn.fromItemId);
              const to = pinById.get(conn.toItemId);
              if (!from || !to) return null;

              return (
                <button
                  type="button"
                  key={`${conn.fromItemId}-${conn.toItemId}-${idx}`}
                  onClick={() => setSelectedPinId(from.itemId)}
                  className="text-left rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:border-[var(--electric-coral)]/40 p-4 transition-all space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] flex-wrap">
                    <span className="truncate max-w-[180px]">{from.title}</span>
                    <span className="text-[var(--electric-coral)] font-mono">↔</span>
                    <span className="truncate max-w-[180px]">{to.title}</span>
                  </div>
                  <p className="font-mono text-[11px] text-[var(--ink-muted)]">{conn.reason}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

