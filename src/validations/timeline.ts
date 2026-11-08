import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Zod validation schema for GET /api/timeline query parameters.
 */
export const timelineQuerySchema = z
  .object({
    type: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.toLowerCase().trim() : val),
        z.enum(['all', 'memory', 'capsule'])
      )
      .default('all'),
    startDate: z
      .string()
      .trim()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid startDate format. Expected a valid date string.',
      })
      .optional(),
    endDate: z
      .string()
      .trim()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid endDate format. Expected a valid date string.',
      })
      .optional(),
    page: z.coerce
      .number()
      .int()
      .min(1, 'Page must be an integer greater than or equal to 1.')
      .default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'Limit must be at least 1.')
      .max(100, 'Limit cannot exceed 100.')
      .default(10),
    sortOrder: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.toLowerCase().trim() : val),
        z.enum(['asc', 'desc'])
      )
      .default('asc'),
    cursor: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate).getTime() <= new Date(data.endDate).getTime();
      }
      return true;
    },
    {
      message: 'startDate must be less than or equal to endDate.',
      path: ['startDate'],
    }
  );

export type TimelineQueryInput = z.infer<typeof timelineQuerySchema>;

/**
 * Decoded timeline cursor containing date and ObjectId for tie-breaking.
 */
export interface TimelineCursor {
  date: Date;
  id: mongoose.Types.ObjectId;
}

/**
 * Safely decodes and validates a base64 timeline cursor string.
 * Returns null if the cursor is invalid, malformed, or manipulated.
 */
export function parseTimelineCursor(cursorStr: string): TimelineCursor | null {
  try {
    let jsonStr: string;
    try {
      jsonStr = Buffer.from(cursorStr, 'base64').toString('utf-8');
    } catch {
      return null;
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.date !== 'string' || typeof parsed.id !== 'string') return null;

    const date = new Date(parsed.date);
    if (isNaN(date.getTime())) return null;

    if (!mongoose.Types.ObjectId.isValid(parsed.id)) return null;

    return {
      date,
      id: new mongoose.Types.ObjectId(parsed.id),
    };
  } catch {
    return null;
  }
}

/**
 * Encodes timeline item date and id into a deterministic URL-safe base64 string.
 */
export function createTimelineCursor(
  date: Date | string,
  id: string | mongoose.Types.ObjectId
): string {
  const d = date instanceof Date ? date : new Date(date);
  return Buffer.from(
    JSON.stringify({
      date: d.toISOString(),
      id: id.toString(),
    })
  ).toString('base64url');
}
