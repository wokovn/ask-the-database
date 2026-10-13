export interface QueryExecutionResult {
  rows: Record<string, unknown>[];
  fields: string[];
  rowCount: number;
  durationMs: number;
  truncated: boolean;
  totalRowCount: number;
}

export interface RetryRecord {
  attempt: number;
  failedSql: string;
  error: string;
  fixedSql?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  userMessage?: string;
  content: string;
  sql?: string | null;
  reasoning?: string;
  isAmbiguous?: boolean;
  isRefusal?: boolean;
  followUpQuestion?: string | null;
  queryResult?: QueryExecutionResult | null;
  retryAttempts?: number;
  retryHistory?: RetryRecord[];
  timestamp: number;
  error?: string;
}

export interface HealthState {
  connected: boolean;
  latencyMs?: number;
  llmConfigured: boolean;
  error?: string;
  loading: boolean;
}
