import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import mongoose from 'mongoose';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { Memory } from '@/models/Memory';
import { TimeCapsule } from '@/models/TimeCapsule';
import { Photo } from '@/models/Photo';
import {
  timelineQuerySchema,
  parseTimelineCursor,
  createTimelineCursor,
  TimelineCursor,
} from '@/validations/timeline';
import { generateSignedPhotoUrl } from '@/lib/media/cloudinary';

interface RawTimelineItem {
  _id: mongoose.Types.ObjectId;
  type: 'memory' | 'capsule';
  title: string;
  date: Date;
  content?: string;
  message?: string;
  tags?: string[];
  photos?: (mongoose.Types.ObjectId | string)[];
  photoUrls?: string[];
  unlockDate?: Date;
  sealedAt?: Date;
  isOpened?: boolean;
  openedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/timeline
 * Combines journal memories and time capsules into a single chronological timeline.
 * Preserves all Phase 3 locked capsule privacy invariants and photo ownership protections.
 */
export async function GET(request: Request) {
  try {
    try {
      await headers();
    } catch (err: unknown) {
      // Allow Next.js dynamic bailout error to propagate during build
      if (
        typeof err === 'object' &&
        err !== null &&
        'digest' in err &&
        typeof (err as { digest: unknown }).digest === 'string' &&
        (err as { digest: string }).digest.startsWith('DYNAMIC_SERVER_USAGE')
      ) {
        throw err;
      }
      // Test environment fallback
    }

    // 1. Authenticate Request
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // 2. Parse & Validate Query Parameters
    const url = new URL(request.url);
    const rawQuery: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      rawQuery[key] = val;
    });

    const validation = timelineQuerySchema.safeParse(rawQuery);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue?.message || 'Validation failed',
          details: validation.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const query = validation.data;

    // 3. Validate Cursor (if supplied)
    let decodedCursor: TimelineCursor | null = null;
    if (query.cursor) {
      decodedCursor = parseTimelineCursor(query.cursor);
      if (!decodedCursor) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or manipulated cursor.',
          },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    const now = new Date();
    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;

    // Build date range criteria if provided
    const dateRangeFilter: Record<string, Date> = {};
    if (query.startDate) {
      dateRangeFilter.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      dateRangeFilter.$lte = new Date(query.endDate);
    }
    const hasDateRange = Object.keys(dateRangeFilter).length > 0;

    // Memory filter
    const memoryMatch: Record<string, unknown> = {
      userId: auth.user._id,
    };
    if (hasDateRange) {
      memoryMatch.memoryDate = dateRangeFilter;
    }

    // TimeCapsule filter
    const capsuleMatch: Record<string, unknown> = {
      userId: auth.user._id,
    };
    if (hasDateRange) {
      capsuleMatch.unlockDate = dateRangeFilter;
    }

    // Compute total count based on type filter
    let total = 0;
    let memCount = 0;
    let capCount = 0;
    if (query.type === 'memory') {
      memCount = await Memory.countDocuments(memoryMatch);
      total = memCount;
    } else if (query.type === 'capsule') {
      capCount = await TimeCapsule.countDocuments(capsuleMatch);
      total = capCount;
    } else {
      [memCount, capCount] = await Promise.all([
        Memory.countDocuments(memoryMatch),
        TimeCapsule.countDocuments(capsuleMatch),
      ]);
      total = memCount + capCount;
    }

