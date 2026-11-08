import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { resetPasswordSchema } from '@/validations/auth';
import { hashPassword, hashToken } from '@/lib/auth/password';
import { sendPasswordChangedEmail } from '@/lib/email/service';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, 'reset-password', 5, 3600); // 5 attempts per hour
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
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

    const validation = resetPasswordSchema.safeParse(body);
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

    const { token, newPassword } = validation.data;

    await connectToDatabase();

    const hashedToken = hashToken(token);
    const newPasswordHash = await hashPassword(newPassword);

    // Atomically find the user with matching valid token AND clear the token simultaneously.
    // This atomic operation guarantees race condition protection and prevents concurrent requests from reusing the token.
    const user = await User.findOneAndUpdate(
      {
        passwordResetTokenHash: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      },
      {
        $set: {
          passwordHash: newPasswordHash,
          passwordResetTokenHash: null,
          passwordResetExpires: null,
        },
        $inc: { tokenVersion: 1 },
      },
      { returnDocument: 'after' }
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired password reset token.',
        },
        { status: 400 }
      );
    }

    // Send confirmation email
    sendPasswordChangedEmail(user.email, user.name).catch((err) => {
      console.error('[ResetPassword] Confirmation email failed:', err);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ResetPassword] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred during password reset.' },
      { status: 500 }
    );
  }
}
