import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { getTokenFromRequest, clearAuthCookie, AUTH_COOKIE_NAME } from '@/lib/auth/cookies';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { validateCsrf } from '@/lib/auth/guard';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const hasBearerHeader = authHeader?.toLowerCase().startsWith('bearer ') ?? false;
    const isCookieAuth =
      !hasBearerHeader && (request.headers.get('cookie')?.includes(AUTH_COOKIE_NAME) ?? false);

    if (!validateCsrf(request, isCookieAuth)) {
      return NextResponse.json(
        { success: false, error: 'Cross-origin logout request blocked (CSRF protection).' },
        { status: 403 }
      );
    }

    const token = getTokenFromRequest(request);

    // If an active token is presented, increment tokenVersion to revoke it server-side
    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload?.userId) {
        await connectToDatabase();
        await User.findByIdAndUpdate(payload.userId, {
          $inc: { tokenVersion: 1 },
        });
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );

    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error('[Logout] Error during logout:', error);
    // Still clear the cookie even if database operation failed
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
    clearAuthCookie(response);
    return response;
  }
}
