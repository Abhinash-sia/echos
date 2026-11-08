import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { Memory } from '@/models/Memory';
import { Photo } from '@/models/Photo';
import { movePhotoSchema } from '@/validations/memory';
import { isValidObjectId, deleteCloudinaryPhoto } from '@/lib/media/cloudinary';

type RouteContext = {
  params: Promise<{ id: string; photoId: string }> | { id: string; photoId: string };
};

/**
 * DELETE /api/memories/:id/photos/:photoId
 * Deletes a photograph from a memory, purging it from both Cloudinary storage and MongoDB.
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

    const { id, photoId } = await Promise.resolve(context.params);
    if (!isValidObjectId(id) || !isValidObjectId(photoId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid memory or photo ID format.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify memory ownership
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

    // Verify photo exists, belongs to user, and belongs to this memory
    const photo = await Photo.findOne({
      _id: photoId,
      memoryId: memory._id,
      userId: auth.user._id,
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found in this memory or access denied.' },
        { status: 404 }
      );
    }

    // 1. Purge asset from Cloudinary storage first (preventing premature DB deletion)
    if (photo.publicId) {
      const destroyed = await deleteCloudinaryPhoto(photo.publicId);
      if (!destroyed) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Failed to delete photo from storage provider. Database record preserved for retry.',
          },
          { status: 502 }
        );
      }
    }

    // 2. Unlink reference from Memory
    await Memory.findByIdAndUpdate(memory._id, {
      $pull: { photos: photo._id },
    });

    // 3. Delete Photo document from MongoDB
    await photo.deleteOne();

    return NextResponse.json(
      {
        success: true,
        message: 'Photo deleted successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      '[Memory Photo DELETE :photoId] Unhandled error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while deleting photo.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/memories/:id/photos/:photoId
 * Moves a photograph from the current memory to another memory owned by the same user.
 * Implements compensating rollback if target association fails.
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

    const { id, photoId } = await Promise.resolve(context.params);
    if (!isValidObjectId(id) || !isValidObjectId(photoId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid memory or photo ID format.' },
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

    const validation = movePhotoSchema.safeParse(body);
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

    const { targetMemoryId } = validation.data;
    if (targetMemoryId === id) {
      return NextResponse.json(
        { success: false, error: 'Photo is already attached to this memory.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Verify source memory ownership
    const sourceMemory = await Memory.findOne({
      _id: id,
      userId: auth.user._id,
    });

    if (!sourceMemory) {
      return NextResponse.json(
        { success: false, error: 'Source memory not found or access denied.' },
        { status: 404 }
      );
    }

    // 2. Verify target memory exists and belongs to the authenticated user
    const targetMemory = await Memory.findOne({
      _id: targetMemoryId,
      userId: auth.user._id,
    });

    if (!targetMemory) {
      return NextResponse.json(
        { success: false, error: 'Target memory not found or access denied.' },
        { status: 404 }
      );
    }

    // 3. Verify photo exists, belongs to source memory, and belongs to user
    const photo = await Photo.findOne({
      _id: photoId,
      memoryId: sourceMemory._id,
      userId: auth.user._id,
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found in source memory or access denied.' },
        { status: 404 }
      );
    }

    // 4. Atomic bidirectional transfer with robust compensating rollback
    let pulledFromSource = false;
    let addedToTarget = false;

    try {
      // Step A: Remove from source memory
      await Memory.findByIdAndUpdate(sourceMemory._id, {
        $pull: { photos: photo._id },
      });
      pulledFromSource = true;

      // Step B: Add to target memory
      await Memory.findByIdAndUpdate(targetMemory._id, {
        $addToSet: { photos: photo._id },
      });
      addedToTarget = true;

      // Step C: Update photo pointer
      photo.memoryId = targetMemory._id;
      await photo.save();
    } catch (moveError) {
      console.error(
        '[Compensating Rollback: Photo Move Failed]:',
        moveError instanceof Error ? moveError.message : 'Unknown error'
      );

      // Rollback operations in reverse order
      if (addedToTarget) {
        await Memory.findByIdAndUpdate(targetMemory._id, {
          $pull: { photos: photo._id },
        }).catch((rollbackTargetErr) => {
          console.error(
            '[Rollback Target Cleanup Failed]:',
            rollbackTargetErr instanceof Error ? rollbackTargetErr.message : 'Unknown error'
          );
        });
      }

      if (pulledFromSource) {
        await Memory.findByIdAndUpdate(sourceMemory._id, {
          $addToSet: { photos: photo._id },
        }).catch((rollbackSourceErr) => {
          console.error(
            '[Rollback Source Restore Failed]:',
            rollbackSourceErr instanceof Error ? rollbackSourceErr.message : 'Unknown error'
          );
        });
      }

      return NextResponse.json(
        { success: false, error: 'Failed to move photo to target memory.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Photo moved successfully.',
        data: photo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      '[Memory Photo PATCH :photoId] Unhandled error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while moving photo.' },
      { status: 500 }
    );
  }
}
