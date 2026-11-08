import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApi } from '@/lib/api/auth';
import { changePasswordSchema } from '@/validations/auth';
import { ToastItem, ToastType } from '@/components/ui/Toast';
import * as UI from '@/components/ui';

describe('Stage 6: Settings, Profile & Shared UI Components Unit Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Change Password Validation Schema', () => {
    it('accepts valid password change payload', () => {
      const valid = changePasswordSchema.safeParse({
        currentPassword: 'CurrentPassword1',
        newPassword: 'BrandNewPassword2',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects empty current password', () => {
      const invalid = changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'BrandNewPassword2',
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toContain('Current password cannot be empty');
      }
    });

    it('rejects new password under 8 characters', () => {
      const invalid = changePasswordSchema.safeParse({
        currentPassword: 'CurrentPassword1',
        newPassword: 'Short1',
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues.some((i) => i.message.includes('at least 8 characters'))).toBe(
          true
        );
      }
    });

    it('rejects new password without complexity requirements (missing digit/upper/lower)', () => {
      const invalid = changePasswordSchema.safeParse({
        currentPassword: 'CurrentPassword1',
        newPassword: 'alllowercasenonumbers',
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues.some((i) => i.message.includes('uppercase'))).toBe(true);
      }
    });

    it('rejects new password if identical to current password', () => {
      const invalid = changePasswordSchema.safeParse({
        currentPassword: 'IdenticalPassword1',
        newPassword: 'IdenticalPassword1',
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(
          invalid.error.issues.some((i) =>
            i.message.includes('must be different from current password')
          )
        ).toBe(true);
      }
    });
  });

  describe('Auth API: changePassword client integration', () => {
    it('calls PATCH /api/auth/change-password with correct payload and headers', async () => {
      const mockResponse = {
        success: true,
        message: 'Password changed successfully.',
        data: { token: 'new-jwt-token' },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await authApi.changePassword({
        currentPassword: 'OldPassword123',
        newPassword: 'NewSecurePassword456',
      });

      const [url, options] = vi.mocked(global.fetch).mock.calls[0];
      expect(url).toBe('/api/auth/change-password');
      expect(options?.method).toBe('PATCH');
      expect((options?.headers as Headers).get('Content-Type')).toBe('application/json');
      expect(options?.body).toBe(
        JSON.stringify({
          currentPassword: 'OldPassword123',
          newPassword: 'NewSecurePassword456',
        })
      );
      expect(result).toBe('Password changed successfully.');
    });

    it('propagates API error message on change password rejection', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          success: false,
          error: 'Incorrect current password.',
        }),
      });

      await expect(
        authApi.changePassword({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewSecurePassword456',
        })
      ).rejects.toThrow('Incorrect current password.');
    });

    it('accurately identifies rate limiting on 429 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          success: false,
          error: 'Too many password change attempts. Please try again in 900 seconds.',
        }),
      });

      await expect(
        authApi.changePassword({
          currentPassword: 'Password123',
          newPassword: 'NewPassword456',
        })
      ).rejects.toThrow(/Too many password change attempts/);
    });
  });

  describe('Toast Notification Data Structure', () => {
    it('constructs correct toast item payload', () => {
      const item: ToastItem = {
        id: 'toast-1',
        type: 'success',
        title: 'Memory Archived',
        message: 'Your memory has been stored in the vault.',
        duration: 4500,
      };

      expect(item.id).toBe('toast-1');
      expect(item.type).toBe('success');
      expect(item.title).toBe('Memory Archived');
      expect(item.duration).toBe(4500);
    });

    it('supports all required toast feedback types', () => {
      const validTypes: ToastType[] = ['success', 'error', 'info', 'warning'];
      validTypes.forEach((t) => {
        expect(['success', 'error', 'info', 'warning']).toContain(t);
      });
    });
  });

  describe('Auth API: forgotPassword client integration', () => {
    it('calls POST /api/auth/forgot-password with target email', async () => {
      const mockResponse = {
        success: true,
        message:
          'If an account with that email address exists, a password reset link has been sent.',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await authApi.forgotPassword({
        email: 'archivist@vault.org',
      });

      const [url, options] = vi.mocked(global.fetch).mock.calls[0];
      expect(url).toBe('/api/auth/forgot-password');
      expect(options?.method).toBe('POST');
      expect(options?.body).toBe(JSON.stringify({ email: 'archivist@vault.org' }));
      expect(result).toBe(mockResponse.message);
    });

    it('handles rate limiting on password recovery gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          success: false,
          error: 'Too many password reset requests. Please try again in 3600 seconds.',
        }),
      });

      await expect(authApi.forgotPassword({ email: 'archivist@vault.org' })).rejects.toThrow(
        /Too many password reset requests/
      );
    });
  });

  describe('Shared UI Barrel Exports', () => {
    it('exports all consolidated UI primitives from @/components/ui', () => {
      expect(UI.Button).toBeDefined();
      expect(UI.Input).toBeDefined();
      expect(UI.Textarea).toBeDefined();
      expect(UI.Select).toBeDefined();
      expect(UI.DatePicker).toBeDefined();
      expect(UI.Modal).toBeDefined();
      expect(UI.ConfirmationDialog).toBeDefined();
      expect(UI.Toast).toBeDefined();
      expect(UI.Skeleton).toBeDefined();
      expect(UI.EmptyState).toBeDefined();
      expect(UI.ErrorState).toBeDefined();
      expect(UI.Tooltip).toBeDefined();
      expect(UI.Card).toBeDefined();
      expect(UI.Badge).toBeDefined();
    });
  });
});
