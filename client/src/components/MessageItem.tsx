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

  const hasSql = Boolean(
    message.sql &&
      message.sql.trim() !== '' &&
      message.sql.trim().toLowerCase() !== 'null' &&
      message.sql.trim().toLowerCase() !== 'none'
  );

  const hasFollowUp = Boolean(
    message.followUpQuestion &&
      message.followUpQuestion.trim() !== '' &&
      message.followUpQuestion.trim().toLowerCase() !== 'null' &&
      message.followUpQuestion.trim().toLowerCase() !== 'none'
  );

  const hasReasoning = Boolean(
    message.reasoning &&
      message.reasoning.trim() !== '' &&
      message.reasoning.trim().toLowerCase() !== 'null' &&
      message.reasoning.trim() !== message.answer?.trim()
  );

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
      {hasReasoning && (
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

      {/* SQL Block - only shown when valid SQL exists */}
      {hasSql && <SqlBlock sql={message.sql!} />}

      {/* Query Results Table - only shown when valid SQL exists and results are present */}
      {hasSql && message.queryResult && <DataTable result={message.queryResult} />}

      {/* Follow-up question box - completely hidden if null */}
      {hasFollowUp && (
        <div className="follow-up-box">
          <span className="follow-up-label">Câu hỏi làm rõ tiếp theo</span>
          <span className="follow-up-text">{message.followUpQuestion}</span>
        </div>
      )}
    </div>
  );
};
