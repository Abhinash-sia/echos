import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApi } from '@/lib/api/auth';
import { proxy } from '@/proxy';
import { NextRequest } from 'next/server';
import { signAuthToken } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/auth/cookies';

describe('Auth API & Infrastructure', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('authApi methods', () => {
    it('login sends correct payload and extracts user', async () => {
      const mockUser = {
        _id: 'user_123',
        name: 'Grace Hopper',
        email: 'grace@navy.mil',
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            message: 'Logged in successfully',
            data: { user: mockUser, token: 'jwt.token.value' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await authApi.login({
        email: 'grace@navy.mil',
        password: 'Compiler123!',
      });

      expect(result.user.name).toBe('Grace Hopper');
      expect(result.user.email).toBe('grace@navy.mil');
    });

    it('register sends name, email, password and returns created user', async () => {
      const mockUser = {
        _id: 'user_456',
        name: 'Ada Lovelace',
        email: 'ada@analytical.org',
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            message: 'User registered successfully',
            data: { user: mockUser },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await authApi.register({
        name: 'Ada Lovelace',
        email: 'ada@analytical.org',
        password: 'BabbageEngine1!',
      });

      expect(result.user.name).toBe('Ada Lovelace');
    });

    it('getMe fetches current user profile without localStorage access', async () => {
      const mockUser = {
        _id: 'user_789',
        name: 'Alan Turing',
        email: 'alan@bletchley.uk',
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: { user: mockUser },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const user = await authApi.getMe();
      expect(user.name).toBe('Alan Turing');
    });

    it('logout posts to /api/auth/logout', async () => {
      let capturedMethod = '';

      global.fetch = vi.fn().mockImplementation((_url, init) => {
        capturedMethod = init.method;
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, message: 'Logged out successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      await authApi.logout();
      expect(capturedMethod).toBe('POST');
    });
  });

  describe('Next.js Proxy Server-Side Protection (Correction 1)', () => {
    it('redirects unauthenticated user accessing /dashboard to /login?from=/dashboard', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard');

      const response = await proxy(request);

      expect(response.status).toBe(307); // NextResponse.redirect
      const location = response.headers.get('location');
      expect(location).toContain('/login?from=%2Fdashboard');
    });

    it('allows access to /dashboard when valid echoes_token is present', async () => {
      const token = await signAuthToken({
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        tokenVersion: 0,
      });

      const request = new NextRequest('http://localhost:3000/dashboard', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=${token}`,
        },
      });

      const response = await proxy(request);
      // Not redirected, continues to next
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('redirects authenticated user accessing /login to /dashboard', async () => {
      const token = await signAuthToken({
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        tokenVersion: 0,
      });

      const request = new NextRequest('http://localhost:3000/login', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=${token}`,
        },
      });

      const response = await proxy(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/dashboard');
    });

    it('allows guest access to marketing and showcase routes without redirection', async () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });
});
