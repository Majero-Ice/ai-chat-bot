import React, { useState } from 'react';
import { Button, Input } from '../../../../shared/ui';
import type { CrawlerOptions } from '../../../../shared/api/upload-api';
import './CrawlerUpload.css';

interface CrawlerUploadProps {
  onUpload: (url: string, options?: CrawlerOptions, fileName?: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const CrawlerUpload: React.FC<CrawlerUploadProps> = ({
  onUpload,
  isLoading = false,
  disabled = false,
}) => {
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const options: CrawlerOptions = {
      maxDepth,
      maxPages,
      sameDomainOnly: true,
    };

    onUpload(url.trim(), options, fileName.trim() || undefined);
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  return (
    <form className="crawler-upload" onSubmit={handleSubmit}>
      <div className="crawler-upload__field">
        <Input
          type="url"
          label="URL сайта"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading || disabled}
          required
        />
      </div>

      <div className="crawler-upload__field">
        <Input
          type="text"
          label="Имя сайта (опционально)"
          placeholder="example-site"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          disabled={isLoading || disabled}
        />
      </div>

      <div className="crawler-upload__basic-options">
        <div className="crawler-upload__field">
          <Input
            type="number"
            label="Максимальная глубина"
            value={maxDepth}
            onChange={(e) => setMaxDepth(Number(e.target.value))}
            min={1}
            max={5}
            disabled={isLoading || disabled}
          />
        </div>

        <div className="crawler-upload__field">
          <Input
            type="number"
            label="Максимум страниц"
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            min={1}
            max={200}
            disabled={isLoading || disabled}
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        isLoading={isLoading}
        disabled={disabled || !url.trim() || !isValidUrl(url)}
      >
        {isLoading ? 'Обход сайта...' : 'Начать обход'}
      </Button>

      {!isValidUrl(url) && url.trim() && (
        <p className="crawler-upload__error">Введите корректный URL (начинается с http:// или https://)</p>
      )}
    </form>
  );
};

