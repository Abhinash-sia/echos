import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Transporter } from 'nodemailer';
import { connectTestDb, closeTestDb, clearTestDb } from '../helpers/db-handler';
import { resetRateLimits } from '@/lib/security/rate-limit';
import { User } from '@/models/User';
import { setTestTransporter, resetTestTransporter } from '@/lib/email';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as meHandler } from '@/app/api/auth/me/route';
import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordHandler } from '@/app/api/auth/reset-password/route';
import { PATCH as changePasswordHandler } from '@/app/api/auth/change-password/route';
import { hashToken } from '@/lib/auth/password';

describe('Password Management Integration Tests', () => {
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

  describe('POST /api/auth/forgot-password', () => {
    it('should generate and save a hashed token for an existing user and return a generic response', async () => {
      // Create user
      await registerHandler(
        new Request('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Forgot User',
            email: 'forgot@example.com',
            password: 'OldPassword123!',
          }),
        })
      );
      resetRateLimits();

      const response = await forgotPasswordHandler(
        new Request('http://localhost:3000/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'forgot@example.com' }),
        })
      );

      const json = await response.json();
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain('If an account with that email address exists');

      // Verify token in DB is hashed and not plaintext
      const user = await User.findOne({ email: 'forgot@example.com' }).select(
        '+passwordResetTokenHash +passwordResetExpires'
      );
      expect(user?.passwordResetTokenHash).toBeDefined();
      expect(user?.passwordResetTokenHash).toHaveLength(64); // SHA-256 hex string
      expect(user?.passwordResetExpires).toBeDefined();
      expect(user!.passwordResetExpires!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return identical generic response for an unknown email address', async () => {
      const response = await forgotPasswordHandler(
        new Request('http://localhost:3000/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'nonexistent@example.com' }),
        })
      );

      const json = await response.json();
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain('If an account with that email address exists');
    });

    it('should rollback reset token if email delivery fails, ensuring no orphaned tokens', async () => {
      const sendMailMock = vi.fn().mockRejectedValue(new Error('SMTP connection rejected'));
      setTestTransporter({ sendMail: sendMailMock } as unknown as Transporter);

      await registerHandler(
        new Request('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Delivery Fail User',
            email: 'deliveryfail@example.com',
            password: 'Password123!',
          }),
        })
      );
      resetRateLimits();

      const response = await forgotPasswordHandler(
        new Request('http://localhost:3000/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'deliveryfail@example.com' }),
        })
      );

      expect(response.status).toBe(200);

      // Verify token was cleared upon delivery failure
      const user = await User.findOne({ email: 'deliveryfail@example.com' }).select(
        '+passwordResetTokenHash +passwordResetExpires'
      );
      expect(user?.passwordResetTokenHash).toBeNull();
      expect(user?.passwordResetExpires).toBeNull();

      resetTestTransporter();
    });
  });

  describe('POST /api/auth/reset-password', () => {
    const rawToken = 'testresettoken1234567890abcdef1234567890abcdef1234567890abcdef';
    const hashedToken = hashToken(rawToken);

    beforeEach(async () => {
      await registerHandler(
        new Request('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Reset Target',
            email: 'resettarget@example.com',
            password: 'OriginalPassword1!',
          }),
        })
      );

      await User.findOneAndUpdate(
        { email: 'resettarget@example.com' },
        {
          passwordResetTokenHash: hashedToken,
          passwordResetExpires: new Date(Date.now() + 3600000), // Valid for 1 hour
        }
      );
      resetRateLimits();
    });

    it('should successfully reset password with valid token and invalidate the token', async () => {
      const resetReq = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawToken,
          newPassword: 'BrandNewPassword123!',
        }),
      });

      const response = await resetPasswordHandler(resetReq);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);

      // Verify token is removed from database
      const user = await User.findOne({ email: 'resettarget@example.com' }).select(
        '+passwordResetTokenHash +passwordResetExpires'
      );
      expect(user?.passwordResetTokenHash).toBeNull();
      expect(user?.passwordResetExpires).toBeNull();

      // Verify old password no longer works
      const loginOldReq = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'resettarget@example.com',
          password: 'OriginalPassword1!',
        }),
      });
      const loginOldRes = await loginHandler(loginOldReq);
      expect(loginOldRes.status).toBe(401);

      // Verify new password works
      const loginNewReq = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'resettarget@example.com',
          password: 'BrandNewPassword123!',
        }),
      });
      const loginNewRes = await loginHandler(loginNewReq);
      expect(loginNewRes.status).toBe(200);
    });

    it('should reject reused reset tokens with 400 Bad Request', async () => {
      // First use succeeds
      const firstReq = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawToken,
          newPassword: 'BrandNewPassword123!',
        }),
      });
      await resetPasswordHandler(firstReq);

      // Second use with the same token should fail
      const secondReq = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawToken,
          newPassword: 'YetAnotherPassword123!',
        }),
      });
      const secondRes = await resetPasswordHandler(secondReq);
      expect(secondRes.status).toBe(400);
      const json = await secondRes.json();
      expect(json.error).toContain('Invalid or expired password reset token');
    });

    it('should reject expired reset tokens with 400 Bad Request', async () => {
      // Expire the token
      await User.findOneAndUpdate(
        { email: 'resettarget@example.com' },
        {
          passwordResetExpires: new Date(Date.now() - 1000), // Expired 1 second ago
        }
      );

      const request = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawToken,
          newPassword: 'BrandNewPassword123!',
        }),
      });

      const response = await resetPasswordHandler(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('Invalid or expired password reset token');
    });

    it('should atomically process concurrent reset requests with the same token so only one succeeds', async () => {
      const req1 = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawToken,
          newPassword: 'FirstConcurrentPass1!',
        }),
      });

      const req2 = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawToken,
          newPassword: 'SecondConcurrentPass2!',
        }),
      });

      const [res1, res2] = await Promise.all([
        resetPasswordHandler(req1),
        resetPasswordHandler(req2),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one request must succeed with 200, and the other must be rejected with 400
      expect(statuses).toEqual([200, 400]);
    });
  });

  describe('PATCH /api/auth/change-password', () => {
    let activeToken: string;

    beforeEach(async () => {
      const regRes = await registerHandler(
        new Request('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Change Password User',
            email: 'changepass@example.com',
            password: 'CurrentPassword123!',
          }),
        })
      );
      const json = await regRes.json();
      activeToken = json.data.token;
      resetRateLimits();
    });

    it('should reject request when unauthenticated with 401 Unauthorized', async () => {
      const request = new Request('http://localhost:3000/api/auth/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewUpdatedPassword456!',
        }),
      });

      const response = await changePasswordHandler(request);
      expect(response.status).toBe(401);
    });

    it('should reject request when current password is incorrect with 400 Bad Request', async () => {
      const request = new Request('http://localhost:3000/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'WrongCurrentPassword!',
          newPassword: 'NewUpdatedPassword456!',
        }),
      });

      const response = await changePasswordHandler(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Incorrect current password.');
    });

    it('should reject request when new password equals current password', async () => {
      const request = new Request('http://localhost:3000/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'CurrentPassword123!',
          newPassword: 'CurrentPassword123!',
        }),
      });

      const response = await changePasswordHandler(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Validation failed');
    });

    it('should successfully change password, invalidate prior sessions, and return new token', async () => {
      const changeReq = new Request('http://localhost:3000/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewUpdatedPassword456!',
        }),
      });

      const response = await changePasswordHandler(changeReq);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.token).toBeDefined();

      const newToken = json.data.token;
      expect(newToken).not.toBe(activeToken);

      // Verify that the OLD token is now rejected on protected routes
      const meWithOldToken = await meHandler(
        new Request('http://localhost:3000/api/auth/me', {
          method: 'GET',
          headers: { Authorization: `Bearer ${activeToken}` },
        })
      );
      expect(meWithOldToken.status).toBe(401);

      // Verify that the NEW token succeeds on protected routes
      const meWithNewToken = await meHandler(
        new Request('http://localhost:3000/api/auth/me', {
          method: 'GET',
          headers: { Authorization: `Bearer ${newToken}` },
        })
      );
      expect(meWithNewToken.status).toBe(200);
    });
  });
});
