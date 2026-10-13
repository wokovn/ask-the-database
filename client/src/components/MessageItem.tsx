import React from 'react';
import type { ChatMessage } from '../types.js';
import { SqlBlock } from './SqlBlock.js';
import { DataTable } from './DataTable.js';

interface MessageItemProps {
  message: ChatMessage;
  onFollowUpClick?: (question: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onFollowUpClick }) => {
  if (message.role === 'user') {
    return (
      <div className="user-query-row">
        <div className="user-bubble">{message.content}</div>
      </div>
    );
  }

  // Assistant turn
  return (
    <div className="assistant-response">
      {/* Error state */}
      {message.error && (
        <div className="error-card">
          <strong>Lỗi hệ thống</strong>
          <span>{message.error}</span>
        </div>
      )}

      {/* Security Refusal */}
      {message.isRefusal && (
        <div className="notice-pill refusal">
          <span>🛡️ Từ chối: {message.reasoning || 'Thao tác không được phép trong chế độ Read-only.'}</span>
        </div>
      )}

      {/* Normal Reasoning */}
      {!message.error && !message.isRefusal && message.reasoning && (
        <div className="reasoning-box">{message.reasoning}</div>
      )}

      {/* Retry recovery status pill */}
      {Boolean(message.retryAttempts && message.retryAttempts > 0) && (
        <div className="notice-pill retry">
          <span>
            ⚡ Đã tự động sửa lỗi cú pháp SQL và phục hồi thành công (Lần thử {message.retryAttempts}/3).
          </span>
        </div>
      )}

      {/* SQL Block */}
      {message.sql && <SqlBlock sql={message.sql} />}

      {/* Query Results Table */}
      {message.queryResult && <DataTable result={message.queryResult} />}

      {/* Follow-up question box */}
      {message.followUpQuestion && (
        <div className="follow-up-box">
          <span className="follow-up-label">Câu hỏi làm rõ tiếp theo</span>
          <span className="follow-up-text">{message.followUpQuestion}</span>
          {onFollowUpClick && (
            <div style={{ marginTop: '0.25rem' }}>
              <button
                className="btn-secondary"
                onClick={() => onFollowUpClick(message.followUpQuestion!)}
              >
                Trả lời: &quot;{message.followUpQuestion}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
