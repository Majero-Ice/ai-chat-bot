import React, { useEffect, useRef } from 'react';
import { Message } from '../../../../entities/message';
import { ChatMessage } from '../ChatMessage/ChatMessage';
import './ChatMessages.css';

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="chat-messages">
      {messages.length === 0 ? (
        <div className="chat-messages__empty">
          Начните разговор, отправив сообщение
        </div>
      ) : (
        messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))
      )}
      {isLoading && (
        <div className="chat-messages__loading">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

