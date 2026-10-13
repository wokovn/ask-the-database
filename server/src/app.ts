import express from 'express';
import cors from 'cors';
import { globalErrorHandler } from './infrastructure/errors/appError.js';
import { PostgresService } from './infrastructure/db/postgres.js';
import { GeminiClient, type ILlmClient } from './infrastructure/llm/geminiClient.js';
import { InMemorySessionStore, type ISessionStore } from './infrastructure/session/sessionStore.js';
import { SchemaService } from './services/schemaService.js';
import { QueryExecutorService } from './services/queryExecutor.js';
import { ChatService } from './services/chatService.js';
import { ChatController } from './controllers/chatController.js';
import { HealthController } from './controllers/healthController.js';
import { config as defaultConfig, type AppConfig } from './config/env.js';

export interface AppDependencies {
  config?: AppConfig;
  db?: PostgresService;
  llm?: ILlmClient;
  sessionStore?: ISessionStore;
  schemaService?: SchemaService;
  queryExecutor?: QueryExecutorService;
  chatService?: ChatService;
}

export function createApp(deps: AppDependencies = {}): express.Application {
  const cfg = deps.config || defaultConfig;
  const db = deps.db || new PostgresService(cfg.databaseUrl, cfg.queryTimeoutMs, cfg.maxQueryRows);
  const llm = deps.llm || new GeminiClient(cfg.geminiApiKey, cfg.geminiModel);
  const sessionStore = deps.sessionStore || new InMemorySessionStore(cfg.sessionTtlMs);
  const schemaService = deps.schemaService || new SchemaService();
  const queryExecutor = deps.queryExecutor || new QueryExecutorService(db, llm, cfg.maxRetryAttempts);
  const chatService = deps.chatService || new ChatService(sessionStore, llm, schemaService, queryExecutor);

  const chatController = new ChatController(chatService);
  const healthController = new HealthController(db, Boolean(cfg.geminiApiKey));

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // API Routes
  app.get('/api/health', healthController.checkHealth);
  app.post('/api/chat', chatController.handleMessage);
  app.get('/api/session/:sessionId', chatController.getSession);

  // Global Error Handler
  app.use(globalErrorHandler);

  return app;
}
