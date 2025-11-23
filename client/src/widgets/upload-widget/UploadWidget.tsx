import React, { useState } from 'react';
import { useUpload, FileUpload, CrawlerUpload } from '../../features/upload';
import './UploadWidget.css';

type UploadMode = 'file' | 'crawler';

export const UploadWidget: React.FC = () => {
  const { isUploading, error, uploadResult, uploadFile, uploadContent, reset } = useUpload();
  const [mode, setMode] = useState<UploadMode>('file');

  const handleFileUpload = async (file: File) => {
    try {
      await uploadFile(file);
    } catch (err) {
      // Error is handled in useUpload hook
    }
  };

  const handleCrawlerUpload = async (url: string, options?: any, fileName?: string) => {
    try {
      await uploadContent(url, options, fileName);
    } catch (err) {
      // Error is handled in useUpload hook
    }
  };

  return (
    <div className="upload-widget">
      <h2 className="upload-widget__title">Загрузка контента</h2>

      {/* Переключатель режимов */}
      <div className="upload-widget__tabs">
        <button
          className={`upload-widget__tab ${mode === 'file' ? 'upload-widget__tab--active' : ''}`}
          onClick={() => {
            setMode('file');
            reset();
          }}
          disabled={isUploading}
          type="button"
        >
          Файл
        </button>
        <button
          className={`upload-widget__tab ${mode === 'crawler' ? 'upload-widget__tab--active' : ''}`}
          onClick={() => {
            setMode('crawler');
            reset();
          }}
          disabled={isUploading}
          type="button"
        >
          Сайт (Краулер)
        </button>
      </div>

      {/* Контент в зависимости от режима */}
      <div className="upload-widget__content">
        {mode === 'file' ? (
          <FileUpload
            onUpload={handleFileUpload}
            isLoading={isUploading}
            disabled={isUploading}
          />
        ) : (
          <CrawlerUpload
            onUpload={handleCrawlerUpload}
            isLoading={isUploading}
            disabled={isUploading}
          />
        )}
      </div>

      {/* Отображение ошибок */}
      {error && (
        <div className="upload-widget__error">
          Ошибка: {error}
        </div>
      )}

      {/* Отображение успешного результата */}
      {uploadResult && (
        <div className="upload-widget__success">
          <p className="upload-widget__success-title">
            {uploadResult.type === 'file' ? 'Файл успешно загружен!' : 'Сайт успешно обработан!'}
          </p>
          <p className="upload-widget__success-name">{uploadResult.name}</p>
          
          <div className="upload-widget__success-stats">
            {uploadResult.type === 'crawler' && uploadResult.pagesCount !== undefined && (
              <p className="upload-widget__success-stat">
                Страниц обработано: <strong>{uploadResult.pagesCount}</strong>
              </p>
            )}
            <p className="upload-widget__success-stat">
              Чанков создано: <strong>{uploadResult.chunksCount}</strong>
            </p>
            <p className="upload-widget__success-stat">
              Эмбеддингов создано: <strong>{uploadResult.embeddingsCount}</strong>
            </p>
            {uploadResult.type === 'crawler' && uploadResult.siteId && (
              <p className="upload-widget__success-stat">
                ID сайта: <strong>{uploadResult.siteId}</strong>
              </p>
            )}
            {uploadResult.type === 'file' && uploadResult.fileId && (
              <p className="upload-widget__success-stat">
                ID файла: <strong>{uploadResult.fileId}</strong>
              </p>
            )}
          </div>

          <button
            className="upload-widget__reset"
            onClick={reset}
            type="button"
          >
            {uploadResult.type === 'file' ? 'Загрузить другой файл' : 'Обработать другой сайт'}
          </button>
        </div>
      )}
    </div>
  );
};
