import { z } from 'zod';
import { getEnv } from '@/lib/env';

export type AiGenerationMode = 'ai' | 'heuristic';

export interface AiCompletionResult<T> {
  data: T;
  mode: AiGenerationMode;
  model: string;
  warning?: string;
}

export interface AiProviderStatus {
  configured: boolean;
  connected: boolean;
  providerType: 'local' | 'cloud' | 'unconfigured';
  model: string;
  endpointHost: string | null;
  modelAvailable: boolean;
  availableModels: string[];
  latencyMs: number | null;
  message: string;
}

export type MockAiHandler = (params: {
  systemPrompt: string;
  userPrompt: string;
}) => Promise<unknown> | unknown;

let mockAiHandler: MockAiHandler | null = null;

export function setMockAiCompletion(handler: MockAiHandler | null): void {
  mockAiHandler = handler;
}

export function resetMockAiCompletion(): void {
  mockAiHandler = null;
}

/**
 * Determines whether a live OpenAI-compatible provider is configured.
 * Supports API-key providers (OpenAI, Groq, OpenRouter) as well as keyless local endpoints (Ollama).
 */
export function isLiveAiConfigured(): boolean {
  if (mockAiHandler) return true;
  const env = getEnv();
  return Boolean(env.AI_API_KEY || env.AI_BASE_URL);
}

/**
 * Probes the configured OpenAI-compatible provider (/models) to verify whether
 * a local LLM (e.g. Ollama) or cloud LLM is reachable and has the configured model.
 */
export async function checkAiProviderStatus(): Promise<AiProviderStatus> {
  if (mockAiHandler) {
    return {
      configured: true,
      connected: true,
      providerType: 'local',
      model: 'mock-ai-model',
      endpointHost: 'mock://in-memory',
      modelAvailable: true,
      availableModels: ['mock-ai-model'],
      latencyMs: 1,
      message: 'Mock AI handler is active.',
    };
  }

  const env = getEnv();
  const baseUrl = env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = env.AI_MODEL || 'gpt-4o-mini';

  if (!env.AI_API_KEY && !env.AI_BASE_URL) {
    return {
      configured: false,
      connected: false,
      providerType: 'unconfigured',
      model: 'echoes-local-heuristic',
      endpointHost: null,
      modelAvailable: false,
      availableModels: [],
      latencyMs: null,
      message: 'No AI endpoint configured. Using local heuristic fallback.',
    };
  }

  let endpointHost: string | null = null;
  let isLocal = false;
  try {
    const parsed = new URL(baseUrl);
    endpointHost = parsed.host;
    isLocal =
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '::1';
  } catch {
    endpointHost = baseUrl;
  }

  const providerType: 'local' | 'cloud' = isLocal ? 'local' : 'cloud';
  const modelsUrl = `${baseUrl.replace(/\/+$/, '')}/models`;
  const headers: Record<string, string> = {};
  if (env.AI_API_KEY) {
    headers.Authorization = `Bearer ${env.AI_API_KEY}`;
  }

  const start = Date.now();
  try {
    const res = await fetch(modelsUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(4000),
    });
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        configured: true,
        connected: false,
        providerType,
        model,
        endpointHost,
        modelAvailable: false,
        availableModels: [],
        latencyMs,
        message:
          res.status === 401 || res.status === 403
            ? `Provider rejected credentials (HTTP ${res.status}).`
            : `Provider returned HTTP ${res.status}.`,
      };
    }

    const json = (await res.json().catch(() => null)) as {
      data?: Array<{ id?: string }>;
    } | null;
    const availableModels = Array.isArray(json?.data)
      ? json.data
          .map((m) => (typeof m?.id === 'string' ? m.id : ''))
          .filter(Boolean)
      : [];

    const modelAvailable =
      availableModels.length === 0 ||
      availableModels.some((id) => id === model || id.startsWith(`${model}:`));

    return {
      configured: true,
      connected: true,
      providerType,
      model,
      endpointHost,
      modelAvailable,
      availableModels: availableModels.slice(0, 12),
      latencyMs,
      message: modelAvailable
        ? `Connected to ${isLocal ? 'local LLM' : 'AI provider'} (${model}) in ${latencyMs}ms.`
        : `Connected to ${endpointHost}, but model "${model}" was not found in /models.`,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const reason = err instanceof Error ? err.message : 'Connection refused';
    return {
      configured: true,
      connected: false,
      providerType,
      model,
      endpointHost,
      modelAvailable: false,
      availableModels: [],
      latencyMs,
      message: isLocal
        ? `Local LLM unreachable at ${endpointHost}. Start Ollama (ollama serve) to enable live AI.`
        : `AI provider unreachable (${reason}).`,
    };
  }
}

