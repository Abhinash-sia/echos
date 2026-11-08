import nodemailer, { Transporter } from 'nodemailer';
import { getEnv } from '@/lib/env';

let customTransporter: Transporter | null = null;

/**
 * Allows automated tests to inject a mock transporter.
 */
export function setTestTransporter(transporter: Transporter | null): void {
  customTransporter = transporter;
}

/**
 * Resets the transporter to default environment configuration.
 */
export function resetTestTransporter(): void {
  customTransporter = null;
}

/**
 * Returns a configured Nodemailer Transporter instance.
 */
export function getTransporter(): Transporter {
  if (customTransporter) {
    return customTransporter;
  }

  const env = getEnv();

  // If SMTP host is configured, use SMTP
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  // Fallback to json transport or console transport in development/test when SMTP is not configured
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Dispatches an email via the active Nodemailer transporter.
 * Catches errors gracefully without unhandled promise rejections.
 */
export async function sendEmail(options: SendMailOptions): Promise<SendMailResult> {
  const env = getEnv();
  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown mailer error';
    // Log safe error message without credentials
    console.error(`[EmailService] Failed to send email to recipient: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
