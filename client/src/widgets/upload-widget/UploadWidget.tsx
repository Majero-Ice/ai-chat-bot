import React from 'react';
import { useUpload, FileUpload } from '../../features/upload';
import './UploadWidget.css';

export const UploadWidget: React.FC = () => {
  const { isUploading, error, uploadedFile, uploadFile, reset } = useUpload();

  const handleUpload = async (file: File) => {
    try {
      await uploadFile(file);
    } catch (err) {
      // Error is handled in useUpload hook
    }
  };

  return (
    <div className="upload-widget">
      <h2 className="upload-widget__title">Загрузка файла</h2>
      <FileUpload
        onUpload={handleUpload}
        isLoading={isUploading}
        disabled={isUploading}
      />
      {error && (
        <div className="upload-widget__error">
          Ошибка: {error}
        </div>
      )}
      {uploadedFile && (
        <div className="upload-widget__success">
          <p className="upload-widget__success-title">Файл успешно загружен!</p>
          <p className="upload-widget__success-name">{uploadedFile.name}</p>
          <button
            className="upload-widget__reset"
            onClick={reset}
            type="button"
          >
            Загрузить другой файл
          </button>
        </div>
      )}
    </div>
  );
};

