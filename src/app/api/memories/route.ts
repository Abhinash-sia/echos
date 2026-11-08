import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { Memory } from '@/models/Memory';
import { createMemorySchema } from '@/validations/memory';
import { generateSignedPhotoUrl } from '@/lib/media/cloudinary';

/**
 * Escapes regex special characters to prevent ReDoS injection attacks.
 */
function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * POST /api/memories
 * Creates a new personal memory for the authenticated user.
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

    const validation = createMemorySchema.safeParse(body);
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

    const { title, content, memoryDate, tags } = validation.data;

    await connectToDatabase();

    // Never trust client-provided userId - always derive from authenticated session
    const memory = await Memory.create({
      userId: auth.user._id,
      title,
      content,
      memoryDate: new Date(memoryDate),
      tags: tags ? Array.from(new Set(tags.map((t) => t.trim().toLowerCase()))) : [],
      photos: [],
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Memory created successfully.',
        data: memory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Memories POST] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while creating memory.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/memories
 * Retrieves all memories belonging to the authenticated user with search, filtering, and pagination.
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

    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));

    // Sort order (default: descending chronological by memoryDate)
    const sortOrderParam = searchParams.get('sortOrder')?.toLowerCase();
    const sortDirection = sortOrderParam === 'asc' ? 1 : -1;

    // Filter criteria - strictly scoped to authenticated user
    const filter: Record<string, unknown> = {
      userId: auth.user._id,
    };

    // Search query on title and content
    const search = searchParams.get('search')?.trim();
    if (search) {
      if (search.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Search query cannot exceed 100 characters.' },
          { status: 400 }
        );
      }
      const escaped = escapeRegex(search);
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { content: { $regex: escaped, $options: 'i' } },
      ];
    }

    // Filter by tags (supports comma-separated list or multiple parameters)
    const tagsParam = searchParams.getAll('tags');
    if (tagsParam.length > 0) {
      const flattenedTags = tagsParam
        .flatMap((t) => t.split(','))
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0 && t.length <= 50);

      if (flattenedTags.length > 0) {
        filter.tags = { $in: flattenedTags };
      }
    }

    // Filter by date range (startDate, endDate)
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (startDateParam || endDateParam) {
      let start: Date | undefined;
      let end: Date | undefined;

      if (startDateParam) {
        start = new Date(startDateParam);
        if (isNaN(start.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Invalid startDate format. Expected a valid date string.' },
            { status: 400 }
          );
        }
      }

      if (endDateParam) {
        end = new Date(endDateParam);
        if (isNaN(end.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Invalid endDate format. Expected a valid date string.' },
            { status: 400 }
          );
        }
      }

      if (start && end && start > end) {
        return NextResponse.json(
          { success: false, error: 'startDate must be less than or equal to endDate.' },
          { status: 400 }
        );
      }

      const dateFilter: Record<string, Date> = {};
      if (start) dateFilter.$gte = start;
      if (end) dateFilter.$lte = end;
      filter.memoryDate = dateFilter;
    }

    const skip = (page - 1) * limit;

    const [total, memories] = await Promise.all([
      Memory.countDocuments(filter),
      Memory.find(filter)
        .sort({ memoryDate: sortDirection, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('photos')
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    // Attach signed URLs to any populated photos
    const mappedMemories = memories.map((mem) => {
      const photos = Array.isArray(mem.photos)
        ? mem.photos.map((photo: unknown) => {
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
        ...mem,
        photos,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: mappedMemories,
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
    console.error('[Memories GET] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while retrieving memories.' },
      { status: 500 }
    );
  }
}
