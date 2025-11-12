import React from 'react';
import { useChat, ChatMessages, ChatInput } from '../../features/chat';
import { Button } from '../../shared/ui';
import './ChatWidget.css';

export const ChatWidget: React.FC = () => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat();

  return (
    <div className="chat-widget">
      <div className="chat-widget__header">
        <h2 className="chat-widget__title">Чат с ИИ</h2>
        {messages.length > 0 && (
          <Button onClick={clearMessages} variant="secondary" disabled={isLoading}>
            Очистить
          </Button>
        )}
      </div>
      {error && (
        <div className="chat-widget__error">
          Ошибка: {error}
        </div>
      )}
      <ChatMessages messages={messages} isLoading={isLoading} />
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
};

