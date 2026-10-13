import type { Request, Response, NextFunction } from 'express';
import type { PostgresService } from '../infrastructure/db/postgres.js';
import type { ApiResponse } from '../infrastructure/errors/appError.js';

export class HealthController {
  private readonly db: PostgresService;
  private readonly hasGeminiKey: boolean;

  constructor(db: PostgresService, hasGeminiKey: boolean) {
    this.db = db;
    this.hasGeminiKey = hasGeminiKey;
  }

  public checkHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dbHealth = await this.db.checkHealth();

      const status = dbHealth.connected ? (this.hasGeminiKey ? 'healthy' : 'degraded') : 'down';
      const httpCode = dbHealth.connected ? 200 : 503;

      const response: ApiResponse<{
        status: string;
        database: {
          connected: boolean;
          latencyMs: number;
          error?: string;
        };
        llm: {
          configured: boolean;
        };
        timestamp: string;
      }> = {
        success: dbHealth.connected,
        data: {
          status,
          database: dbHealth,
          llm: {
            configured: this.hasGeminiKey,
          },
          timestamp: new Date().toISOString(),
        },
      };

      res.status(httpCode).json(response);
    } catch (error) {
      next(error);
    }
  };
}
