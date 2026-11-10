import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { TimeCapsule } from '@/models/TimeCapsule';
import { Memory } from '@/models/Memory';
import { isValidObjectId } from '@/lib/media/cloudinary';
import { checkRateLimit } from '@/lib/security/rate-limit';
import {
  CapsuleInsightMemoryContext,
  generateCapsuleThenVsNowInsight,
} from '@/lib/ai/services';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

/**
 * POST /api/ai/capsules/:id/insight
 * Generates a "Then vs. Now" AI reflection comparing an unlocked Time Capsule letter
 * against the user's recent journal memories.
 * Strictly enforces ownership (404) and temporal lock (403 if locked).
 */
export async function POST(request: Request, context: RouteContext) {
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

    const rate = checkRateLimit(auth.user._id.toString(), 'ai-capsule-insight', 15, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please wait ${rate.retryAfterSeconds}s before trying again.`,
        },
        { status: 429 }
      );
    }

    const { id } = await Promise.resolve(context.params);
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time capsule ID format.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const capsule = await TimeCapsule.findOne({
      _id: id,
      userId: auth.user._id,
    });

    if (!capsule) {
      return NextResponse.json(
        { success: false, error: 'Time capsule not found or access denied.' },
        { status: 404 }
      );
    }

    // Strict server-side temporal lock check
    const now = new Date();
    if (capsule.isLocked(now)) {
      return NextResponse.json(
        {
          success: false,
          error: `Time capsule is sealed and locked until ${capsule.unlockDate.toISOString()}. AI insight is unavailable before unsealing.`,
          unlockDate: capsule.unlockDate,
          isLocked: true,
        },
        { status: 403 }
      );
    }

    // Retrieve recent memories for "Now" comparison context (RAG context)
    const recentMemoryDocs = await Memory.find({ userId: auth.user._id })
      .sort({ memoryDate: -1, _id: -1 })
      .limit(10)
      .exec();

    const recentMemories: CapsuleInsightMemoryContext[] = recentMemoryDocs.map((m) => ({
      id: m._id.toString(),
      title: m.title,
      date: m.memoryDate.toISOString(),
      content: m.content,
      tags: Array.isArray(m.tags) ? m.tags : [],
    }));

    const result = await generateCapsuleThenVsNowInsight({
      capsule: {
        title: capsule.title,
        message: capsule.message,
        sealedAt: capsule.sealedAt.toISOString(),
        unlockDate: capsule.unlockDate.toISOString(),
      },
      recentMemories,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          capsuleId: capsule._id.toString(),
          comparedMemoriesCount: recentMemories.length,
          mode: result.mode,
          model: result.model,
          warning: result.warning,
          ...result.data,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[AI Capsule Insight POST] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate capsule reflection insight.' },
      { status: 500 }
    );
  }
}