    // Fast-path: When no records exist matching criteria across both collections
    if (total === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          pagination: {
            total: 0,
            limit: query.limit,
            ...(decodedCursor
              ? {
                  hasNextPage: false,
                  nextCursor: null,
                  prevCursor: null,
                }
              : {
                  page: query.page,
                  totalPages: 1,
                  hasNextPage: false,
                  hasPrevPage: false,
                  nextCursor: null,
                  prevCursor: null,
                }),
          },
        },
        { status: 200 }
      );
    }

    // Build Aggregation Pipeline
    const pipeline: mongoose.PipelineStage[] = [];
    const fetchLimit = decodedCursor ? query.limit + 1 : query.limit;

    // Determine the optimal root collection and whether union is required
    let rootModel: typeof Memory | typeof TimeCapsule = Memory;

    if (query.type === 'memory' || (query.type === 'all' && capCount === 0)) {
      rootModel = Memory;
      pipeline.push(
        { $match: memoryMatch },
        {
          $project: {
            _id: 1,
            type: { $literal: 'memory' },
            title: 1,
            date: '$memoryDate',
            content: 1,
            tags: 1,
            photos: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        }
      );
    } else if (query.type === 'capsule' || (query.type === 'all' && memCount === 0)) {
      rootModel = TimeCapsule;
      pipeline.push(
        { $match: capsuleMatch },
        {
          $project: {
            _id: 1,
            type: { $literal: 'capsule' },
            title: 1,
            date: '$unlockDate',
            unlockDate: 1,
            sealedAt: 1,
            isOpened: 1,
            openedAt: 1,
            message: 1,
            photos: 1,
            photoUrls: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        }
      );
    } else {
      // Both collections have entries (query.type === 'all' && memCount > 0 && capCount > 0)
      rootModel = Memory;
      pipeline.push(
        { $match: memoryMatch },
        {
          $project: {
            _id: 1,
            type: { $literal: 'memory' },
            title: 1,
            date: '$memoryDate',
            content: 1,
            tags: 1,
            photos: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $unionWith: {
            coll: TimeCapsule.collection.name,
            pipeline: [
              { $match: capsuleMatch },
              {
                $project: {
                  _id: 1,
                  type: { $literal: 'capsule' },
                  title: 1,
                  date: '$unlockDate',
                  unlockDate: 1,
                  sealedAt: 1,
                  isOpened: 1,
                  openedAt: 1,
                  message: 1,
                  photos: 1,
                  photoUrls: 1,
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            ],
          },
        }
      );
    }

    // Cursor match stage
    if (decodedCursor) {
      if (sortDirection === 1) {
        pipeline.push({
          $match: {
            $or: [
              { date: { $gt: decodedCursor.date } },
              { date: decodedCursor.date, _id: { $gt: decodedCursor.id } },
            ],
          },
        });
      } else {
        pipeline.push({
          $match: {
            $or: [
              { date: { $lt: decodedCursor.date } },
              { date: decodedCursor.date, _id: { $lt: decodedCursor.id } },
            ],
          },
        });
      }
    }

    // Sort stage (deterministic total ordering with secondary tie-breaker on _id)
    pipeline.push({
      $sort: { date: sortDirection, _id: sortDirection },
    });

    // Offset pagination stage (only applied when cursor is not used)
    if (!decodedCursor) {
      const skip = (query.page - 1) * query.limit;
      if (skip > 0) {
        pipeline.push({ $skip: skip });
      }
    }

    // Limit stage
    pipeline.push({ $limit: fetchLimit });

    // Execute query on the determined root model
    const rawItems: RawTimelineItem[] = await rootModel.aggregate(pipeline);

    // Determine hasNextPage for cursor pagination
    let hasMoreInCursor = false;
    let paginatedRawItems = rawItems;
    if (decodedCursor) {
      if (rawItems.length > query.limit) {
        hasMoreInCursor = true;
        paginatedRawItems = rawItems.slice(0, query.limit);
      }
    }

    // 4. Batch Populate Photos for Permitted Entries
    const photoIdSet = new Set<string>();
    for (const item of paginatedRawItems) {
      if (item.type === 'memory') {
        if (Array.isArray(item.photos)) {
          for (const pid of item.photos) {
            if (pid) photoIdSet.add(pid.toString());
          }
        }
      } else if (item.type === 'capsule') {
        const itemUnlockDate = new Date(item.unlockDate || item.date);
        const isLocked = now.getTime() < itemUnlockDate.getTime();
        // NEVER fetch or associate photos for sealed/locked capsules
        if (!isLocked && Array.isArray(item.photos)) {
          for (const pid of item.photos) {
            if (pid) photoIdSet.add(pid.toString());
          }
        }
      }
    }

    const photoDocs =
      photoIdSet.size > 0
        ? await Photo.find({
            _id: { $in: Array.from(photoIdSet).map((id) => new mongoose.Types.ObjectId(id)) },
            userId: auth.user._id, // Enforce strict user photo ownership
          }).lean()
        : [];

    const photoMap = new Map<string, (typeof photoDocs)[0]>();
    for (const doc of photoDocs) {
      photoMap.set(doc._id.toString(), doc);
    }

    // 5. Transform & Apply Strict Redaction
    const timelineData = paginatedRawItems.map((item) => {
      const id = item._id.toString();

      if (item.type === 'memory') {
        const mappedPhotos = Array.isArray(item.photos)
          ? item.photos
              .map((pid) => {
                const p = photoMap.get(pid.toString());
                if (!p) return null;
                return {
                  id: p._id.toString(),
                  _id: p._id.toString(),
                  url: p.url,
                  signedUrl: generateSignedPhotoUrl(p.publicId),
                  format: p.format,
                  width: p.width,
                  height: p.height,
                  bytes: p.bytes,
                  createdAt: p.createdAt,
                };
              })
              .filter(Boolean)
          : [];

        return {
          id,
          _id: id,
          type: 'memory' as const,
          title: item.title,
          date: item.date,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          tags: item.tags || [],
          content: item.content,
          photos: mappedPhotos,
        };
      }

      // Capsule entry
      const unlockDate = new Date(item.unlockDate || item.date);
      const isLocked = now.getTime() < unlockDate.getTime();

      if (isLocked) {
        // Locked Capsule: STRICT REDACTION of message, photo IDs, URLs, and metadata
        return {
          id,
          _id: id,
          type: 'capsule' as const,
          title: item.title,
          date: unlockDate,
          unlockDate,
          sealedAt: item.sealedAt,
          isLocked: true,
          isOpened: Boolean(item.isOpened),
          openedAt: item.openedAt || null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      }

      // Unlocked Capsule
      const mappedPhotos = Array.isArray(item.photos)
        ? item.photos
            .map((pid) => {
              const p = photoMap.get(pid.toString());
              if (!p) return null;
              return {
                id: p._id.toString(),
                _id: p._id.toString(),
                url: p.url,
                signedUrl: generateSignedPhotoUrl(p.publicId),
                format: p.format,
                width: p.width,
                height: p.height,
                bytes: p.bytes,
                createdAt: p.createdAt,
              };
            })
            .filter(Boolean)
        : [];

      return {
        id,
        _id: id,
        type: 'capsule' as const,
        title: item.title,
        date: unlockDate,
        unlockDate,
        sealedAt: item.sealedAt,
        isLocked: false,
        isOpened: Boolean(item.isOpened),
        openedAt: item.openedAt || null,
        content: item.message,
        message: item.message,
        photos: mappedPhotos,
        photoUrls: item.photoUrls || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    // 6. Pagination Metadata
    const totalPages = Math.ceil(total / query.limit) || 1;
    const hasNextPage = decodedCursor ? hasMoreInCursor : query.page < totalPages;
    const hasPrevPage = decodedCursor ? true : query.page > 1;

    let nextCursor: string | null = null;
    if (timelineData.length > 0 && hasNextPage) {
      const last = timelineData[timelineData.length - 1];
      nextCursor = createTimelineCursor(last.date, last.id);
    }

    let prevCursor: string | null = null;
    if (timelineData.length > 0 && (decodedCursor || query.page > 1)) {
      const first = timelineData[0];
      prevCursor = createTimelineCursor(first.date, first.id);
    }

    return NextResponse.json(
      {
        success: true,
        data: timelineData,
        pagination: {
          total,
          limit: query.limit,
          ...(decodedCursor
            ? {
                hasNextPage,
                nextCursor,
                prevCursor,
              }
            : {
                page: query.page,
                totalPages,
                hasNextPage,
                hasPrevPage,
                nextCursor,
                prevCursor,
              }),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'digest' in error) {
      throw error;
    }
    console.error('[Timeline GET] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while retrieving timeline.' },
      { status: 500 }
    );
  }
}
