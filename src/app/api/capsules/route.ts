import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { TimeCapsule } from '@/models/TimeCapsule';
import { Photo } from '@/models/Photo';
import { createCapsuleSchema } from '@/validations/capsule';
import { generateSignedPhotoUrl } from '@/lib/media/cloudinary';

/**
 * POST /api/capsules
 * Creates and seals a new time capsule with a future unlock date.
 * Enforces server-side time, photo ownership, and lifecycle immutability.
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload in request body.' },
        { status: 400 }
      );
    }

    const validation = createCapsuleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      title,
      message,
      photos: inputPhotos,
      photoIds: inputPhotoIds,
      photoUrls: inputPhotoUrls,
    } = validation.data;
    const targetUnlockDate = new Date((validation.data.unlockDate ?? validation.data.unlockAt)!);

    const now = new Date();
    if (targetUnlockDate.getTime() <= now.getTime()) {
      return NextResponse.json(
        { success: false, error: 'Unlock date must be strictly in the future.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Validate photo references by ID (if any)
    const combinedPhotoIds = Array.from(
      new Set([...(inputPhotos || []), ...(inputPhotoIds || [])])
    );
    let validatedPhotos: InstanceType<typeof Photo>[] = [];

    if (combinedPhotoIds.length > 0) {
      validatedPhotos = await Photo.find({
        _id: { $in: combinedPhotoIds },
        userId: auth.user._id,
      });

      if (validatedPhotos.length !== combinedPhotoIds.length) {
        return NextResponse.json(
          {
            success: false,
            error:
              'One or more photo references are invalid or not owned by the authenticated user.',
          },
          { status: 400 }
        );
      }
    }

    // 2. Validate photo references by URL (if any) - prevent arbitrary external URLs
    let validatedPhotosByUrl: InstanceType<typeof Photo>[] = [];
    if (inputPhotoUrls && inputPhotoUrls.length > 0) {
      validatedPhotosByUrl = await Photo.find({
        url: { $in: inputPhotoUrls },
        userId: auth.user._id,
      });

      if (validatedPhotosByUrl.length !== inputPhotoUrls.length) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Arbitrary external photo URLs are not permitted. Photos must be existing assets owned by the user.',
          },
          { status: 400 }
        );
      }
    }

    // Merge photo IDs and URLs
    const finalPhotoIdSet = new Set([
      ...validatedPhotos.map((p) => p._id.toString()),
      ...validatedPhotosByUrl.map((p) => p._id.toString()),
    ]);
    const finalPhotoUrlSet = new Set([
      ...validatedPhotos.map((p) => p.url),
      ...validatedPhotosByUrl.map((p) => p.url),
    ]);

    // Create and seal the time capsule
    // Crucial: userId, sealedAt, isOpened, and openedAt are strictly set by server
    const capsule = await TimeCapsule.create({
      userId: auth.user._id,
      title,
      message,
      unlockDate: targetUnlockDate,
      sealedAt: now,
      isOpened: false,
      openedAt: null,
      photos: Array.from(finalPhotoIdSet),
      photoUrls: Array.from(finalPhotoUrlSet),
    });

    // Content is sealed: do not leak letter contents upon initial sealing
    return NextResponse.json(
      {
        success: true,
        message: 'Time capsule sealed successfully.',
        data: {
          _id: capsule._id,
          userId: capsule.userId,
          title: capsule.title,
          unlockDate: capsule.unlockDate,
          unlockAt: capsule.unlockAt,
          sealedAt: capsule.sealedAt,
          isOpened: false,
          openedAt: null,
          isLocked: true,
          createdAt: capsule.createdAt,
          updatedAt: capsule.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Capsules POST] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while creating time capsule.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/capsules
 * Lists time capsules belonging to the authenticated user.
 * Redacts secret letters and private photos for all sealed/locked capsules.
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

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));
    const sortOrderParam = searchParams.get('sortOrder')?.toLowerCase();
    const sortDirection = sortOrderParam === 'desc' ? -1 : 1;

    const now = new Date();

    // Query filter strictly bound to authenticated user
    const filter: Record<string, unknown> = {
      userId: auth.user._id,
    };

    const statusParam = searchParams.get('status')?.toLowerCase();
    if (statusParam === 'locked') {
      filter.unlockDate = { $gt: now };
    } else if (statusParam === 'unlocked') {
      filter.unlockDate = { $lte: now };
    }

    const skip = (page - 1) * limit;

    const [total, capsules] = await Promise.all([
      TimeCapsule.countDocuments(filter),
      TimeCapsule.find(filter)
        .sort({ unlockDate: sortDirection, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('photos')
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    // Apply strict temporal redaction
    const mappedCapsules = capsules.map((capsule) => {
      const isLocked = now < new Date(capsule.unlockDate);

      if (isLocked) {
        // Redact message and private photos for sealed capsules
        return {
          _id: capsule._id,
          userId: capsule.userId,
          title: capsule.title,
          unlockDate: capsule.unlockDate,
          unlockAt: capsule.unlockDate,
          sealedAt: capsule.sealedAt,
          isOpened: capsule.isOpened,
          openedAt: capsule.openedAt,
          isLocked: true,
          createdAt: capsule.createdAt,
          updatedAt: capsule.updatedAt,
        };
      }

      // Unlocked: attach signed URLs for photos
      const photos = Array.isArray(capsule.photos)
        ? capsule.photos.map((photo: unknown) => {
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

      return {
        _id: capsule._id,
        userId: capsule.userId,
        title: capsule.title,
        message: capsule.message,
        unlockDate: capsule.unlockDate,
        unlockAt: capsule.unlockDate,
        sealedAt: capsule.sealedAt,
        isOpened: capsule.isOpened,
        openedAt: capsule.openedAt,
        photos,
        photoUrls: capsule.photoUrls || [],
        isLocked: false,
        createdAt: capsule.createdAt,
        updatedAt: capsule.updatedAt,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: mappedCapsules,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Capsules GET] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while retrieving time capsules.' },
      { status: 500 }
    );
  }
}
