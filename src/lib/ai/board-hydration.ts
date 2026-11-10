import mongoose from 'mongoose';
import { Memory } from '@/models/Memory';
import { TimeCapsule } from '@/models/TimeCapsule';
import '@/models/Photo';
import { IMemoryBoardDocument, IBoardCluster, IBoardConnection, BoardPinStyle } from '@/models/MemoryBoard';
import { generateSignedPhotoUrl } from '@/lib/media/cloudinary';
import { BoardSourceItem } from './services';

export interface HydratedPhotoPreview {
  _id: string;
  url: string;
  signedUrl: string;
}

export interface HydratedBoardPin {
  itemId: string;
  itemType: 'memory' | 'capsule';
  clusterId: string;
  stickyNote: string;
  rotation: number;
  pinStyle: BoardPinStyle;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  isLocked: boolean;
  isOpened?: boolean;
  photos: HydratedPhotoPreview[];
}

export interface HydratedMemoryBoard {
  _id: string;
  isDraft?: boolean;
  boardTitle: string;
  curatorNote: string;
  focusPrompt?: string;
  generationMode: 'ai' | 'heuristic';
  modelName: string;
  generatedAt: string;
  clusters: IBoardCluster[];
  pins: HydratedBoardPin[];
  connections: IBoardConnection[];
}

function resolvePhotoPreviews(rawPhotos: unknown[]): HydratedPhotoPreview[] {
  const previews: HydratedPhotoPreview[] = [];
  for (const raw of rawPhotos) {
    if (!raw || typeof raw !== 'object') continue;
    const photo = raw as { _id?: unknown; publicId?: unknown; url?: unknown };
    if (typeof photo.publicId !== 'string') continue;
    previews.push({
      _id: String(photo._id || photo.publicId),
      url: typeof photo.url === 'string' ? photo.url : '',
      signedUrl: generateSignedPhotoUrl(photo.publicId),
    });
  }
  return previews;
}

/**
 * Fetches live memories & capsules owned by `userId` while strictly enforcing
 * the TimeCapsule temporal privacy invariant on locked capsules.
 */
export async function loadBoardSourceContext(userId: mongoose.Types.ObjectId): Promise<{
  sourceItems: BoardSourceItem[];
  liveItemMap: Map<string, Omit<HydratedBoardPin, 'clusterId' | 'stickyNote' | 'rotation' | 'pinStyle'>>;
}> {
  const now = new Date();

  const [memories, capsules] = await Promise.all([
    Memory.find({ userId })
      .sort({ memoryDate: -1, _id: -1 })
      .limit(36)
      .populate('photos')
      .exec(),
    TimeCapsule.find({ userId })
      .sort({ unlockDate: -1, _id: -1 })
      .limit(24)
      .populate('photos')
      .exec(),
  ]);

  const sourceItems: BoardSourceItem[] = [];
  const liveItemMap = new Map<
    string,
    Omit<HydratedBoardPin, 'clusterId' | 'stickyNote' | 'rotation' | 'pinStyle'>
  >();

  for (const mem of memories) {
    const id = mem._id.toString();
    const photos = resolvePhotoPreviews(Array.isArray(mem.photos) ? mem.photos : []);
    const dateIso = mem.memoryDate.toISOString();
    const excerpt = mem.content.slice(0, 220);

    sourceItems.push({
      itemId: id,
      itemType: 'memory',
      title: mem.title,
      date: dateIso,
      excerpt: mem.content,
      tags: Array.isArray(mem.tags) ? mem.tags : [],
      photoCount: photos.length,
      isLocked: false,
    });

    liveItemMap.set(id, {
      itemId: id,
      itemType: 'memory',
      title: mem.title,
      date: dateIso,
      excerpt,
      tags: Array.isArray(mem.tags) ? mem.tags : [],
      isLocked: false,
      photos,
    });
  }

  for (const cap of capsules) {
    const id = cap._id.toString();
    const locked = cap.isLocked(now);
    const dateIso = cap.unlockDate.toISOString();
    // Privacy invariant: never expose message or photos for locked capsules
    const photos = locked
      ? []
      : resolvePhotoPreviews(Array.isArray(cap.photos) ? cap.photos : []);
    const excerpt = locked
      ? `Sealed against time until ${cap.unlockDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}.`
      : cap.message.slice(0, 220);

    sourceItems.push({
      itemId: id,
      itemType: 'capsule',
      title: cap.title,
      date: dateIso,
      excerpt: locked ? '' : cap.message,
      tags: ['time-capsule'],
      photoCount: photos.length,
      isLocked: locked,
    });

    liveItemMap.set(id, {
      itemId: id,
      itemType: 'capsule',
      title: cap.title,
      date: dateIso,
      excerpt,
      tags: ['time-capsule'],
      isLocked: locked,
      isOpened: cap.isOpened,
      photos,
    });
  }

  return { sourceItems, liveItemMap };
}

