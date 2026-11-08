import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME } from '@/lib/auth/cookies';
import { verifyAuthToken, AuthTokenPayload } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User, SafeUser } from '@/models/User';

export interface ServerSession {
  user: SafeUser;
  tokenPayload: AuthTokenPayload;
}

/**
 * Retrieves the current session in Server Components and Route Handlers.
 * Returns null if no valid authenticated session exists.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return null;
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId);
    if (!user) {
      return null;
    }

    // Verify session revocation
    if (user.tokenVersion !== payload.tokenVersion) {
      return null;
    }

    return {
      user: user.toJSON() as SafeUser,
      tokenPayload: payload,
    };
  } catch (err) {
    console.error('[getServerSession] Error resolving session:', err);
    return null;
  }
}

/**
 * Server-side route boundary enforcement.
 * Enforces that a valid session exists on the server; redirects to /login otherwise.
 */
export async function requireServerAuth(returnTo?: string): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session) {
    const target = returnTo ? `/login?from=${encodeURIComponent(returnTo)}` : '/login';
    redirect(target);
  }
  return session;
}
