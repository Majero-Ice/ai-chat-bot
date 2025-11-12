import React, { useRef } from 'react';
import { Button } from '../../../../shared/ui';
import './FileUpload.css';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
  disabled?: boolean;
  acceptedTypes?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  isLoading = false,
  disabled = false,
  acceptedTypes = '.txt,.csv,.json,.md,.html',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        disabled={isLoading || disabled}
        style={{ display: 'none' }}
      />
      <Button
        onClick={handleClick}
        isLoading={isLoading}
        disabled={disabled}
        variant="secondary"
      >
        {isLoading ? 'Загрузка...' : 'Загрузить файл'}
      </Button>
      <p className="file-upload__hint">
        Поддерживаемые форматы: .txt, .csv, .json, .md, .html (до 10MB)
      </p>
    </div>
  );
};

