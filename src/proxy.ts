import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth/cookies';
import { verifyAuthToken } from '@/lib/auth/jwt';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/memories',
  '/capsules',
  '/timeline',
  '/board',
  '/profile',
  '/settings',
  '/app',
];
const AUTH_ROUTES = ['/login', '/register'];

/**
 * Next.js 16 Proxy
 * Enforces server-side authentication boundary before route rendering.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

  // Quick exit if route is not protected and not an auth route
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  const payload = token ? await verifyAuthToken(token) : null;
  const isAuthenticated = Boolean(payload && payload.userId);

  // If attempting to access protected route without valid session -> redirect to /login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and accessing login/register -> redirect to /dashboard
  if (isAuthRoute && isAuthenticated && !request.nextUrl.searchParams.has('from')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/memories/:path*',
    '/capsules/:path*',
    '/timeline/:path*',
    '/board/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/app/:path*',
    '/login',
    '/register',
  ],
};
