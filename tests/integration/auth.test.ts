import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, closeTestDb, clearTestDb } from '../helpers/db-handler';
import { resetRateLimits } from '@/lib/security/rate-limit';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { GET as meHandler } from '@/app/api/auth/me/route';
import { PATCH as changePasswordHandler } from '@/app/api/auth/change-password/route';
import { AUTH_COOKIE_NAME } from '@/lib/auth/cookies';

describe('Authentication API Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    resetRateLimits();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user and set HTTP-only cookie', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          password: 'Password123!',
        }),
      });

      const response = await registerHandler(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.user.name).toBe('Sarah Connor');
      expect(json.data.user.email).toBe('sarah@example.com');
      expect(json.data.user.passwordHash).toBeUndefined();
      expect(json.data.token).toBeDefined();

      // Verify HTTP-only cookie set
      const cookie = response.cookies.get(AUTH_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe(json.data.token);
      expect(cookie?.httpOnly).toBe(true);
    });

    it('should reject registration with a duplicate email address with 409 Conflict', async () => {
      // First registration
      const req1 = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Original User',
          email: 'duplicate@example.com',
          password: 'Password123!',
        }),
      });
      await registerHandler(req1);

      // Second registration with same email
      const req2 = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Imposter User',
          email: 'duplicate@example.com',
          password: 'Password123!',
        }),
      });
      const response = await registerHandler(req2);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.error).toContain('already exists');
    });

    it('should reject registration with weak password (missing uppercase or number)', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Weak Password User',
          email: 'weak@example.com',
          password: 'weakpassword',
        }),
      });

      const response = await registerHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a standard user for login tests
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Login Tester',
          email: 'login@example.com',
          password: 'SecurePassword123!',
        }),
      });
      await registerHandler(req);
      resetRateLimits();
    });

    it('should successfully log in with valid credentials and return token & cookie', async () => {
      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await loginHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe('login@example.com');
      expect(json.data.token).toBeDefined();

      const cookie = response.cookies.get(AUTH_COOKIE_NAME);
      expect(cookie?.value).toBe(json.data.token);
    });

    it('should reject login with incorrect password with 401 Unauthorized', async () => {
      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'WrongPassword999!',
        }),
      });

      const response = await loginHandler(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Invalid email or password.');
    });

    it('should reject login for non-existent email with 401 Unauthorized', async () => {
      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'unknown@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await loginHandler(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Invalid email or password.');
    });
  });

  describe('Protected Route: GET /api/auth/me', () => {
    let validToken: string;

    beforeEach(async () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Auth User',
          email: 'authme@example.com',
          password: 'Password123!',
        }),
      });
      const res = await registerHandler(req);
      const json = await res.json();
      validToken = json.data.token;
      resetRateLimits();
    });

    it('should allow access when authenticated via Authorization Bearer header', async () => {
      const request = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      const response = await meHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe('authme@example.com');
    });

    it('should allow access when authenticated via HTTP-only cookie', async () => {
      const request = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          Cookie: `${AUTH_COOKIE_NAME}=${validToken}`,
        },
      });

      const response = await meHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe('authme@example.com');
    });

    it('should reject access with 401 when authentication is missing', async () => {
      const request = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      const response = await meHandler(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Authentication required');
    });

    it('should reject access with 401 when token is malformed or invalid', async () => {
      const request = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid.token.garbage',
        },
      });

      const response = await meHandler(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Invalid or expired session');
    });
  });

  describe('POST /api/auth/logout & Session Revocation', () => {
    it('should clear the authentication cookie and invalidate the token server-side', async () => {
      // 1. Register and get token
      const regReq = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Logout Test',
          email: 'logout@example.com',
          password: 'Password123!',
        }),
      });
      const regRes = await registerHandler(regReq);
      const { data } = await regRes.json();
      const token = data.token;

      // 2. Verify token works before logout
      const meReqBefore = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const meResBefore = await meHandler(meReqBefore);
      expect(meResBefore.status).toBe(200);

      // 3. Perform logout
      const logoutReq = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const logoutRes = await logoutHandler(logoutReq);
      expect(logoutRes.status).toBe(200);

      const clearedCookie = logoutRes.cookies.get(AUTH_COOKIE_NAME);
      expect(clearedCookie?.maxAge).toBe(0);

      // 4. Verify previous token is now rejected on protected route due to tokenVersion increment
      const meReqAfter = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const meResAfter = await meHandler(meReqAfter);
      expect(meResAfter.status).toBe(401);
      const meJsonAfter = await meResAfter.json();
      expect(meJsonAfter.error).toContain('Session has been invalidated');
    });
  });

  describe('Security & CSRF Protection for Cookie Sessions', () => {
    let userCookie: string;

    beforeEach(async () => {
      const regReq = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'CSRF Target',
          email: 'csrf@example.com',
          password: 'Password123!',
        }),
      });
      const regRes = await registerHandler(regReq);
      const { data } = await regRes.json();
      userCookie = `${AUTH_COOKIE_NAME}=${data.token}`;
      resetRateLimits();
    });

    it('should reject cross-origin state-changing requests using cookie authentication with 403 Forbidden', async () => {
      const crossOriginReq = new Request('http://localhost:3000/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: userCookie,
          Origin: 'https://malicious-website.com',
          Host: 'localhost:3000',
        },
        body: JSON.stringify({
          currentPassword: 'Password123!',
          newPassword: 'AttackerPassword1!',
        }),
      });

      const response = await changePasswordHandler(crossOriginReq);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toContain('CSRF protection');
    });

    it('should reject state-changing requests when Sec-Fetch-Site indicates cross-site', async () => {
      const crossSiteReq = new Request('http://localhost:3000/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: userCookie,
          'Sec-Fetch-Site': 'cross-site',
        },
        body: JSON.stringify({
          currentPassword: 'Password123!',
          newPassword: 'AttackerPassword1!',
        }),
      });

      const response = await changePasswordHandler(crossSiteReq);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toContain('CSRF protection');
    });

    it('should allow legitimate same-origin state-changing requests with matching Host and Origin', async () => {
      const sameOriginReq = new Request('http://localhost:3000/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: userCookie,
          Origin: 'http://localhost:3000',
          Host: 'localhost:3000',
        },
        body: JSON.stringify({
          currentPassword: 'Password123!',
          newPassword: 'NewLegitPassword1!',
        }),
      });

      const response = await changePasswordHandler(sameOriginReq);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('should reject cross-origin logout requests using cookie authentication with 403 Forbidden', async () => {
      const crossOriginLogoutReq = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          Cookie: userCookie,
          Origin: 'https://malicious-site.org',
          Host: 'localhost:3000',
        },
      });

      const response = await logoutHandler(crossOriginLogoutReq);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toContain('CSRF protection');
    });
  });

  describe('Rate Limiting on Authentication Endpoints', () => {
    it('should rate-limit excessive change-password attempts with 429 Too Many Requests', async () => {
      // 1. Register a user
      const regRes = await registerHandler(
        new Request('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Rate Limit Target',
            email: 'ratelimitchange@example.com',
            password: 'InitialPassword1!',
          }),
        })
      );
      const { data } = await regRes.json();
      const token = data.token;
      resetRateLimits();

      // 2. Perform 5 allowed attempts
      for (let i = 0; i < 5; i++) {
        const req = new Request('http://localhost:3000/api/auth/change-password', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-real-ip': '198.51.100.99',
          },
          body: JSON.stringify({
            currentPassword: 'WrongPassword!',
            newPassword: 'AttemptPassword1!',
          }),
        });
        const res = await changePasswordHandler(req);
        // Expecting 400 because current password is wrong, but request is allowed by rate limiter
        expect(res.status).toBe(400);
      }

      // 3. 6th attempt should be blocked by rate limiter with 429
      const blockedReq = new Request('http://localhost:3000/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-real-ip': '198.51.100.99',
        },
        body: JSON.stringify({
          currentPassword: 'WrongPassword!',
          newPassword: 'AttemptPassword1!',
        }),
      });
      const blockedRes = await changePasswordHandler(blockedReq);
      expect(blockedRes.status).toBe(429);
      const blockedJson = await blockedRes.json();
      expect(blockedJson.error).toContain('Too many password change attempts');
    });
  });
});
