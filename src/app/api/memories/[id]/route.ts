import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { Memory } from '@/models/Memory';
import { Photo } from '@/models/Photo';
import { updateMemorySchema } from '@/validations/memory';
import {
  isValidObjectId,
  generateSignedPhotoUrl,
  deleteCloudinaryPhoto,
} from '@/lib/media/cloudinary';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

/**
 * GET /api/memories/:id
 * Retrieves a single memory by ID for the authenticated owner, populated with signed photo URLs.
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
        { success: false, error: 'Invalid memory ID format.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Enforce ownership: query strictly by ID and userId
    const memory = await Memory.findOne({
      _id: id,
      userId: auth.user._id,
    })
      .populate('photos')
      .lean();

    if (!memory) {
      return NextResponse.json(
        { success: false, error: 'Memory not found or access denied.' },
        { status: 404 }
      );
    }

    // Attach signed URLs for private delivery
    const photos = Array.isArray(memory.photos)
      ? memory.photos.map((photo: unknown) => {
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

    return NextResponse.json({ success: true, data: { ...memory, photos } }, { status: 200 });
  } catch (error) {
    console.error('[Memory GET :id] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while retrieving memory.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/memories/:id
 * Updates an existing memory. Enforces ownership and validates input fields.
 */
export async function PATCH(request: Request, context: RouteContext) {
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
        { success: false, error: 'Invalid memory ID format.' },
        { status: 400 }
      );
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

    const validation = updateMemorySchema.safeParse(body);
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

    await connectToDatabase();

    const memory = await Memory.findOne({
      _id: id,
      userId: auth.user._id,
    });

    if (!memory) {
      return NextResponse.json(
        { success: false, error: 'Memory not found or access denied.' },
        { status: 404 }
      );
    }

    const { title, content, memoryDate, tags } = validation.data;
    if (title !== undefined) memory.title = title;
    if (content !== undefined) memory.content = content;
    if (memoryDate !== undefined) memory.memoryDate = new Date(memoryDate);
    if (tags !== undefined) {
      memory.tags = Array.from(new Set(tags.map((t) => t.trim().toLowerCase())));
    }

    await memory.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Memory updated successfully.',
        data: memory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Memory PATCH :id] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while updating memory.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memories/:id
 * Deletes a memory and all its associated photographs from Cloudinary and MongoDB.
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
        { success: false, error: 'Invalid memory ID format.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const memory = await Memory.findOne({
      _id: id,
      userId: auth.user._id,
    });

    if (!memory) {
      return NextResponse.json(
        { success: false, error: 'Memory not found or access denied.' },
        { status: 404 }
      );
    }

    // 1. Locate all photos associated with this memory belonging to the user
    const photos = await Photo.find({
      memoryId: memory._id,
      userId: auth.user._id,
    });

    // 2. Delete all photographs from Cloudinary storage first
    const failedPublicIds: string[] = [];
    for (const photo of photos) {
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
          error: `Failed to delete ${failedPublicIds.length} photo(s) from storage provider. Memory and photo records preserved for retry.`,
        },
        { status: 502 }
      );
    }

    // 3. Remove all Photo documents
    await Photo.deleteMany({
      memoryId: memory._id,
      userId: auth.user._id,
    });

    // 4. Delete the memory itself
    await memory.deleteOne();

    return NextResponse.json(
      {
        success: true,
        message: 'Memory and associated photographs deleted successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      '[Memory DELETE :id] Unhandled error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while deleting memory.' },
      { status: 500 }
    );
  }
}
