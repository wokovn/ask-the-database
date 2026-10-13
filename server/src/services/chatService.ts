import type { ISessionStore, ChatSession } from '../infrastructure/session/sessionStore.js';
import type { ILlmClient } from '../infrastructure/llm/geminiClient.js';
import type { SchemaService } from './schemaService.js';
import type { QueryExecutorService, ExecutionWithRetryResult } from './queryExecutor.js';
import { buildSystemPrompt } from '../prompts/systemPrompt.js';
import { ValidationError } from '../infrastructure/errors/appError.js';

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponseData {
  sessionId: string;
  userMessage: string;
  reasoning: string;
  sql: string | null;
  isAmbiguous: boolean;
  isRefusal: boolean;
  followUpQuestion: string | null;
  queryResult: ExecutionWithRetryResult['queryResult'] | null;
  retryAttempts: number;
  retryHistory: ExecutionWithRetryResult['retryHistory'];
}

export class ChatService {
  private readonly sessionStore: ISessionStore;
  private readonly llm: ILlmClient;
  private readonly schemaService: SchemaService;
  private readonly queryExecutor: QueryExecutorService;

  constructor(
    sessionStore: ISessionStore,
    llm: ILlmClient,
    schemaService: SchemaService,
    queryExecutor: QueryExecutorService
  ) {
    this.sessionStore = sessionStore;
    this.llm = llm;
    this.schemaService = schemaService;
    this.queryExecutor = queryExecutor;
  }

  public async processMessage(request: ChatRequest): Promise<ChatResponseData> {
    const rawMessage = request.message ? request.message.trim() : '';
    if (!rawMessage) {
      throw new ValidationError('Nội dung câu hỏi không được để trống.');
    }

    const session = this.sessionStore.getOrCreateSession(request.sessionId);

    // Save user message in session
    this.sessionStore.addMessage(session.id, {
      role: 'user',
      content: rawMessage,
    });

    // Build system prompt with schema
    const schemaDesc = this.schemaService.getSchemaDescription();
    const systemPrompt = buildSystemPrompt({ schemaDescription: schemaDesc });

    // Include recent session history in prompt context if any
    const promptWithContext = this.buildUserPromptWithHistory(session, rawMessage);

    // Generate SQL via Gemini
    const llmOutput = await this.llm.generateSql(systemPrompt, promptWithContext);

    let queryExecution: ExecutionWithRetryResult | null = null;

    // If AI generated an SQL query and it is not a refusal
    if (llmOutput.sql && !llmOutput.isRefusal) {
      queryExecution = await this.queryExecutor.executeWithRetry(
        rawMessage,
        llmOutput.sql,
        systemPrompt
      );
    }

    const finalSql = queryExecution ? queryExecution.finalSql : llmOutput.sql;

    // Save assistant response in session
    this.sessionStore.addMessage(session.id, {
      role: 'assistant',
      content: llmOutput.reasoning,
      sql: finalSql,
      reasoning: llmOutput.reasoning,
      isAmbiguous: llmOutput.isAmbiguous,
      isRefusal: llmOutput.isRefusal,
      followUpQuestion: llmOutput.followUpQuestion,
    });

    return {
      sessionId: session.id,
      userMessage: rawMessage,
      reasoning: llmOutput.reasoning,
      sql: finalSql,
      isAmbiguous: llmOutput.isAmbiguous,
      isRefusal: llmOutput.isRefusal,
      followUpQuestion: llmOutput.followUpQuestion,
      queryResult: queryExecution ? queryExecution.queryResult : null,
      retryAttempts: queryExecution ? queryExecution.retryAttempts : 0,
      retryHistory: queryExecution ? queryExecution.retryHistory : [],
    };
  }

  public getSessionHistory(sessionId: string): ChatSession | undefined {
    return this.sessionStore.getSession(sessionId);
  }

  private buildUserPromptWithHistory(session: ChatSession, currentMessage: string): string {
    const history = session.messages.slice(-6); // last 6 messages
    if (history.length <= 1) {
      return `User question: "${currentMessage}"`;
    }

    const historyLines = history.slice(0, -1).map((m) => {
      const sqlPart = m.sql ? ` [SQL: ${m.sql}]` : '';
      return `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}${sqlPart}`;
    });

    return `Conversation Context:\n${historyLines.join('\n')}\n\nNew user question: "${currentMessage}"`;
  }
}
