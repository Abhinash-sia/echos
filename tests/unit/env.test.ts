import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnv } from '@/lib/env';

describe('Environment Variable Validation (getEnv)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate and return environment variables when required fields are present', () => {
    delete process.env.JWT_EXPIRES_IN;
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/echoes_test';
    process.env.JWT_SECRET = 'a_very_secure_secret_key_that_is_at_least_32_characters!';
    (process.env as unknown as Record<string, string | undefined>).NODE_ENV = 'test';

    const env = getEnv();
    expect(env.MONGODB_URI).toBe('mongodb://127.0.0.1:27017/echoes_test');
    expect(env.JWT_SECRET).toBe('a_very_secure_secret_key_that_is_at_least_32_characters!');
    expect(env.JWT_EXPIRES_IN).toBe('7d');
    expect(env.NODE_ENV).toBe('test');
  });

  it('should throw an error when MONGODB_URI is missing', () => {
    delete process.env.MONGODB_URI;

    expect(() => getEnv()).toThrowError(/Environment validation failed/);
  });

  it('should throw an error when JWT_SECRET is shorter than 32 characters', () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/echoes_test';
    process.env.JWT_SECRET = 'too_short';

    expect(() => getEnv()).toThrowError(/JWT_SECRET must be at least 32 characters long/);
  });
});
