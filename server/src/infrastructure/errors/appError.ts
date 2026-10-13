import type { Request, Response, NextFunction } from 'express';
import { ERROR_CODES, type ErrorCode } from '../../config/constants.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: string;
  };
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly technicalDetails?: string;

  constructor(
    code: ErrorCode,
    message: string,
    httpStatus: number = 400,
    technicalDetails?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.technicalDetails = technicalDetails;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DbConnectionError extends AppError {
  constructor(technicalDetails?: string) {
    super(
      ERROR_CODES.DB_CONNECTION,
      'Không thể kết nối đến cơ sở dữ liệu PostgreSQL. Vui lòng kiểm tra Docker container shop-db.',
      503,
      technicalDetails
    );
  }
}

export class DbTimeoutError extends AppError {
  constructor(technicalDetails?: string) {
    super(
      ERROR_CODES.DB_TIMEOUT,
      'Truy vấn bị hủy do vượt quá thời gian thực thi cho phép (5 giây).',
      504,
      technicalDetails
    );
  }
}

export class ReadOnlyViolationError extends AppError {
  constructor(technicalDetails?: string) {
    super(
      ERROR_CODES.READONLY_VIOLATION,
      'Hệ thống ở chế độ chỉ đọc. Không thể thực hiện thao tác thay đổi hoặc xóa dữ liệu.',
      403,
      technicalDetails
    );
  }
}

export class LlmQuotaError extends AppError {
  constructor(technicalDetails?: string) {
    super(
      ERROR_CODES.LLM_QUOTA,
      'Hệ thống AI Gemini đã vượt giới hạn hạn mức (Quota/Rate Limit). Vui lòng đợi trong giây lát.',
      429,
      technicalDetails
    );
  }
}

export class LlmAuthError extends AppError {
  constructor(technicalDetails?: string) {
    super(
      ERROR_CODES.LLM_AUTH,
      'Khóa API Google Gemini không hợp lệ hoặc thiếu quyền truy cập. Vui lòng kiểm tra biến GEMINI_API_KEY trong .env.',
      401,
      technicalDetails
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, technicalDetails?: string) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 400, technicalDetails);
  }
}

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[GlobalErrorHandler caught error]:', err);

  if (err instanceof AppError) {
    res.status(err.httpStatus).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.technicalDetails,
      },
    });
    return;
  }

  // Fallback for unexpected unknown errors
  const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi nội bộ không mong muốn';
  res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Hệ thống đã gặp lỗi nội bộ. Vui lòng thử lại sau.',
      details: message,
    },
  });
}
