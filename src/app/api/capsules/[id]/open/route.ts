import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { TimeCapsule } from '@/models/TimeCapsule';
import { isValidObjectId, generateSignedPhotoUrl } from '@/lib/media/cloudinary';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

/**
 * POST /api/capsules/:id/open
 * Unseals an unlocked time capsule once server time has reached or surpassed unlockDate.
 * Enforces ownership, rejects premature opening attempts with HTTP 403,
 * and is safe to repeat idempotently.
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

    // Inviolable temporal guard: server is the sole authority
    const now = new Date();
    if (capsule.isLocked(now)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot open time capsule before its unlock date: ${capsule.unlockDate.toISOString()}.`,
          unlockDate: capsule.unlockDate,
          isLocked: true,
        },
        { status: 403 }
      );
    }

    // Milestone reached: unseal capsule idempotently
    if (!capsule.isOpened) {
      capsule.isOpened = true;
      capsule.openedAt = now;
      await capsule.save();
    }

    // Populate photos for full unsealed view
    await capsule.populate('photos');
    const capsuleObj = capsule.toObject();

    const photos = Array.isArray(capsuleObj.photos)
      ? capsuleObj.photos.map((photo: unknown) => {
          const p = photo as Record<string, unknown>;
          if (p && typeof p.publicId === 'string') {
            return {
              ...p,
              signedUrl: generateSignedPhotoUrl(p.publicId),
            };
          }
          return p;
        })
      : [];

    return NextResponse.json(
      {
        success: true,
        message: 'Time capsule unsealed successfully.',
        data: {
          ...capsuleObj,
          photos,
          isLocked: false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Capsules POST :id/open] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while opening time capsule.' },
      { status: 500 }
    );
  }
}
