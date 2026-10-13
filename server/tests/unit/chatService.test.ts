import { describe, it, expect, vi } from 'vitest';
import { ChatService } from '../../src/services/chatService.js';
import { SchemaService } from '../../src/services/schemaService.js';
import { InMemorySessionStore } from '../../src/infrastructure/session/sessionStore.js';
import type { ILlmClient, LlmSqlOutput } from '../../src/infrastructure/llm/geminiClient.js';
import type { QueryExecutorService } from '../../src/services/queryExecutor.js';
import { ValidationError } from '../../src/infrastructure/errors/appError.js';

describe('ChatService Orchestrator', () => {
  const createMockLlm = (output: LlmSqlOutput) =>
    ({
      generateSql: vi.fn().mockResolvedValue(output),
    }) as unknown as ILlmClient;

  const createMockExecutor = () =>
    ({
      executeWithRetry: vi.fn().mockResolvedValue({
        finalSql: 'SELECT count(*) FROM customers',
        queryResult: {
          rows: [{ count: 100 }],
          fields: ['count'],
          rowCount: 1,
          durationMs: 12,
          truncated: false,
          totalRowCount: 1,
        },
        retryAttempts: 0,
        retryHistory: [],
      }),
    }) as unknown as QueryExecutorService;

  it('should throw ValidationError if user message is empty or whitespace', async () => {
    const store = new InMemorySessionStore();
    const service = new ChatService(
      store,
      createMockLlm({ reasoning: '', sql: null, isAmbiguous: false, isRefusal: false, followUpQuestion: null }),
      new SchemaService(),
      createMockExecutor()
    );

    await expect(service.processMessage({ message: '   ' })).rejects.toThrow(ValidationError);
    store.destroy();
  });

  it('should handle refusal for destructive requests without running SQL', async () => {
    const store = new InMemorySessionStore();
    const mockLlm = createMockLlm({
      reasoning: 'Hệ thống ở chế độ chỉ đọc. Không thể xóa dữ liệu.',
      sql: null,
      isAmbiguous: false,
      isRefusal: true,
      followUpQuestion: null,
    });
    const mockExecutor = createMockExecutor();

    const service = new ChatService(store, mockLlm, new SchemaService(), mockExecutor);
    const result = await service.processMessage({ message: 'Delete all cancelled orders' });

    expect(result.isRefusal).toBe(true);
    expect(result.sql).toBeNull();
    expect(result.queryResult).toBeNull();
    expect(mockExecutor.executeWithRetry).not.toHaveBeenCalled();

    // Verify stored in session
    const session = store.getSession(result.sessionId);
    expect(session?.messages).toHaveLength(2); // user + assistant
    store.destroy();
  });

  it('should handle ambiguous question with followUpQuestion and query execution', async () => {
    const store = new InMemorySessionStore();
    const mockLlm = createMockLlm({
      reasoning: 'Mặc định tính sản phẩm có doanh thu cao nhất',
      sql: 'SELECT product_id FROM order_items GROUP BY product_id',
      isAmbiguous: true,
      isRefusal: false,
      followUpQuestion: 'Bạn muốn xem theo doanh thu hay số lượng?',
    });
    const mockExecutor = createMockExecutor();

    const service = new ChatService(store, mockLlm, new SchemaService(), mockExecutor);
    const result = await service.processMessage({ message: 'What is the best product?' });

    expect(result.isAmbiguous).toBe(true);
    expect(result.followUpQuestion).toBe('Bạn muốn xem theo doanh thu hay số lượng?');
    expect(result.queryResult).toBeDefined();
    expect(mockExecutor.executeWithRetry).toHaveBeenCalled();
    store.destroy();
  });
});
