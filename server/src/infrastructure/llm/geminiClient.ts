import { GoogleGenAI, Type } from '@google/genai';
import {
  LlmAuthError,
  LlmQuotaError,
  AppError,
} from '../errors/appError.js';
import { ERROR_CODES } from '../../config/constants.js';

export interface LlmSqlOutput {
  reasoning: string;
  sql: string | null;
  isAmbiguous: boolean;
  isRefusal: boolean;
  followUpQuestion: string | null;
}

export interface ILlmClient {
  generateSql(systemPrompt: string, userPrompt: string): Promise<LlmSqlOutput>;
}

export class GeminiClient implements ILlmClient {
  private client: GoogleGenAI | null = null;
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(apiKey: string, modelName = 'gemini-2.5-flash') {
    this.apiKey = apiKey.trim();
    this.modelName = modelName;
    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  public async generateSql(systemPrompt: string, userPrompt: string): Promise<LlmSqlOutput> {
    if (!this.apiKey || !this.client) {
      throw new LlmAuthError('GEMINI_API_KEY chưa được thiết lập trong file .env');
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reasoning: {
                type: Type.STRING,
                description: 'Lý do hoặc giải thích ngắn gọn bằng tiếng Việt',
              },
              sql: {
                type: Type.STRING,
                description: 'Câu lệnh SQL SELECT an toàn hoặc null nếu không thể truy vấn',
              },
              isAmbiguous: {
                type: Type.BOOLEAN,
                description: 'Đánh dấu true nếu câu hỏi mơ hồ',
              },
              isRefusal: {
                type: Type.BOOLEAN,
                description: 'Đánh dấu true nếu yêu cầu bị từ chối do cố gắng thay đổi/xóa dữ liệu',
              },
              followUpQuestion: {
                type: Type.STRING,
                description: 'Câu hỏi làm rõ tiếp theo cho người dùng nếu mơ hồ',
              },
            },
            required: ['reasoning', 'isAmbiguous', 'isRefusal'],
          },
        },
      });

      const responseText = response.text || '';
      return this.parseAndValidateResponse(responseText);
    } catch (error: unknown) {
      const err = error as { status?: number; code?: number | string; message?: string };
      console.error('[Gemini API Error]:', err.message);

      // Handle Quota/Rate Limit (429 or RESOURCE_EXHAUSTED)
      if (
        err.status === 429 ||
        err.code === 429 ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('Quota exceeded')
      ) {
        throw new LlmQuotaError(err.message);
      }

      // Handle Auth / Key errors (401, 403, PERMISSION_DENIED, API_KEY_INVALID)
      if (
        err.status === 401 ||
        err.status === 403 ||
        err.code === 401 ||
        err.code === 403 ||
        err.message?.includes('API_KEY_INVALID') ||
        err.message?.includes('PERMISSION_DENIED')
      ) {
        throw new LlmAuthError(err.message);
      }

      // Check safety blocks
      if (err.message?.includes('SAFETY') || err.message?.includes('blocked')) {
        return {
          reasoning: 'Yêu cầu bị từ chối bởi bộ lọc an toàn của Google Gemini.',
          sql: null,
          isAmbiguous: false,
          isRefusal: true,
          followUpQuestion: null,
        };
      }

      throw new AppError(
        ERROR_CODES.LLM_GENERATION,
        `Lỗi khi gọi Google Gemini API: ${err.message || 'Lỗi không xác định'}`,
        502,
        err.message
      );
    }
  }

  private parseAndValidateResponse(rawText: string): LlmSqlOutput {
    try {
      // Clean possible markdown code fences if model wrapped them
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned) as Partial<LlmSqlOutput>;
      const rawSql = parsed.sql ? parsed.sql.trim() : null;
      const normalizedSql =
        !rawSql ||
        rawSql.toLowerCase() === 'null' ||
        rawSql.toLowerCase() === 'none' ||
        rawSql === '""' ||
        rawSql.startsWith('--')
          ? null
          : rawSql;

      return {
        reasoning: parsed.reasoning || '',
        sql: normalizedSql,
        isAmbiguous: Boolean(parsed.isAmbiguous),
        isRefusal: Boolean(parsed.isRefusal),
        followUpQuestion: parsed.followUpQuestion ? parsed.followUpQuestion.trim() : null,
      };
    } catch {
      throw new AppError(
        ERROR_CODES.LLM_GENERATION,
        'Mô hình AI trả về dữ liệu không đúng định dạng JSON chuẩn.',
        502,
        rawText
      );
    }
  }
}
