import { z } from 'zod';

/**
 * Request schema for POST /api/ai/timeline-summary
 */
export const timelineSummaryRequestSchema = z.object({
  periodLabel: z
    .string()
    .trim()
    .min(1, 'Period label is required')
    .max(80, 'Period label cannot exceed 80 characters'),
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        type: z.enum(['memory', 'capsule']),
      })
    )
    .min(1, 'At least one timeline item is required to summarize')
    .max(40, 'Cannot summarize more than 40 items at once'),
});

/**
 * Request schema for POST /api/ai/board
 */
export const boardGenerateRequestSchema = z.object({
  focusPrompt: z
    .string()
    .trim()
    .max(200, 'Focus prompt cannot exceed 200 characters')
    .optional(),
});

const safeString = (fallback = '', maxLen = 1000) =>
  z.preprocess(
    (val) => {
      if (val === null || val === undefined) return fallback;
      if (typeof val === 'string') return val.trim();
      if (typeof val === 'number' || typeof val === 'boolean') return String(val);
      return fallback;
    },
    z.string().transform((s) => (s.length > 0 ? s.slice(0, maxLen) : fallback))
  );

const safeStringArray = (maxItems: number, maxLen: number, fallbackItem: string) =>
  z.preprocess(
    (val) => {
      if (Array.isArray(val)) {
        return val
          .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') {
              return Object.values(item as Record<string, unknown>)
                .filter((v) => typeof v === 'string')
                .join(': ')
                .trim();
            }
            return '';
          })
          .filter(Boolean)
          .map((s) => s.slice(0, maxLen))
          .slice(0, maxItems);
      }
      if (typeof val === 'string' && val.trim()) {
        return val
          .split(',')
          .map((s) => s.trim().slice(0, maxLen))
          .filter(Boolean)
          .slice(0, maxItems);
      }
      return [fallbackItem];
    },
    z.array(z.string()).transform((arr) => (arr.length > 0 ? arr : [fallbackItem]))
  );

/**
 * Structured AI output schema for Timeline Chapter Summary
 */
export const timelineChapterSummaryOutputSchema = z.object({
  headline: safeString('Chapter Reflections', 200),
  summary: safeString('A curated summary of your archived moments from this period.', 1200),
  mood: safeString('Thoughtful', 80),
  themes: safeStringArray(5, 50, 'reflection'),
  highlightTitle: safeString('', 250),
});

/**
 * Structured AI output schema for Capsule Then vs. Now Insight
 */
export const capsuleInsightOutputSchema = z.object({
  eraLabel: safeString('Across Time', 120),
  thenSummary: safeString('Your past letter captured your thoughts at the time of sealing.', 1000),
  nowSummary: safeString('Your recent journal entries show how your focus has evolved.', 1000),
  shifts: safeStringArray(4, 320, 'A quiet shift in perspective over time.'),
  reflectionPrompt: safeString('What feels most different about your life today compared to when you sealed this?', 350),
});

/**
 * Structured AI output schema for Clustered Bento Pinboard
 */
export const boardLayoutOutputSchema = z.object({
  boardTitle: safeString('ECHOES Curated Pinboard', 180),
  curatorNote: safeString('Organized your memories and capsules into thematic clusters.', 800),
  clusters: z
    .array(
      z.object({
        id: safeString('', 60),
        label: safeString('Curated Theme', 120),
        color: z.enum(['coral', 'teal', 'cobalt', 'yellow', 'pink']).catch('coral'),
        summary: safeString('Related moments grouped from your archive.', 500),
      })
    )
    .catch([])
    .transform((arr) => arr.slice(0, 6)),
  pins: z
    .array(
      z.object({
        itemId: safeString('', 120),
        itemType: z.enum(['memory', 'capsule']).catch('memory'),
        clusterId: safeString('', 60),
        stickyNote: safeString('', 350),
        rotation: z.coerce.number().catch(0),
        pinStyle: z.enum(['polaroid', 'index-card', 'wax-seal', 'sticky']).catch('index-card'),
      })
    )
    .catch([])
    .transform((arr) => arr.slice(0, 60)),
  connections: z
    .array(
      z.object({
        fromItemId: safeString('', 120),
        toItemId: safeString('', 120),
        reason: safeString('Connected theme in your archive', 250),
      })
    )
    .catch([])
    .transform((arr) => arr.slice(0, 30)),
});

export const semanticFilterOutputSchema = z.object({
  items: z
    .array(
      z.object({
        ref: safeString('', 120).optional(),
        itemId: safeString('', 120).optional(),
        about: safeString('', 160),
        score: z.coerce.number().min(1).max(5).catch(1),
      })
    )
    .catch([])
    .transform((arr) => arr.slice(0, 60)),
});

export type TimelineSummaryRequestInput = z.infer<typeof timelineSummaryRequestSchema>;
export type BoardGenerateRequestInput = z.infer<typeof boardGenerateRequestSchema>;
export type TimelineChapterSummaryOutput = z.infer<typeof timelineChapterSummaryOutputSchema>;
export type CapsuleInsightOutput = z.infer<typeof capsuleInsightOutputSchema>;
export type BoardLayoutOutput = z.infer<typeof boardLayoutOutputSchema>;

/**
 * Request schema for PUT /api/ai/board (explicitly saving a generated board)
 */
export const boardSaveRequestSchema = z.object({
  boardId: z.string().trim().optional(),
  boardTitle: z.string().trim().min(1, 'Board title is required').max(140),
  curatorNote: z.string().trim().min(1).max(600),
  focusPrompt: z.string().trim().max(200).optional(),
  generationMode: z.enum(['ai', 'heuristic']).default('ai'),
  modelName: z.string().trim().min(1).max(120),
  clusters: boardLayoutOutputSchema.shape.clusters,
  pins: boardLayoutOutputSchema.shape.pins,
  connections: boardLayoutOutputSchema.shape.connections,
});

export type BoardSaveRequestInput = z.infer<typeof boardSaveRequestSchema>;

