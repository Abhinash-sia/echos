import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { checkAiProviderStatus } from '@/lib/ai/client';

/**
 * GET /api/ai/status
 * Reports live connectivity status for the configured local (Ollama) or cloud LLM endpoint.
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

    const status = await checkAiProviderStatus();

    return NextResponse.json(
      {
        success: true,
        data: status,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      typeof (error as { digest: unknown }).digest === 'string' &&
      ((error as { digest: string }).digest.startsWith('NEXT_PRERENDER_INTERRUPTED') ||
        (error as { digest: string }).digest.startsWith('DYNAMIC_SERVER_USAGE'))
    ) {
      throw error;
    }
    console.error('[AI Status GET] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check AI provider status.' },
      { status: 500 }
    );
  }
}

