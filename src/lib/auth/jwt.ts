import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { getEnv } from '@/lib/env';

export interface AuthTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  tokenVersion: number;
}

function getJwtSecretKey(): Uint8Array {
  const env = getEnv();
  const secret = env.JWT_SECRET || 'default_super_secret_key_minimum_32_characters_for_fallback!';
  return new TextEncoder().encode(secret);
}

/**
 * Signs a new JWT for an authenticated user with subject, email, and tokenVersion.
 */
export async function signAuthToken(payload: {
  userId: string;
  email: string;
  tokenVersion: number;
}): Promise<string> {
  const env = getEnv();
  const key = getJwtSecretKey();

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    tokenVersion: payload.tokenVersion,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN || '7d')
    .sign(key);
}

/**
 * Verifies and decodes a JWT token using jose.
 * Returns null if token is invalid, signature is malformed, or token has expired.
 */
export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const key = getJwtSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    if (!payload.userId || typeof payload.userId !== 'string') {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: (payload.email as string) || '',
      tokenVersion: typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0,
      ...payload,
    };
  } catch {
    return null;
  }
}
