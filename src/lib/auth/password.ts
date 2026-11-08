import bcrypt from 'bcrypt';
import crypto from 'crypto';

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Generates a bcrypt hash for a plaintext password.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 */
export async function comparePassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Generates a cryptographically secure random reset token.
 * Returns the raw token (to be sent via email) and its SHA-256 hash (to be stored in the database).
 */
export function generatePasswordResetToken(): { rawToken: string; hashedToken: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(rawToken);
  return { rawToken, hashedToken };
}

/**
 * Hashes a raw token with SHA-256 for secure comparison against the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
