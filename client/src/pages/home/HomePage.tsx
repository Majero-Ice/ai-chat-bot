import React from 'react';
import { ChatWidget } from '../../widgets/chat-widget';
import { UploadWidget } from '../../widgets/upload-widget';
import './HomePage.css';

export const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <header className="home-page__header">
        <h1 className="home-page__title">AI Chat Bot</h1>
        <p className="home-page__subtitle">
          Загрузите документы и задайте вопросы на их основе
        </p>
      </header>
      <main className="home-page__main">
        <div className="home-page__sidebar">
          <UploadWidget />
        </div>
        <div className="home-page__content">
          <ChatWidget />
        </div>
      </main>
    </div>
  );
};

