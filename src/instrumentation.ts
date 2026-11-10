/**
 * Next.js server instrumentation hook.
 * Runs once on Node.js server startup to verify and monitor local MongoDB availability in development.
 */
export async function register(): Promise<void> {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PHASE !== 'phase-production-build'
  ) {
    const { startLocalMongoMonitor } = await import('@/lib/db');
    await startLocalMongoMonitor();
  }
}

