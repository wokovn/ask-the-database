import { describe, it, expect, vi, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { PostgresService } from '../../src/infrastructure/db/postgres.js';
import type { ILlmClient, LlmSqlOutput } from '../../src/infrastructure/llm/geminiClient.js';
import { config } from '../../src/config/env.js';

describe('HTTP API Integration Tests', () => {
  const db = new PostgresService(config.databaseUrl, 5000, 100);

  const mockLlm: ILlmClient = {
    generateSql: vi.fn().mockResolvedValue({
      reasoning: 'Đếm số lượng khách hàng',
      answer: 'Dưới đây là số lượng khách hàng hiện có:',
      sql: 'SELECT count(*) FROM customers',
      isAmbiguous: false,
      isRefusal: false,
      followUpQuestion: null,
    } as LlmSqlOutput),
  };

  const app = createApp({
    db,
    llm: mockLlm,
  });

  afterAll(async () => {
    await db.close();
  });

  describe('GET /api/health', () => {
    it('should return 200 with database health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.database.connected).toBe(true);
      expect(res.body.data.status).toBeDefined();
    });
  });

  describe('POST /api/chat', () => {
    it('should return 400 validation error when message is empty', async () => {
      const res = await request(app).post('/api/chat').send({ message: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should process user message and return SQL and real DB result', async () => {
      const res = await request(app).post('/api/chat').send({ message: 'How many customers are there?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sql).toBe('SELECT count(*) FROM customers');
      expect(res.body.data.queryResult).toBeDefined();
      expect(res.body.data.queryResult.rows).toHaveLength(1);
      expect(Number(res.body.data.queryResult.rows[0].count)).toBe(100);
    });
  });
});
