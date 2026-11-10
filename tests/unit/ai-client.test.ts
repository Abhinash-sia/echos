import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
  checkAiProviderStatus,
  generateStructuredCompletion,
  isLiveAiConfigured,
  resetMockAiCompletion,
  setMockAiCompletion,
} from '@/lib/ai/client';
import {
  boardGenerateRequestSchema,
  boardLayoutOutputSchema,
  timelineSummaryRequestSchema,
} from '@/validations/ai';

describe('AI Client & Validation Unit Tests', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AI_API_KEY;
    delete process.env.AI_BASE_URL;
    delete process.env.AI_MODEL;
    resetMockAiCompletion();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    resetMockAiCompletion();
  });

  const sampleSchema = z.object({
    headline: z.string(),
    score: z.number(),
  });

  it('uses local heuristic fallback when neither AI_API_KEY nor AI_BASE_URL is configured', async () => {
    expect(isLiveAiConfigured()).toBe(false);

    const result = await generateStructuredCompletion({
      systemPrompt: 'sys',
      userPrompt: 'usr',
      schema: sampleSchema,
      fallback: () => ({ headline: 'Local Fallback', score: 1 }),
    });

    expect(result.mode).toBe('heuristic');
    expect(result.model).toBe('echoes-local-heuristic');
    expect(result.data).toEqual({ headline: 'Local Fallback', score: 1 });
    expect(result.warning).toBeTruthy();
  });

  it('calls OpenAI-compatible /chat/completions and strips markdown code fences', async () => {
    process.env.AI_BASE_URL = 'https://example-llm.test/v1';
    process.env.AI_API_KEY = 'sk-test-key';
    process.env.AI_MODEL = 'test-model-1';

    expect(isLiveAiConfigured()).toBe(true);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: '```json\n{"headline":"Live AI Recap","score":99}\n```',
            },
          },
        ],
      }),
    });

    const result = await generateStructuredCompletion({
      systemPrompt: 'Be concise',
      userPrompt: 'Summarize',
      schema: sampleSchema,
      fallback: () => ({ headline: 'Fallback', score: 0 }),
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe('https://example-llm.test/v1/chat/completions');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer sk-test-key');

    expect(result.mode).toBe('ai');
    expect(result.model).toBe('test-model-1');
    expect(result.data).toEqual({ headline: 'Live AI Recap', score: 99 });
  });

  it('retries without response_format when provider rejects json_object with HTTP 400', async () => {
    process.env.AI_BASE_URL = 'http://127.0.0.1:11434/v1';
    process.env.AI_MODEL = 'llama3.2';

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'response_format unsupported',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: '{"headline":"Ollama Retry","score":42}' } }],
        }),
      });

    const result = await generateStructuredCompletion({
      systemPrompt: 'sys',
      userPrompt: 'usr',
      schema: sampleSchema,
      fallback: () => ({ headline: 'Fallback', score: 0 }),
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.mode).toBe('ai');
    expect(result.data).toEqual({ headline: 'Ollama Retry', score: 42 });
  });

  it('falls back gracefully when upstream fails or returns invalid schema', async () => {
    setMockAiCompletion(() => ({ wrongField: true }));

    const result = await generateStructuredCompletion({
      systemPrompt: 'sys',
      userPrompt: 'usr',
      schema: sampleSchema,
      fallback: () => ({ headline: 'Safe Fallback', score: 5 }),
    });

    expect(result.mode).toBe('heuristic');
    expect(result.data).toEqual({ headline: 'Safe Fallback', score: 5 });
  });

  it('validates timelineSummaryRequestSchema and boardGenerateRequestSchema', () => {
    expect(
      timelineSummaryRequestSchema.safeParse({
        periodLabel: 'October 2026',
        items: [{ id: '123', type: 'memory' }],
      }).success
    ).toBe(true);

    expect(
      timelineSummaryRequestSchema.safeParse({
        periodLabel: 'October 2026',
        items: [],
      }).success
    ).toBe(false);

    expect(
      boardGenerateRequestSchema.safeParse({ focusPrompt: 'Group by travel' }).success
    ).toBe(true);
  });

  it('reports unconfigured, connected local LLM, and unreachable local LLM statuses accurately', async () => {
    const unconfigured = await checkAiProviderStatus();
    expect(unconfigured.configured).toBe(false);
    expect(unconfigured.connected).toBe(false);
    expect(unconfigured.providerType).toBe('unconfigured');

    process.env.AI_BASE_URL = 'http://127.0.0.1:11434/v1';
    process.env.AI_MODEL = 'llama3.2:3b';

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ id: 'llama3.2:3b' }, { id: 'qwen2.5-coder:7b' }],
      }),
    });

    const connected = await checkAiProviderStatus();
    expect(connected.configured).toBe(true);
    expect(connected.connected).toBe(true);
    expect(connected.providerType).toBe('local');
    expect(connected.modelAvailable).toBe(true);
    expect(connected.model).toBe('llama3.2:3b');

    global.fetch = vi.fn().mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
    const offline = await checkAiProviderStatus();
    expect(offline.configured).toBe(true);
    expect(offline.connected).toBe(false);
    expect(offline.providerType).toBe('local');
  });

  it('tolerates null clusterId and stickyNote from smaller local LLMs in boardLayoutOutputSchema', () => {
    const parsed = boardLayoutOutputSchema.safeParse({
      boardTitle: 'My Board',
      curatorNote: 'Grouped nicely.',
      clusters: [
        { id: 'cluster-1', label: 'Memories', color: 'blue', summary: null },
      ],
      pins: [
        {
          itemId: 'mem-1',
          itemType: 'memory',
          clusterId: null,
          stickyNote: null,
          rotation: 2.2,
          pinStyle: 'polaroid',
        },
      ],
      connections: null,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.clusters[0].color).toBe('coral');
      expect(parsed.data.pins[0].clusterId).toBe('');
      expect(parsed.data.connections).toEqual([]);
    }
  });
});

