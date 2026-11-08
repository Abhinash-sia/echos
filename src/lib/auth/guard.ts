import { connectToDatabase } from '@/lib/db';
import { User, IUserDocument } from '@/models/User';
import { getTokenFromRequest, AUTH_COOKIE_NAME } from './cookies';
import { verifyAuthToken, AuthTokenPayload } from './jwt';

export type AuthResult =
  | { success: true; user: IUserDocument; tokenPayload: AuthTokenPayload }
  | { success: false; error: string; status: number };

const STATE_CHANGING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Validates CSRF safety for cookie-authenticated requests.
 * Requests utilizing custom Authorization Bearer headers are inherently immune to ambient CSRF attacks.
 */
export function validateCsrf(request: Request, isCookieAuth: boolean): boolean {
  if (!isCookieAuth || !STATE_CHANGING_METHODS.has(request.method.toUpperCase())) {
    return true;
  }

  // Sec-Fetch-Site browser header check (modern standard)
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite && secFetchSite === 'cross-site') {
    return false;
  }

  // Origin verification with fallback to Referer
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (host && originUrl.host !== host) {
        return false;
      }
    } catch {
      return false;
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (host && refererUrl.host !== host) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Authenticates an incoming API request using either an HTTP-only cookie or Bearer token.
 * Validates the token signature, expiration, database tokenVersion to enforce session revocation,
 * and defends against CSRF on cookie-authenticated state-changing operations.
 */
export async function authenticateRequest(request: Request): Promise<AuthResult> {
  await connectToDatabase();

  const authHeader = request.headers.get('authorization');
  const hasBearerHeader = authHeader?.toLowerCase().startsWith('bearer ') ?? false;

  const token = getTokenFromRequest(request);
  if (!token) {
    return {
      success: false,
      error: 'Authentication required. Please log in.',
      status: 401,
    };
  }

  // Check if authentication relies on ambient cookies
  const isCookieAuth =
    !hasBearerHeader && (request.headers.get('cookie')?.includes(AUTH_COOKIE_NAME) ?? false);

  if (!validateCsrf(request, isCookieAuth)) {
    return {
      success: false,
      error: 'Cross-origin state-changing request blocked (CSRF protection).',
      status: 403,
    };
  }

  const payload = await verifyAuthToken(token);
  if (!payload) {
    return {
      success: false,
      error: 'Invalid or expired session. Please log in again.',
      status: 401,
    };
  }

  const user = await User.findById(payload.userId).select('+passwordHash');
  if (!user) {
    return {
      success: false,
      error: 'User account not found.',
      status: 401,
    };
  }

  // Session invalidation check: tokenVersion must match current database record
  if (user.tokenVersion !== payload.tokenVersion) {
    return {
      success: false,
      error: 'Session has been invalidated. Please log in again.',
      status: 401,
    };
  }

  return {
    success: true,
    user,
    tokenPayload: payload,
  };
}