type LiveItemMap = Map<
  string,
  Omit<HydratedBoardPin, 'clusterId' | 'stickyNote' | 'rotation' | 'pinStyle'>
>;

function hydrateBoardFields(
  input: {
    _id: string;
    isDraft?: boolean;
    boardTitle: string;
    curatorNote: string;
    focusPrompt?: string;
    generationMode: 'ai' | 'heuristic';
    modelName: string;
    generatedAt: string;
    clusters: IBoardCluster[];
    pins: Array<{
      itemId: string;
      clusterId: string;
      stickyNote: string;
      rotation: number;
      pinStyle: BoardPinStyle;
    }>;
    connections: IBoardConnection[];
  },
  liveItemMap: LiveItemMap
): HydratedMemoryBoard {
  const hydratedPins: HydratedBoardPin[] = [];
  const activeItemIds = new Set<string>();

  for (const pin of input.pins) {
    const live = liveItemMap.get(pin.itemId);
    if (!live) continue;

    activeItemIds.add(pin.itemId);
    hydratedPins.push({
      ...live,
      clusterId: pin.clusterId,
      stickyNote: live.isLocked
        ? `Sealed capsule — unlocks ${new Date(live.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}.`
        : pin.stickyNote,
      rotation: pin.rotation,
      pinStyle: live.isLocked ? 'wax-seal' : pin.pinStyle,
    });
  }

  const validConnections = input.connections.filter(
    (conn) => activeItemIds.has(conn.fromItemId) && activeItemIds.has(conn.toItemId)
  );

  const activeClusterIds = new Set(hydratedPins.map((p) => p.clusterId));
  const activeClusters = input.clusters.filter((c) => activeClusterIds.has(c.id));

  return {
    _id: input._id,
    isDraft: input.isDraft,
    boardTitle: input.boardTitle,
    curatorNote: input.curatorNote,
    focusPrompt: input.focusPrompt,
    generationMode: input.generationMode,
    modelName: input.modelName,
    generatedAt: input.generatedAt,
    clusters: activeClusters,
    pins: hydratedPins,
    connections: validConnections,
  };
}

/**
 * Combines a persisted MemoryBoard document with live database records and fresh signed URLs.
 */
export function hydrateBoardDocument(
  board: IMemoryBoardDocument,
  liveItemMap: LiveItemMap
): HydratedMemoryBoard {
  return hydrateBoardFields(
    {
      _id: board._id.toString(),
      isDraft: false,
      boardTitle: board.boardTitle,
      curatorNote: board.curatorNote,
      focusPrompt: board.focusPrompt,
      generationMode: board.generationMode,
      modelName: board.modelName,
      generatedAt: board.generatedAt.toISOString(),
      clusters: board.clusters,
      pins: board.pins,
      connections: board.connections,
    },
    liveItemMap
  );
}

/**
 * Hydrates an unsaved AI-generated draft board layout for preview before explicit saving.
 */
export function hydrateBoardLayoutDraft(
  draft: {
    boardTitle: string;
    curatorNote: string;
    focusPrompt?: string;
    generationMode: 'ai' | 'heuristic';
    modelName: string;
    clusters: IBoardCluster[];
    pins: Array<{
      itemId: string;
      clusterId: string;
      stickyNote: string;
      rotation: number;
      pinStyle: BoardPinStyle;
    }>;
    connections: IBoardConnection[];
  },
  liveItemMap: LiveItemMap
): HydratedMemoryBoard {
  return hydrateBoardFields(
    {
      _id: `draft-${Date.now()}`,
      isDraft: true,
      boardTitle: draft.boardTitle,
      curatorNote: draft.curatorNote,
      focusPrompt: draft.focusPrompt,
      generationMode: draft.generationMode,
      modelName: draft.modelName,
      generatedAt: new Date().toISOString(),
      clusters: draft.clusters,
      pins: draft.pins,
      connections: draft.connections,
    },
    liveItemMap
  );
}

