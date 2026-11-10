import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import mongoose from 'mongoose';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { Memory } from '@/models/Memory';
import { TimeCapsule } from '@/models/TimeCapsule';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { timelineSummaryRequestSchema } from '@/validations/ai';
import {
  generateTimelineChapterSummary,
  TimelineSummarySourceItem,
} from '@/lib/ai/services';

/**
 * POST /api/ai/timeline-summary
 * Summarizes a selected group of timeline entries (e.g. a Month/Year chapter)
 * owned by the authenticated user. Strictly omits locked capsule contents.
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

    const rate = checkRateLimit(auth.user._id.toString(), 'ai-timeline-summary', 20, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please wait ${rate.retryAfterSeconds}s before requesting another summary.`,
        },
        { status: 429 }
      );
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

    const parsed = timelineSummaryRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Validation failed.',
          details: parsed.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { periodLabel, items: requestedItems } = parsed.data;

    const memoryObjectIds = requestedItems
      .filter((i) => i.type === 'memory' && mongoose.Types.ObjectId.isValid(i.id))
      .map((i) => new mongoose.Types.ObjectId(i.id));

    const capsuleObjectIds = requestedItems
      .filter((i) => i.type === 'capsule' && mongoose.Types.ObjectId.isValid(i.id))
      .map((i) => new mongoose.Types.ObjectId(i.id));

    if (memoryObjectIds.length === 0 && capsuleObjectIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid entry IDs provided for summarization.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const [memories, capsules] = await Promise.all([
      memoryObjectIds.length > 0
        ? Memory.find({ _id: { $in: memoryObjectIds }, userId: auth.user._id })
            .sort({ memoryDate: 1 })
            .exec()
        : Promise.resolve([]),
      capsuleObjectIds.length > 0
        ? TimeCapsule.find({ _id: { $in: capsuleObjectIds }, userId: auth.user._id })
            .sort({ unlockDate: 1 })
            .exec()
        : Promise.resolve([]),
    ]);

    const now = new Date();
    const sourceItems: TimelineSummarySourceItem[] = [];

    for (const mem of memories) {
      sourceItems.push({
        id: mem._id.toString(),
        type: 'memory',
        title: mem.title,
        date: mem.memoryDate.toISOString(),
        text: mem.content,
        tags: Array.isArray(mem.tags) ? mem.tags : [],
        photoCount: Array.isArray(mem.photos) ? mem.photos.length : 0,
        isLocked: false,
      });
    }

    for (const cap of capsules) {
      const locked = cap.isLocked(now);
      sourceItems.push({
        id: cap._id.toString(),
        type: 'capsule',
        title: cap.title,
        date: cap.unlockDate.toISOString(),
        // Privacy invariant: never feed locked capsule message into AI
        text: locked ? '' : cap.message,
        tags: ['time-capsule'],
        photoCount: locked ? 0 : Array.isArray(cap.photos) ? cap.photos.length : 0,
        isLocked: locked,
      });
    }

    if (sourceItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching entries found in your vault.' },
        { status: 404 }
      );
    }

    const result = await generateTimelineChapterSummary({
      periodLabel,
      items: sourceItems,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          periodLabel,
          entryCount: sourceItems.length,
          mode: result.mode,
          model: result.model,
          warning: result.warning,
          ...result.data,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[AI Timeline Summary POST] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate timeline summary.' },
      { status: 500 }
    );
  }
}

