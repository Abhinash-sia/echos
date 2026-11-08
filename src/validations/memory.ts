import { z } from 'zod';

export const createMemorySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content cannot exceed 50,000 characters')
    .trim(),
  memoryDate: z
    .string()
    .or(z.date())
    .refine(
      (val) => {
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      { message: 'Valid memory date is required.' }
    ),
  tags: z
    .array(z.string().min(1).max(50).trim())
    .max(20, 'Cannot exceed 20 tags per memory')
    .optional()
    .default([]),
});

export const updateMemorySchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters')
      .trim()
      .optional(),
    content: z
      .string()
      .min(1, 'Content cannot be empty')
      .max(50000, 'Content cannot exceed 50,000 characters')
      .trim()
      .optional(),
    memoryDate: z
      .string()
      .or(z.date())
      .refine(
        (val) => {
          const d = new Date(val);
          return !isNaN(d.getTime());
        },
        { message: 'Valid memory date is required.' }
      )
      .optional(),
    tags: z
      .array(z.string().min(1).max(50).trim())
      .max(20, 'Cannot exceed 20 tags per memory')
      .optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.content !== undefined ||
      data.memoryDate !== undefined ||
      data.tags !== undefined,
    { message: 'At least one field must be provided to update.' }
  );

export const movePhotoSchema = z.object({
  targetMemoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target memory ID format'),
});

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
export type MovePhotoInput = z.infer<typeof movePhotoSchema>;
