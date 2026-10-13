import { describe, it, expect, vi } from 'vitest';
import { QueryExecutorService } from '../../src/services/queryExecutor.js';
import type { PostgresService, QueryExecutionResult } from '../../src/infrastructure/db/postgres.js';
import type { ILlmClient, LlmSqlOutput } from '../../src/infrastructure/llm/geminiClient.js';
import { ReadOnlyViolationError, AppError, DbConnectionError } from '../../src/infrastructure/errors/appError.js';
import { ERROR_CODES } from '../../src/config/constants.js';

describe('QueryExecutorService', () => {
  const dummyResult: QueryExecutionResult = {
    rows: [{ count: 10 }],
    fields: ['count'],
    rowCount: 1,
    durationMs: 5,
    truncated: false,
    totalRowCount: 1,
  };

  const createMockDb = () =>
    ({
      executeReadOnlyQuery: vi.fn(),
    }) as unknown as PostgresService;

  const createMockLlm = () =>
    ({
      generateSql: vi.fn(),
    }) as unknown as ILlmClient;

  describe('validateSafeSql', () => {
    it('should allow valid SELECT and CTE queries', () => {
      const service = new QueryExecutorService(createMockDb(), createMockLlm());
      expect(service.validateSafeSql('SELECT * FROM customers')).toBe('SELECT * FROM customers');
      expect(service.validateSafeSql('WITH t AS (SELECT 1) SELECT * FROM t')).toBe(
        'WITH t AS (SELECT 1) SELECT * FROM t'
      );
    });

    it('should reject multi-statement queries containing semicolons', () => {
      const service = new QueryExecutorService(createMockDb(), createMockLlm());
      expect(() => service.validateSafeSql('SELECT 1; SELECT 2')).toThrow(ReadOnlyViolationError);
    });

    it('should reject dangerous mutation keywords (DELETE, DROP, UPDATE, INSERT, ALTER)', () => {
      const service = new QueryExecutorService(createMockDb(), createMockLlm());
      expect(() => service.validateSafeSql('DELETE FROM orders')).toThrow(ReadOnlyViolationError);
      expect(() => service.validateSafeSql('DROP TABLE products')).toThrow(ReadOnlyViolationError);
      expect(() => service.validateSafeSql('UPDATE customers SET name = "x"')).toThrow(
        ReadOnlyViolationError
      );
      expect(() => service.validateSafeSql('INSERT INTO customers VALUES (1)')).toThrow(
        ReadOnlyViolationError
      );
    });
  });

  describe('executeWithRetry', () => {
    it('should execute successfully without retry on the first attempt', async () => {
      const mockDb = createMockDb();
      (mockDb.executeReadOnlyQuery as ReturnType<typeof vi.fn>).mockResolvedValueOnce(dummyResult);
      const mockLlm = createMockLlm();

      const service = new QueryExecutorService(mockDb, mockLlm, 3);
      const res = await service.executeWithRetry('Count customers', 'SELECT count(*) FROM customers', 'sys prompt');

      expect(res.retryAttempts).toBe(0);
      expect(res.queryResult).toEqual(dummyResult);
      expect(mockLlm.generateSql).not.toHaveBeenCalled();
    });

    it('should retry automatically when SQL syntax error occurs and succeed on recovery', async () => {
      const mockDb = createMockDb();
      // Fail on attempt 1, succeed on attempt 2
      (mockDb.executeReadOnlyQuery as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new AppError(ERROR_CODES.DB_QUERY_ERROR, 'syntax error at or near "FROMM"'))
        .mockResolvedValueOnce(dummyResult);

      const mockLlm = createMockLlm();
      const fixedLlmOutput: LlmSqlOutput = {
        reasoning: 'Fixed syntax error',
        sql: 'SELECT count(*) FROM customers',
        isAmbiguous: false,
        isRefusal: false,
        followUpQuestion: null,
      };
      (mockLlm.generateSql as ReturnType<typeof vi.fn>).mockResolvedValueOnce(fixedLlmOutput);

      const service = new QueryExecutorService(mockDb, mockLlm, 3);
      const res = await service.executeWithRetry(
        'Count customers',
        'SELECT count(*) FROMM customers',
        'sys prompt'
      );

      expect(res.retryAttempts).toBe(1);
      expect(res.finalSql).toBe('SELECT count(*) FROM customers');
      expect(res.retryHistory).toHaveLength(1);
      expect(mockLlm.generateSql).toHaveBeenCalledTimes(1);
    });

    it('should throw error after exhausting max 3 retries', async () => {
      const mockDb = createMockDb();
      (mockDb.executeReadOnlyQuery as ReturnType<typeof vi.fn>).mockRejectedValue(
        new AppError(ERROR_CODES.DB_QUERY_ERROR, 'persistent syntax error')
      );

      const mockLlm = createMockLlm();
      const fixedLlmOutput: LlmSqlOutput = {
        reasoning: 'Still trying to fix',
        sql: 'SELECT * FROM test',
        isAmbiguous: false,
        isRefusal: false,
        followUpQuestion: null,
      };
      (mockLlm.generateSql as ReturnType<typeof vi.fn>).mockResolvedValue(fixedLlmOutput);

      const service = new QueryExecutorService(mockDb, mockLlm, 3);

      await expect(
        service.executeWithRetry('Invalid query', 'SELECT * FROM bad_syntax', 'sys prompt')
      ).rejects.toThrow('Truy vấn thất bại sau 3 lần tự động sửa lỗi');

      expect(mockLlm.generateSql).toHaveBeenCalledTimes(3);
    });

    it('should NOT retry if error is DbConnectionError or ReadOnlyViolationError', async () => {
      const mockDb = createMockDb();
      (mockDb.executeReadOnlyQuery as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new DbConnectionError('Connection refused')
      );
      const mockLlm = createMockLlm();

      const service = new QueryExecutorService(mockDb, mockLlm, 3);

      await expect(
        service.executeWithRetry('Count customers', 'SELECT count(*) FROM customers', 'sys prompt')
      ).rejects.toThrow(DbConnectionError);

      expect(mockLlm.generateSql).not.toHaveBeenCalled();
    });
  });
});
