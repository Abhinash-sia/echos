import { getEnv } from '@/lib/env';
import { sendEmail, SendMailResult } from './mailer';
import {
  getWelcomeEmailTemplate,
  getPasswordResetEmailTemplate,
  getPasswordChangedEmailTemplate,
} from './templates';

export async function sendWelcomeEmail(to: string, name: string): Promise<SendMailResult> {
  const template = getWelcomeEmailTemplate(name);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  rawResetToken: string
): Promise<SendMailResult> {
  const env = getEnv();
  const resetUrl = `${env.APP_URL}/auth/reset-password?token=${encodeURIComponent(rawResetToken)}`;
  const template = getPasswordResetEmailTemplate(name, resetUrl);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendPasswordChangedEmail(to: string, name: string): Promise<SendMailResult> {
  const template = getPasswordChangedEmailTemplate(name);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
