import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../src/config/env.js';

describe('Environment Configuration Loader', () => {
  it('should load default configuration when optional env vars are missing', () => {
    const config = loadConfig();
    expect(config.port).toBeTypeOf('number');
    expect(config.port).toBeGreaterThan(0);
    expect(config.maxQueryRows).toBe(100);
    expect(config.queryTimeoutMs).toBe(5000);
    expect(config.maxRetryAttempts).toBe(3);
    expect(config.sessionTtlMs).toBe(1800000);
  });

  it('should prioritize environment variable overrides', () => {
    const originalPort = process.env.PORT;
    const originalMaxRows = process.env.MAX_QUERY_ROWS;

    try {
      process.env.PORT = '8080';
      process.env.MAX_QUERY_ROWS = '50';

      const config = loadConfig();
      expect(config.port).toBe(8080);
      expect(config.maxQueryRows).toBe(50);
    } finally {
      process.env.PORT = originalPort;
      process.env.MAX_QUERY_ROWS = originalMaxRows;
    }
  });
});
