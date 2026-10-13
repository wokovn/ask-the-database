import React, { useRef, useEffect } from 'react';
import { useHealth } from './hooks/useHealth.js';
import { useChat } from './hooks/useChat.js';
import { Header } from './components/Header.js';
import { SampleQuestions } from './components/SampleQuestions.js';
import { MessageItem } from './components/MessageItem.js';
import { ChatInput } from './components/ChatInput.js';

export const App: React.FC = () => {
  const { health } = useHealth();
  const { messages, loading, sendMessage, resetSession } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSelectSample = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="app-container">
      <Header
        health={health}
        onResetSession={resetSession}
        messageCount={messages.length}
      />

      <SampleQuestions
        onSelect={handleSelectSample}
        disabled={loading || !health.connected}
      />

      <main className="chat-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>Tra cứu dữ liệu qua ngôn ngữ tự nhiên</h3>
            <p>
              Đặt câu hỏi về khách hàng, sản phẩm, doanh thu và đơn hàng. Mô hình AI
              sẽ tự động sinh SQL, thực thi an toàn trong chế độ Read-only và hiển thị
              kết quả chi tiết.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
            />
          ))
        )}

        {loading && (
          <div className="assistant-response" style={{ opacity: 0.7 }}>
            <div className="reasoning-box">
              Đang phân tích câu hỏi và truy vấn cơ sở dữ liệu...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <ChatInput onSend={sendMessage} loading={loading} />
    </div>
  );
};

export default App;
