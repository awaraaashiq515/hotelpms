/**
 * vitest.config.ts
 * WP-0.0: Test suite configuration
 */
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', '.next', 'tests', 'prisma', 'electron', 'android'],
    },
    include: [
      'tests/unit/**/*.spec.ts',
      'tests/integration/**/*.spec.ts',
      'tests/regression/**/*.spec.ts',
    ],
    exclude: ['tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
