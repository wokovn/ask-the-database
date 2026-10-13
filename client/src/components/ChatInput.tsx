import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, loading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="input-area">
      <form className="input-form" onSubmit={handleSubmit}>
        <div className="input-field-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi bất kỳ điều gì về dữ liệu cửa hàng (ví dụ: Doanh thu tháng 5/2025)..."
            rows={1}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="send-btn"
          disabled={!input.trim() || loading}
        >
          {loading ? 'Đang xử lý...' : 'Gửi câu hỏi'}
        </button>
      </form>
      <div className="input-hint">
        <span>Nhấn Enter để gửi, Shift + Enter để xuống dòng</span>
        <span>Chế độ: Read-Only an toàn</span>
      </div>
    </div>
  );
};
