import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateRequest } from '@/lib/auth/guard';
import { clearAuthCookie } from '@/lib/auth/cookies';

export async function GET(request: Request) {
  try {
    // Opt into dynamic execution during Next.js server runtime
    await headers();
  } catch {
    // Graceful fallback during unit test execution
  }

  const auth = await authenticateRequest(request);

  if (!auth.success) {
    const response = NextResponse.json(
      {
        success: false,
        error: auth.error,
      },
      { status: auth.status }
    );
    clearAuthCookie(response);
    return response;
  }

  const safeUser = auth.user.toJSON();

  return NextResponse.json(
    {
      success: true,
      data: {
        user: safeUser,
      },
    },
    { status: 200 }
  );
}
