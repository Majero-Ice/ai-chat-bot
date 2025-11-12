import { useState, useCallback } from 'react';
import { chatApi, ChatRequest, ChatResponse } from '../../../shared/api/chat-api';
import { Message, MessageSource } from '../../../entities/message';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, fileId?: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    let updatedMessages: Message[] = [];
    setMessages((prev) => {
      updatedMessages = [...prev, userMessage];
      return updatedMessages;
    });
    
    setIsLoading(true);
    setError(null);

    try {
      // Prepare history for API (all previous messages including the new user message)
      const history = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const request: ChatRequest = {
        message: content,
        fileId,
        history,
      };

      const response: ChatResponse = await chatApi.sendMessage(request);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        sources: response.sources.map((source) => ({
          chunkId: source.chunkId,
          text: source.text,
          similarity: source.similarity,
          fileId: source.fileId,
          chunkIndex: source.chunkIndex,
        })),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};

