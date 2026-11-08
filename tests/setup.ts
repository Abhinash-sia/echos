import { beforeAll, afterAll } from 'vitest';

// Configure test environment variables
(process.env as unknown as Record<string, string | undefined>).NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/echoes_test';
process.env.APP_URL = 'http://localhost:3000';
process.env.JWT_SECRET = 'test_secret_key_minimum_32_characters_for_unit_tests';
process.env.JWT_EXPIRES_IN = '1h';

beforeAll(() => {
  // Global test setup if needed
});

afterAll(() => {
  // Global test teardown if needed
});
