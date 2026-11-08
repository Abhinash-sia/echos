import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/guard';
import { changePasswordSchema } from '@/validations/auth';
import { comparePassword, hashPassword } from '@/lib/auth/password';
import { signAuthToken } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/cookies';
import { sendPasswordChangedEmail } from '@/lib/email/service';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function PATCH(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, 'change-password', 5, 900); // 5 attempts per 15 minutes
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password change attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        { status: auth.status }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload in request body.' },
        { status: 400 }
      );
    }

    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;
    const user = auth.user;

    const isCurrentPasswordCorrect = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordCorrect) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect current password.',
        },
        { status: 400 }
      );
    }

    // Hash new password and increment tokenVersion to invalidate all other active sessions
    user.passwordHash = await hashPassword(newPassword);
    user.tokenVersion += 1;
    await user.save();

    // Mint a new token with the updated tokenVersion for the current session
    const newToken = await signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    // Send confirmation email asynchronously
    sendPasswordChangedEmail(user.email, user.name).catch((err) => {
      console.error('[ChangePassword] Confirmation email failed:', err);
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully.',
        data: {
          token: newToken,
        },
      },
      { status: 200 }
    );

    setAuthCookie(response, newToken);
    return response;
  } catch (error) {
    console.error('[ChangePassword] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while changing password.' },
      { status: 500 }
    );
  }
}
