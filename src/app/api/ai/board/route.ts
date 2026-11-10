import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { MemoryBoard } from '@/models/MemoryBoard';
import { isValidObjectId } from '@/lib/media/cloudinary';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { boardGenerateRequestSchema, boardSaveRequestSchema } from '@/validations/ai';
import { generateMemoryBoardLayout } from '@/lib/ai/services';
import {
  hydrateBoardDocument,
  hydrateBoardLayoutDraft,
  loadBoardSourceContext,
} from '@/lib/ai/board-hydration';

let checkedLegacyUniqueIndex = false;

/**
 * Drops the legacy unique index on `userId` (`userId_1`) if an older database already
 * created it before multi-board support was added.
 */
async function ensureMultiBoardIndex(): Promise<void> {
  if (checkedLegacyUniqueIndex) return;
  try {
    const indexes = await MemoryBoard.collection.indexes();
    const legacyUnique = indexes.find(
      (idx) => idx.name === 'userId_1' && Boolean(idx.unique)
    );
    if (legacyUnique) {
      await MemoryBoard.collection.dropIndex('userId_1');
      await MemoryBoard.syncIndexes();
    }
    checkedLegacyUniqueIndex = true;
  } catch {
    // Collection may not exist yet; Mongoose will create non-unique indexes on first insert
    checkedLegacyUniqueIndex = true;
  }
}

/**
 * GET /api/ai/board
 * Loads all saved AI bulletin pinboards for the authenticated user (newest first),
 * hydrated with live entries and fresh signed Cloudinary URLs.
 */
export async function GET(request: Request) {
  try {
    try {
      await headers();
    } catch {
      // Test environment fallback
    }

    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectToDatabase();

    const boards = await MemoryBoard.find({ userId: auth.user._id })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(25)
      .exec();

    if (boards.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            boards: [],
          },
        },
        { status: 200 }
      );
    }

    const { liveItemMap } = await loadBoardSourceContext(auth.user._id);
    const hydratedBoards = boards.map((board) => hydrateBoardDocument(board, liveItemMap));

    return NextResponse.json(
      {
        success: true,
        data: {
          boards: hydratedBoards,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      typeof (error as { digest: unknown }).digest === 'string' &&
      ((error as { digest: string }).digest.startsWith('NEXT_PRERENDER_INTERRUPTED') ||
        (error as { digest: string }).digest.startsWith('DYNAMIC_SERVER_USAGE'))
    ) {
      throw error;
    }
    console.error('[AI Board GET] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load AI pinboards.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/board
 * Generates an UNSAVED AI bulletin pinboard draft preview from the user's memories,
 * photos, and capsules. Does not overwrite or persist until the user explicitly saves via PUT.
 */
export async function POST(request: Request) {
  try {
    try {
      await headers();
    } catch {
      // Test environment fallback
    }

    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const rate = checkRateLimit(auth.user._id.toString(), 'ai-board-generate', 12, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please wait ${rate.retryAfterSeconds}s before generating another board.`,
        },
        { status: 429 }
      );
    }

    let body: unknown = {};
    try {
      const rawText = await request.text();
      if (rawText.trim()) {
        body = JSON.parse(rawText);
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const parsed = boardGenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Validation failed.',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { sourceItems, liveItemMap } = await loadBoardSourceContext(auth.user._id);

    if (sourceItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Your vault has no memories or capsules yet. Create at least one entry before arranging your AI board.',
        },
        { status: 400 }
      );
    }

    const focusPrompt = parsed.data.focusPrompt?.trim() || undefined;
    const result = await generateMemoryBoardLayout({
      items: sourceItems,
      focusPrompt,
    });

    const hydratedDraft = hydrateBoardLayoutDraft(
      {
        boardTitle: result.data.boardTitle,
        curatorNote: result.data.curatorNote,
        focusPrompt,
        generationMode: result.mode,
        modelName: result.model,
        clusters: result.data.clusters,
        pins: result.data.pins,
        connections: result.data.connections,
      },
      liveItemMap
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          ...hydratedDraft,
          warning: result.warning,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[AI Board POST] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate AI pinboard preview.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ai/board
 * Explicitly saves a generated AI board to MongoDB (creates a new saved board, or replaces
 * an owned existing board when `boardId` is provided).
 */
export async function PUT(request: Request) {
  try {
    try {
      await headers();
    } catch {
      // Test environment fallback
    }

    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const parsed = boardSaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Validation failed.',
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    await connectToDatabase();
    await ensureMultiBoardIndex();

    const { liveItemMap } = await loadBoardSourceContext(auth.user._id);

    // Filter out any pins whose underlying item doesn't belong to this user
    const safePins = payload.pins.filter((p) => liveItemMap.has(p.itemId));
    const safePinIds = new Set(safePins.map((p) => p.itemId));
    const safeConnections = payload.connections.filter(
      (c) => safePinIds.has(c.fromItemId) && safePinIds.has(c.toItemId)
    );

    let savedBoard;
    if (payload.boardId) {
      if (!isValidObjectId(payload.boardId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid board ID format.' },
          { status: 400 }
        );
      }

      savedBoard = await MemoryBoard.findOneAndUpdate(
        { _id: payload.boardId, userId: auth.user._id },
        {
          $set: {
            boardTitle: payload.boardTitle,
            curatorNote: payload.curatorNote,
            focusPrompt: payload.focusPrompt,
            generationMode: payload.generationMode,
            modelName: payload.modelName,
            clusters: payload.clusters,
            pins: safePins,
            connections: safeConnections,
            generatedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      ).exec();

      if (!savedBoard) {
        return NextResponse.json(
          { success: false, error: 'Saved board not found or access denied.' },
          { status: 404 }
        );
      }
    } else {
      savedBoard = await MemoryBoard.create({
        userId: auth.user._id,
        boardTitle: payload.boardTitle,
        curatorNote: payload.curatorNote,
        focusPrompt: payload.focusPrompt,
        generationMode: payload.generationMode,
        modelName: payload.modelName,
        clusters: payload.clusters,
        pins: safePins,
        connections: safeConnections,
        generatedAt: new Date(),
      });
    }

    const hydrated = hydrateBoardDocument(savedBoard, liveItemMap);

    return NextResponse.json(
      {
        success: true,
        data: hydrated,
      },
      { status: payload.boardId ? 200 : 201 }
    );
  } catch (error) {
    console.error('[AI Board PUT] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save AI pinboard.' },
      { status: 500 }
    );
  }
}
