import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types.js';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setLoading(true);
      setError(null);

      // Optimistically add user message to list
      const userMsgId = 'user-' + Date.now();
      const optimisticUserMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, optimisticUserMsg]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, sessionId }),
        });

        const data = await response.json();

        if (!data.success) {
          const errMsg = data.error?.message || 'Đã xảy ra lỗi không xác định';
          setError(errMsg);
          // Add error message as assistant turn so user sees it in the conversation
          setMessages((prev) => [
            ...prev,
            {
              id: 'err-' + Date.now(),
              role: 'assistant',
              content: errMsg,
              timestamp: Date.now(),
              error: errMsg,
            },
          ]);
          return;
        }

        const chatData = data.data;
        if (chatData.sessionId) {
          setSessionId(chatData.sessionId);
        }

        const assistantMsg: ChatMessage = {
          id: 'asst-' + Date.now(),
          role: 'assistant',
          userMessage: chatData.userMessage,
          content: chatData.reasoning,
          reasoning: chatData.reasoning,
          sql: chatData.sql,
          isAmbiguous: chatData.isAmbiguous,
          isRefusal: chatData.isRefusal,
          followUpQuestion: chatData.followUpQuestion,
          queryResult: chatData.queryResult,
          retryAttempts: chatData.retryAttempts,
          retryHistory: chatData.retryHistory,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errMsg =
          err instanceof Error
            ? err.message
            : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.';
        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            role: 'assistant',
            content: errMsg,
            timestamp: Date.now(),
            error: errMsg,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading]
  );

  const resetSession = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
  }, []);

  return {
    messages,
    sessionId,
    loading,
    error,
    sendMessage,
    resetSession,
  };
}
