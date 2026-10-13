import type { PostgresService, QueryExecutionResult } from '../infrastructure/db/postgres.js';
import type { ILlmClient } from '../infrastructure/llm/geminiClient.js';
import { buildRetryPrompt } from '../prompts/retryPrompt.js';
import { ReadOnlyViolationError, AppError } from '../infrastructure/errors/appError.js';
import { ERROR_CODES } from '../config/constants.js';

export interface ExecutionWithRetryResult {
  finalSql: string;
  queryResult: QueryExecutionResult;
  retryAttempts: number;
  retryHistory: Array<{ attempt: number; failedSql: string; error: string; fixedSql?: string }>;
}

export class QueryExecutorService {
  private readonly db: PostgresService;
  private readonly llm: ILlmClient;
  private readonly maxRetries: number;

  constructor(db: PostgresService, llm: ILlmClient, maxRetries = 3) {
    this.db = db;
    this.llm = llm;
    this.maxRetries = maxRetries;
  }

  public validateSafeSql(sql: string): string {
    const trimmed = sql.trim().replace(/;+\s*$/, ''); // strip trailing semicolon

    // Prevent multi-statement query
    if (trimmed.includes(';')) {
      throw new ReadOnlyViolationError('Không cho phép thực thi nhiều câu lệnh cùng lúc (chứa dấu chấm phẩy).');
    }

    // Check query type
    const upper = trimmed.toUpperCase();
    const isSelect = upper.startsWith('SELECT') || upper.startsWith('WITH');
    if (!isSelect) {
      throw new ReadOnlyViolationError('Chỉ cho phép thực thi câu lệnh đọc dữ liệu (SELECT).');
    }

    // Explicit blacklist check for safety
    const forbiddenKeywords = [
      'DELETE',
      'DROP',
      'UPDATE',
      'INSERT',
      'ALTER',
      'TRUNCATE',
      'GRANT',
      'REVOKE',
      'CREATE',
    ];
    for (const kw of forbiddenKeywords) {
      // match word boundary
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(trimmed)) {
        throw new ReadOnlyViolationError(`Phát hiện từ khóa nguy hiểm bị cấm: ${kw}`);
      }
    }

    return trimmed;
  }

  public async executeWithRetry(
    originalQuestion: string,
    initialSql: string,
    systemPrompt: string
  ): Promise<ExecutionWithRetryResult> {
    let currentSql = this.validateSafeSql(initialSql);
    const retryHistory: ExecutionWithRetryResult['retryHistory'] = [];

    // First execution attempt
    try {
      const queryResult = await this.db.executeReadOnlyQuery(currentSql);
      return {
        finalSql: currentSql,
        queryResult,
        retryAttempts: 0,
        retryHistory: [],
      };
    } catch (initialError: unknown) {
      const isSyntaxOrDbQuery =
        initialError instanceof AppError && initialError.code === ERROR_CODES.DB_QUERY_ERROR;

      // If it's a connection failure or security refusal, don't waste LLM tokens retrying
      if (!isSyntaxOrDbQuery) {
        throw initialError;
      }

      let lastError = initialError.message;
      let attempt = 1;

      while (attempt <= this.maxRetries) {
        retryHistory.push({
          attempt,
          failedSql: currentSql,
          error: lastError,
        });

        console.log(`[QueryExecutor] SQL failed: "${lastError}". Retrying (${attempt}/${this.maxRetries})...`);

        try {
          const retryPrompt = buildRetryPrompt({
            originalQuestion,
            failedSql: currentSql,
            errorMessage: lastError,
            attemptNumber: attempt,
            maxAttempts: this.maxRetries,
          });

          const corrected = await this.llm.generateSql(systemPrompt, retryPrompt);

          if (!corrected.sql) {
            throw new AppError(
              ERROR_CODES.DB_QUERY_ERROR,
              `AI không thể sửa lỗi truy vấn: ${corrected.reasoning || lastError}`,
              400,
              lastError
            );
          }

          currentSql = this.validateSafeSql(corrected.sql);
          retryHistory[retryHistory.length - 1].fixedSql = currentSql;

          // Attempt running the corrected SQL
          const queryResult = await this.db.executeReadOnlyQuery(currentSql);

          console.log(`[QueryExecutor] Successfully recovered on retry attempt ${attempt}!`);
          return {
            finalSql: currentSql,
            queryResult,
            retryAttempts: attempt,
            retryHistory,
          };
        } catch (retryError: unknown) {
          if (retryError instanceof AppError && retryError.code === ERROR_CODES.DB_QUERY_ERROR) {
            lastError = retryError.message;
            attempt++;
          } else {
            // Unrecoverable error (e.g. DB connection dropped, or LLM quota exceeded)
            throw retryError;
          }
        }
      }

      throw new AppError(
        ERROR_CODES.DB_QUERY_ERROR,
        `Truy vấn thất bại sau ${this.maxRetries} lần tự động sửa lỗi: ${lastError}`,
        400,
        lastError
      );
    }
  }
}
