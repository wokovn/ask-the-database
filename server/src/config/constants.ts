export const ERROR_CODES = {
  DB_CONNECTION: 'DB_CONNECTION',
  DB_TIMEOUT: 'DB_TIMEOUT',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  READONLY_VIOLATION: 'READONLY_VIOLATION',
  LLM_QUOTA: 'LLM_QUOTA',
  LLM_AUTH: 'LLM_AUTH',
  LLM_SAFETY: 'LLM_SAFETY',
  LLM_GENERATION: 'LLM_GENERATION',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const DB_TABLES = ['customers', 'products', 'orders', 'order_items'] as const;

export const DEFAULT_MESSAGES = {
  NO_DATA_FOUND: 'Không tìm thấy dữ liệu phù hợp với yêu cầu.',
  READONLY_BLOCKED: 'Hệ thống ở chế độ chỉ đọc (Read-only). Các thao tác thêm, sửa, xóa hoặc thay đổi cấu trúc dữ liệu không được phép thực hiện.',
  QUERY_TIMEOUT: 'Truy vấn đã bị hủy do vượt quá thời gian thực thi cho phép (5 giây). Vui lòng thử lại với câu hỏi cụ thể hơn.',
  DB_DISCONNECTED: 'Không thể kết nối đến cơ sở dữ liệu PostgreSQL. Vui lòng kiểm tra Docker container shop-db.',
  LLM_QUOTA_EXCEEDED: 'API Gemini đang bị giới hạn hạn mức (Rate limit/Quota). Vui lòng đợi trong giây lát rồi thử lại.',
  LLM_KEY_MISSING: 'Chưa cấu hình GEMINI_API_KEY hợp lệ. Vui lòng kiểm tra file .env.',
} as const;
