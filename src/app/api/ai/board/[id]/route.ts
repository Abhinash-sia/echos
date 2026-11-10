import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { MemoryBoard } from '@/models/MemoryBoard';
import { isValidObjectId } from '@/lib/media/cloudinary';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

/**
 * DELETE /api/ai/board/:id
 * Permanently deletes a saved AI bulletin board owned by the authenticated user.
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
        { success: false, error: 'Invalid board ID format.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deleted = await MemoryBoard.findOneAndDelete({
      _id: id,
      userId: auth.user._id,
    }).exec();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Saved board not found or access denied.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Saved board deleted.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[AI Board DELETE :id] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete saved AI pinboard.' },
      { status: 500 }
    );
  }
}

