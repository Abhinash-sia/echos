import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { registerSchema } from '@/validations/auth';
import { hashPassword } from '@/lib/auth/password';
import { signAuthToken } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/cookies';
import { sendWelcomeEmail } from '@/lib/email/service';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, 'register', 5, 3600); // 5 attempts per hour
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many registration attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
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

    const validation = registerSchema.safeParse(body);
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

    const { name, email, password } = validation.data;

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      passwordHash,
      tokenVersion: 0,
    });

    const token = await signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    // Send welcome email (handles failures gracefully without throwing)
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error('[Register] Welcome email trigger failed:', err);
    });

    const safeUser = user.toJSON();

    const response = NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        data: {
          user: safeUser,
          token,
        },
      },
      { status: 201 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('[Register] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred during registration.' },
      { status: 500 }
    );
  }
}
