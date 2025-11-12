import React from 'react';
import { Message } from '../../../../entities/message';
import './ChatMessage.css';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <div className="chat-message__header">
        <span className="chat-message__role">
          {message.role === 'user' ? 'Вы' : 'Ассистент'}
        </span>
        <span className="chat-message__timestamp">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      <div className="chat-message__content">{message.content}</div>
      {message.sources && message.sources.length > 0 && (
        <div className="chat-message__sources">
          <details>
            <summary>Источники ({message.sources.length})</summary>
            <ul>
              {message.sources.map((source, index) => (
                <li key={index}>
                  <div className="source-item">
                    <div className="source-item__similarity">
                      Схожесть: {(source.similarity * 100).toFixed(1)}%
                    </div>
                    <div className="source-item__text">{source.text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
};

