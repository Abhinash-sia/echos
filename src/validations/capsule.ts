import { z } from 'zod';

export const createCapsuleSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),
    message: z
      .string()
      .min(1, 'Capsule message is required')
      .max(100000, 'Message cannot exceed 100,000 characters')
      .trim(),
    unlockDate: z.string().or(z.date()).optional(),
    unlockAt: z.string().or(z.date()).optional(),
    photos: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid photo ID format'))
      .optional()
      .default([]),
    photoIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid photo ID format')).optional(),
    photoUrls: z.array(z.string().url('Invalid photo URL format')).optional().default([]),
    // Lifecycle / security fields explicitly forbidden from client mutation
    userId: z
      .never({ message: 'Supplying userId is forbidden; ownership is derived from the session.' })
      .optional(),
    isOpened: z
      .never({ message: 'Supplying isOpened is forbidden; initial state is always false.' })
      .optional(),
    openedAt: z.never({ message: 'Supplying openedAt is forbidden.' }).optional(),
    sealedAt: z
      .never({ message: 'Supplying sealedAt is forbidden; sealedAt is set by server time.' })
      .optional(),
  })
  .refine((data) => data.unlockDate !== undefined || data.unlockAt !== undefined, {
    message: 'Unlock date is required.',
    path: ['unlockDate'],
  })
  .superRefine((data, ctx) => {
    const rawDate = data.unlockDate ?? data.unlockAt;
    const d = new Date(rawDate!);
    if (isNaN(d.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid unlock date is required.',
        path: ['unlockDate'],
      });
      return;
    }
    if (d.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unlock date must be strictly in the future.',
        path: ['unlockDate'],
      });
    }
  });

export type CreateCapsuleInput = z.infer<typeof createCapsuleSchema>;
