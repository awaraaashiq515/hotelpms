/**
 * tests/setup.ts
 * Global test setup for WP-0.0 suite
 */
import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
dotenv.config();

// Ensure we never accidentally run tests against production DB
beforeAll(() => {
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.includes('test') && !dbUrl.includes('dev.db') && !process.env.TEST_DB) {
    throw new Error(
      'TEST SAFETY: DATABASE_URL does not look like a test database. ' +
      'Set TEST_DB=1 to override or use a test-specific DATABASE_URL.'
    );
  }
});
