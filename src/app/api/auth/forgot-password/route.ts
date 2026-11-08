import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { forgotPasswordSchema } from '@/validations/auth';
import { generatePasswordResetToken } from '@/lib/auth/password';
import { sendPasswordResetEmail } from '@/lib/email/service';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const GENERIC_RESPONSE = {
  success: true,
  message: 'If an account with that email address exists, a password reset link has been sent.',
};

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, 'forgot-password', 5, 3600); // 5 attempts per hour
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset requests. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
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

    const validation = forgotPasswordSchema.safeParse(body);
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

    const { email } = validation.data;

    await connectToDatabase();

    const user = await User.findOne({ email });

    // Always return generic response even if user is not found to prevent account enumeration
    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    const { rawToken, hashedToken } = generatePasswordResetToken();
    const tokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    user.passwordResetTokenHash = hashedToken;
    user.passwordResetExpires = tokenExpiration;
    await user.save();

    // Send reset email with raw unhashed token via Nodemailer
    const emailResult = await sendPasswordResetEmail(user.email, user.name, rawToken);
    if (!emailResult.success) {
      console.error('[ForgotPassword] Email dispatch failed:', emailResult.error);
      // Clean up token so failed delivery does not leave an unreachable token on the account
      user.passwordResetTokenHash = null;
      user.passwordResetExpires = null;
      await user.save();
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  } catch (error) {
    console.error('[ForgotPassword] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
