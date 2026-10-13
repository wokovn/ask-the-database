import React from 'react';
import type { ChatMessage } from '../types.js';
import { SqlBlock } from './SqlBlock.js';
import { DataTable } from './DataTable.js';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
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
          <span>🛡️ {message.answer || message.reasoning || 'Thao tác không được phép trong chế độ Read-only.'}</span>
        </div>
      )}

      {/* User-friendly Friendly Answer */}
      {!message.error && !message.isRefusal && (message.answer || message.content) && (
        <div className="answer-box">{message.answer || message.content}</div>
      )}

      {/* Collapsible internal technical reasoning for dev / evaluation */}
      {message.reasoning && (
        <details className="reasoning-accordion">
          <summary>Chi tiết suy luận kỹ thuật</summary>
          <div className="reasoning-content">{message.reasoning}</div>
        </details>
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
        </div>
      )}
    </div>
  );
};