/**
 * Extracts valid JSON from an LLM completion string, stripping optional markdown fences
 * or surrounding prose returned by smaller local models.
 */
function parseJsonFromCompletion(rawText: string): unknown {
  const trimmed = rawText.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Model response did not contain valid JSON.');
  }
}

async function callOpenAiCompatibleChat(params: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  useJsonResponseFormat: boolean;
  temperature?: number;
}): Promise<string> {
  const endpoint = `${params.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (params.apiKey) {
    headers.Authorization = `Bearer ${params.apiKey}`;
  }

  const payload: Record<string, unknown> = {
    model: params.model,
    temperature: params.temperature ?? 0.4,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userPrompt },
    ],
  };

  if (params.useJsonResponseFormat) {
    payload.response_format = { type: 'json_object' };
  }

  const isLocalEndpoint =
    params.baseUrl.includes('127.0.0.1') || params.baseUrl.includes('localhost');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(isLocalEndpoint ? 90000 : 30000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const err = new Error(
      `AI provider returned HTTP ${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : ''}`
    ) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('AI provider returned an empty completion.');
  }

  return content;
}

/**
 * Generates a Zod-validated structured JSON response from an OpenAI-compatible chat endpoint,
 * automatically falling back to a deterministic local heuristic if unconfigured or unavailable.
 */
export async function generateStructuredCompletion<T>(options: {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  fallback: () => T;
  temperature?: number;
}): Promise<AiCompletionResult<T>> {
  const { systemPrompt, userPrompt, schema, fallback, temperature } = options;

  if (mockAiHandler) {
    try {
      const mockRaw = await mockAiHandler({ systemPrompt, userPrompt });
      const parsed =
        typeof mockRaw === 'string' ? parseJsonFromCompletion(mockRaw) : mockRaw;
      const validated = schema.parse(parsed);
      return {
        data: validated,
        mode: 'ai',
        model: 'mock-ai-model',
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mock AI handler failed';
      return {
        data: fallback(),
        mode: 'heuristic',
        model: 'echoes-local-heuristic',
        warning: `Mock AI failed (${msg}); using local heuristic fallback.`,
      };
    }
  }

  const env = getEnv();
  const baseUrl = env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = env.AI_MODEL || 'gpt-4o-mini';

  if (!env.AI_API_KEY && !env.AI_BASE_URL) {
    return {
      data: fallback(),
      mode: 'heuristic',
      model: 'echoes-local-heuristic',
      warning:
        'Live AI is not configured yet. Showing ECHOES local heuristic analysis (set AI_API_KEY or AI_BASE_URL in .env.local for LLM output).',
    };
  }

  try {
    let rawContent: string;
    try {
      rawContent = await callOpenAiCompatibleChat({
        baseUrl,
        apiKey: env.AI_API_KEY,
        model,
        systemPrompt,
        userPrompt,
        useJsonResponseFormat: true,
        temperature,
      });
    } catch (firstErr: unknown) {
      // Retry once without response_format in case a local model / proxy rejects json_object
      const status = (firstErr as { status?: number })?.status;
      if (status === 400 || status === 422) {
        rawContent = await callOpenAiCompatibleChat({
          baseUrl,
          apiKey: env.AI_API_KEY,
          model,
          systemPrompt,
          userPrompt,
          useJsonResponseFormat: false,
          temperature,
        });
      } else {
        throw firstErr;
      }
    }

    const parsedJson = parseJsonFromCompletion(rawContent);
    const validated = schema.parse(parsedJson);

    return {
      data: validated,
      mode: 'ai',
      model,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI error';
    console.warn('[AI Client] Falling back to local heuristic:', message);
    return {
      data: fallback(),
      mode: 'heuristic',
      model: 'echoes-local-heuristic',
      warning: `Live AI unavailable (${message}). Showing local heuristic analysis.`,
    };
  }
}

