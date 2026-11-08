import net from 'net';

interface RateLimitRecord {
  timestamps: number[];
}

/**
 * In-memory storage for sliding window rate limiting.
 * LIMITATION NOTE:
 * This store is memory-local to the running Node.js process. In single-instance deployments
 * (standard for college minor project architecture), this is fully effective.
 * In horizontally-scaled multi-container clusters, this would be replaced with Redis/Memcached.
 */
const store = new Map<string, RateLimitRecord>();

/**
 * Resets the rate limit tracking store. Useful during automated testing.
 */
export function resetRateLimits(): void {
  store.clear();
}

/**
 * Validates whether a candidate string is a valid IPv4 or IPv6 address.
 * Uses Node's native net.isIP for RFC-compliant verification.
 */
function isValidIp(ip: string): boolean {
  if (ip === 'localhost' || ip === '::1') return true;
  return net.isIP(ip) !== 0;
}

/**
 * Securely extracts client IP address, prioritizing trusted reverse proxy headers
 * (cf-connecting-ip, x-real-ip) over untrusted client-supplied headers, and validates IP format
 * to prevent rate-limiting bypass via header spoofing.
 */
export function getClientIp(request: Request): string {
  // 1. Cloudflare proxy header (tamper-resistant)
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp && isValidIp(cfIp.trim())) {
    return cfIp.trim();
  }

  // 2. Nginx / reverse-proxy real IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  // 3. X-Forwarded-For: In standard reverse proxy configurations (Nginx, HAProxy, AWS ALB),
  // each proxy appends the incoming IP to the right end of the X-Forwarded-For list.
  // The leftmost entries can be arbitrarily spoofed by an external client.
  // Therefore, the closest (most trustworthy) upstream hop is the rightmost valid IP.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const candidates = forwarded.split(',').map((ip) => ip.trim());
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (isValidIp(candidates[i])) {
        return candidates[i];
      }
    }
  }

  return '127.0.0.1';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Enforces sliding-window rate limiting per composite key.
 * @param key - Client identifier (e.g. IP address or email)
 * @param action - Action namespace (e.g. 'login', 'forgot-password')
 * @param maxAttempts - Maximum allowed attempts within the window
 * @param windowSeconds - Window duration in seconds
 */
export function checkRateLimit(
  key: string,
  action: string,
  maxAttempts: number,
  windowSeconds: number
): RateLimitResult {
  const compositeKey = `${action}:${key}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const threshold = now - windowMs;

  const record = store.get(compositeKey) || { timestamps: [] };

  // Filter out timestamps outside the active sliding window
  const activeTimestamps = record.timestamps.filter((ts) => ts > threshold);

  if (activeTimestamps.length >= maxAttempts) {
    const oldest = activeTimestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  activeTimestamps.push(now);
  store.set(compositeKey, { timestamps: activeTimestamps });

  return {
    allowed: true,
    remaining: maxAttempts - activeTimestamps.length,
    retryAfterSeconds: 0,
  };
}
