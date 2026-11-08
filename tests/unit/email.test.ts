import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Transporter } from 'nodemailer';
import {
  getWelcomeEmailTemplate,
  getPasswordResetEmailTemplate,
  getPasswordChangedEmailTemplate,
  setTestTransporter,
  resetTestTransporter,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '@/lib/email';

describe('Email Subsystem Unit Tests', () => {
  beforeEach(() => {
    resetTestTransporter();
  });

  afterEach(() => {
    resetTestTransporter();
  });

  describe('Email Templates', () => {
    it('should generate welcome email template with escaped user name', () => {
      const template = getWelcomeEmailTemplate('Alex <script>alert(1)</script>');
      expect(template.subject).toContain('Welcome to Echoes');
      expect(template.html).toContain('Alex &lt;script&gt;alert(1)&lt;/script&gt;');
      expect(template.html).not.toContain('<script>');
      expect(template.text).toContain('Alex');
    });

    it('should generate password reset email template with reset URL', () => {
      const resetUrl = 'http://localhost:3000/auth/reset-password?token=secrettoken123';
      const template = getPasswordResetEmailTemplate('Sam', resetUrl);

      expect(template.subject).toContain('Password Reset Request');
      expect(template.html).toContain(resetUrl);
      expect(template.html).toContain('valid for 1 hour');
      expect(template.text).toContain(resetUrl);
    });

    it('should generate password changed confirmation email template', () => {
      const template = getPasswordChangedEmailTemplate('Jordan');

      expect(template.subject).toContain('Password Changed');
      expect(template.html).toContain('Password Successfully Changed');
      expect(template.html).toContain('invalidated');
      expect(template.text).toContain('recently changed');
    });
  });

  describe('Nodemailer Service with Mocked Transport', () => {
    it('should dispatch welcome email via mock transporter', async () => {
      const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'msg-welcome-123' });
      setTestTransporter({ sendMail: sendMailMock } as unknown as Transporter);

      const result = await sendWelcomeEmail('user@example.com', 'Alex');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-welcome-123');
      expect(sendMailMock).toHaveBeenCalledTimes(1);

      const sentCall = sendMailMock.mock.calls[0][0];
      expect(sentCall.to).toBe('user@example.com');
      expect(sentCall.subject).toContain('Welcome');
      expect(sentCall.html).toContain('Alex');
    });

    it('should dispatch password reset email with formatted link', async () => {
      const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'msg-reset-456' });
      setTestTransporter({ sendMail: sendMailMock } as unknown as Transporter);

      const result = await sendPasswordResetEmail('target@example.com', 'Taylor', 'rawtokenABC');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-reset-456');

      const sentCall = sendMailMock.mock.calls[0][0];
      expect(sentCall.to).toBe('target@example.com');
      expect(sentCall.subject).toContain('Password Reset');
      expect(sentCall.html).toContain('token=rawtokenABC');
    });

    it('should dispatch password changed confirmation email', async () => {
      const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'msg-changed-789' });
      setTestTransporter({ sendMail: sendMailMock } as unknown as Transporter);

      const result = await sendPasswordChangedEmail('target@example.com', 'Taylor');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-changed-789');

      const sentCall = sendMailMock.mock.calls[0][0];
      expect(sentCall.to).toBe('target@example.com');
      expect(sentCall.subject).toContain('Password Changed');
    });

    it('should gracefully handle and report SMTP delivery failure without throwing unhandled rejection', async () => {
      const sendMailMock = vi
        .fn()
        .mockRejectedValue(new Error('Connection timed out to SMTP server'));
      setTestTransporter({ sendMail: sendMailMock } as unknown as Transporter);

      const result = await sendEmail({
        to: 'failure@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection timed out');
    });
  });
});
