import pg from 'pg';
import {
  DbConnectionError,
  DbTimeoutError,
  ReadOnlyViolationError,
  AppError,
} from '../errors/appError.js';
import { ERROR_CODES } from '../../config/constants.js';

const { Pool } = pg;

export interface QueryExecutionResult {
  rows: Record<string, unknown>[];
  fields: string[];
  rowCount: number;
  durationMs: number;
  truncated: boolean;
  totalRowCount: number;
}

export class PostgresService {
  private pool: pg.Pool;
  private readonly queryTimeoutMs: number;
  private readonly maxRows: number;

  constructor(connectionString: string, queryTimeoutMs = 5000, maxRows = 100) {
    this.queryTimeoutMs = queryTimeoutMs;
    this.maxRows = maxRows;
    this.pool = new Pool({
      connectionString,
      statement_timeout: queryTimeoutMs,
      connectionTimeoutMillis: 4000,
      idleTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      console.error('[Postgres Pool Error]:', err.message);
    });
  }

  public async checkHealth(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1;');
        return { connected: true, latencyMs: Date.now() - start };
      } finally {
        client.release();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { connected: false, latencyMs: Date.now() - start, error: message };
    }
  }

  public async executeReadOnlyQuery(sql: string): Promise<QueryExecutionResult> {
    const startTime = Date.now();
    let client: pg.PoolClient | null = null;

    try {
      client = await this.pool.connect();

      // Ensure statement timeout and read only is active
      await client.query(`SET statement_timeout = ${this.queryTimeoutMs};`);
      await client.query('SET TRANSACTION READ ONLY;');

      const result = await client.query(sql);
      const durationMs = Date.now() - startTime;

      const fields = result.fields ? result.fields.map((f) => f.name) : [];
      const totalRowCount = result.rows.length;
      const truncated = totalRowCount > this.maxRows;
      const rows = truncated ? result.rows.slice(0, this.maxRows) : result.rows;

      return {
        rows,
        fields,
        rowCount: rows.length,
        durationMs,
        truncated,
        totalRowCount,
      };
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const durationMs = Date.now() - startTime;

      // Handle DB down / connection refused
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        throw new DbConnectionError(`Connection failed: ${err.message}`);
      }

      // Handle statement timeout
      if (err.code === '57014' || durationMs >= this.queryTimeoutMs) {
        throw new DbTimeoutError(`Query exceeded ${this.queryTimeoutMs}ms: ${err.message}`);
      }

      // Handle read only violation
      if (
        err.code === '25006' ||
        err.message?.includes('read-only transaction') ||
        err.message?.includes('permission denied')
      ) {
        throw new ReadOnlyViolationError(err.message);
      }

      // General SQL execution error
      throw new AppError(
        ERROR_CODES.DB_QUERY_ERROR,
        `Lỗi thực thi SQL: ${err.message || 'Lỗi không xác định'}`,
        400,
        err.message
      );
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
