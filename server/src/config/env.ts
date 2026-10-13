import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from workspace root if present, or current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to local .env

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  databaseAdminUrl?: string;
  geminiApiKey: string;
  geminiModel: string;
  maxQueryRows: number;
  queryTimeoutMs: number;
  maxRetryAttempts: number;
  sessionTtlMs: number;
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function loadConfig(): AppConfig {
  const geminiApiKey = process.env.GEMINI_API_KEY || '';

  return {
    port: parseNumber(process.env.PORT, 5000),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl:
      process.env.DATABASE_URL ||
      'postgresql://shop_readonly:shop_readonly_secret@localhost:5432/shop',
    databaseAdminUrl: process.env.DATABASE_ADMIN_URL,
    geminiApiKey,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    maxQueryRows: parseNumber(process.env.MAX_QUERY_ROWS, 100),
    queryTimeoutMs: parseNumber(process.env.QUERY_TIMEOUT_MS, 5000),
    maxRetryAttempts: parseNumber(process.env.MAX_RETRY_ATTEMPTS, 3),
    sessionTtlMs: parseNumber(process.env.SESSION_TTL_MS, 1800000),
  };
}

export const config = loadConfig();
