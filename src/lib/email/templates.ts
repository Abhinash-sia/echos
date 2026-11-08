/**
 * Reusable HTML Email Templates for Echoes
 */

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
  max-width: 580px;
  margin: 0 auto;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #eaeaea;
`;

const headerHtml = `
  <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1e3a8a; margin: 0; font-size: 24px; letter-spacing: -0.5px;">ECHOES</h1>
    <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Digital Memory Vault & Personal Time Capsule</p>
  </div>
`;

const footerHtml = `
  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
    <p style="margin: 0;">This is an automated security notification from ECHOES. Please do not reply directly to this email.</p>
    <p style="margin: 4px 0 0 0;">If you did not initiate this action, please secure your account immediately.</p>
  </div>
`;

export function getWelcomeEmailTemplate(name: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Welcome to Echoes — Your Personal Digital Vault';
  const html = `
    <div style="${baseStyles}">
      ${headerHtml}
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Welcome, ${escapeHtml(name)}!</h2>
      <p>Thank you for creating an account on <strong>ECHOES</strong>. Your private sanctuary for preserving life stories, memories, and time-capsule letters is now ready.</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #334155;">
          <strong>What you can do next:</strong><br />
          • Document your first memory and attach photographs.<br />
          • Seal a time-capsule letter to your future self.<br />
          • Explore your personal chronological timeline.
        </p>
      </div>
      <p>We are honored to safeguard your most cherished moments.</p>
      <p style="margin-bottom: 0;">Warm regards,<br /><strong>The Echoes Team</strong></p>
      ${footerHtml}
    </div>
  `;
  const text = `Welcome to Echoes, ${name}!\n\nYour personal digital memory vault is ready. Start documenting your memories and sealing time capsules at your leisure.\n\nWarm regards,\nThe Echoes Team`;
  return { subject, html, text };
}

export function getPasswordResetEmailTemplate(
  name: string,
  resetUrl: string
): { subject: string; html: string; text: string } {
  const subject = 'Password Reset Request — Echoes';
  const html = `
    <div style="${baseStyles}">
      ${headerHtml}
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Password Reset Request</h2>
      <p>Hello ${escapeHtml(name)},</p>
      <p>We received a request to reset the password for your ECHOES account. To proceed, click the button below:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">Or paste this link into your browser:</p>
      <p style="font-size: 12px; color: #3b82f6; word-break: break-all; background-color: #f1f5f9; padding: 8px 12px; border-radius: 4px;">${escapeHtml(resetUrl)}</p>
      <p style="font-size: 13px; color: #dc2626; margin-top: 20px;"><strong>Notice:</strong> This password reset link is valid for 1 hour and can only be used once.</p>
      <p style="font-size: 13px; color: #64748b;">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
      ${footerHtml}
    </div>
  `;
  const text = `Hello ${name},\n\nA password reset request was received for your Echoes account.\n\nReset your password here: ${resetUrl}\n\nThis link is valid for 1 hour. If you did not make this request, you can ignore this email.`;
  return { subject, html, text };
}

export function getPasswordChangedEmailTemplate(name: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Security Alert: Password Changed — Echoes';
  const html = `
    <div style="${baseStyles}">
      ${headerHtml}
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Password Successfully Changed</h2>
      <p>Hello ${escapeHtml(name)},</p>
      <p>This is a confirmation that the password for your ECHOES account was recently changed.</p>
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #991b1b;">
          <strong>Did not make this change?</strong><br />
          If you did not authorize this password update, please reset your password immediately or contact your administrator.
        </p>
      </div>
      <p style="font-size: 13px; color: #64748b;">All other active sessions on your account have been automatically invalidated for your security.</p>
      ${footerHtml}
    </div>
  `;
  const text = `Hello ${name},\n\nThe password for your Echoes account was recently changed.\n\nIf you did not authorize this change, please reset your password immediately.`;
  return { subject, html, text };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
