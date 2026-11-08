import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { TimeCapsule } from '@/models/TimeCapsule';
import { Photo } from '@/models/Photo';
import {
  isValidObjectId,
  generateSignedPhotoUrl,
  deleteCloudinaryPhoto,
} from '@/lib/media/cloudinary';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

/**
 * GET /api/capsules/:id
 * Retrieves a single time capsule by ID.
 * Strictly enforces ownership (returns 404 if not owned) and temporal access
 * (returns 403 Forbidden if server time is earlier than unlockDate).
 */
export async function GET(request: Request, context: RouteContext) {
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

    // Enforce ownership: query strictly by ID and authenticated userId
    const capsule = await TimeCapsule.findOne({
      _id: id,
      userId: auth.user._id,
    }).populate('photos');

    if (!capsule) {
      return NextResponse.json(
        { success: false, error: 'Time capsule not found or access denied.' },
        { status: 404 }
      );
    }

    // Enforce date-locking invariant: server is the sole authority
    const now = new Date();
    if (capsule.isLocked(now)) {
      return NextResponse.json(
        {
          success: false,
          error: `Time capsule is sealed and locked until ${capsule.unlockDate.toISOString()}.`,
          unlockDate: capsule.unlockDate,
          isLocked: true,
        },
        { status: 403 }
      );
    }

    // Unlocked: reveal contents and generate signed URLs for photos
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
        data: {
          ...capsuleObj,
          photos,
          isLocked: false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Capsules GET :id] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while retrieving time capsule.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/capsules/:id
 * Deletes a time capsule and safely cleans up any exclusively attached photo assets.
 * Enforces ownership and never deletes assets belonging to other users or memories.
 */
export async function DELETE(request: Request, context: RouteContext) {
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

    // Handle attached photo assets safely:
    // Only purge photos that are exclusively attached to this capsule and not shared with
    // any memory or any other time capsule.
    if (capsule.photos && capsule.photos.length > 0) {
      const ownedPhotos = await Photo.find({
        _id: { $in: capsule.photos },
        userId: auth.user._id,
      });

      const ownedPhotoIds = ownedPhotos.map((p) => p._id);

      // 1. Identify photos referenced by any other time capsule
      const otherCapsules = await TimeCapsule.find({
        _id: { $ne: capsule._id },
        photos: { $in: ownedPhotoIds },
      }).select('photos');

      const photoIdsInOtherCapsules = new Set<string>();
      for (const other of otherCapsules) {
        if (Array.isArray(other.photos)) {
          for (const pid of other.photos) {
            photoIdsInOtherCapsules.add(pid.toString());
          }
        }
      }

      // 2. Identify photos referenced by any memory
      const MemoryModel = (await import('@/models/Memory')).Memory;
      const memoriesWithPhotos = await MemoryModel.find({
        photos: { $in: ownedPhotoIds },
      }).select('photos');

      const photoIdsInMemories = new Set<string>();
      for (const mem of memoriesWithPhotos) {
        if (Array.isArray(mem.photos)) {
          for (const pid of mem.photos) {
            photoIdsInMemories.add(pid.toString());
          }
        }
      }

      // 3. Exclude any photo referenced by another capsule or any memory
      const exclusivePhotos = ownedPhotos.filter(
        (p) =>
          !p.memoryId &&
          !photoIdsInMemories.has(p._id.toString()) &&
          !photoIdsInOtherCapsules.has(p._id.toString())
      );
      const failedPublicIds: string[] = [];

      for (const photo of exclusivePhotos) {
        if (photo.publicId) {
          const ok = await deleteCloudinaryPhoto(photo.publicId);
          if (!ok) {
            failedPublicIds.push(photo.publicId);
          }
        }
      }

      if (failedPublicIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to delete ${failedPublicIds.length} photo(s) from storage provider. Capsule preserved for retry.`,
          },
          { status: 502 }
        );
      }

      if (exclusivePhotos.length > 0) {
        await Photo.deleteMany({
          _id: { $in: exclusivePhotos.map((p) => p._id) },
          userId: auth.user._id,
        });
      }
    }

    // Delete the capsule itself
    await capsule.deleteOne();

    return NextResponse.json(
      {
        success: true,
        message: 'Time capsule and associated resources deleted successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Capsules DELETE :id] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while deleting time capsule.' },
      { status: 500 }
    );
  }
}
