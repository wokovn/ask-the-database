import { describe, it, expect, afterAll } from 'vitest';
import { PostgresService } from '../../src/infrastructure/db/postgres.js';
import { ReadOnlyViolationError } from '../../src/infrastructure/errors/appError.js';
import { config } from '../../src/config/env.js';

describe('PostgreSQL Real Integration Tests (Docker Container)', () => {
  const db = new PostgresService(config.databaseUrl, 5000, 100);

  afterAll(async () => {
    await db.close();
  });

  it('should successfully connect and pass health check', async () => {
    const health = await db.checkHealth();
    expect(health.connected).toBe(true);
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should query customers table correctly and return 100 count', async () => {
    const result = await db.executeReadOnlyQuery('SELECT COUNT(*) AS total FROM customers;');
    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0].total)).toBe(100);
    expect(result.truncated).toBe(false);
  });

  it('should query orders table correctly and return 700 count', async () => {
    const result = await db.executeReadOnlyQuery('SELECT COUNT(*) AS total FROM orders;');
    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0].total)).toBe(700);
  });

  it('MUST REJECT DELETE query and enforce read-only protection', async () => {
    await expect(
      db.executeReadOnlyQuery('DELETE FROM orders WHERE id = 1;')
    ).rejects.toThrow(ReadOnlyViolationError);
  });

  it('MUST REJECT DROP TABLE query and enforce read-only protection', async () => {
    await expect(
      db.executeReadOnlyQuery('DROP TABLE products;')
    ).rejects.toThrow(ReadOnlyViolationError);
  });

  it('should truncate results when rows exceed maxRows limit', async () => {
    // orders table has 700 rows, maxRows is 100
    const result = await db.executeReadOnlyQuery('SELECT * FROM orders;');
    expect(result.rowCount).toBe(100);
    expect(result.truncated).toBe(true);
    expect(result.totalRowCount).toBe(700);
  });
});
