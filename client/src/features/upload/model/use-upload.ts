import { useState, useCallback } from 'react';
import { uploadApi, type CrawlerOptions, type UploadContentResult } from '../../../shared/api/upload-api';

export interface UploadResult {
  type: 'file' | 'crawler';
  name: string;
  fileId?: string;
  siteId?: string;
  chunksCount: number;
  embeddingsCount: number;
  pagesCount?: number;
}

export const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await uploadApi.uploadFile(file);
      setUploadResult({
        type: 'file',
        name: result.file.originalname,
        fileId: result.processing?.fileId,
        chunksCount: result.processing?.chunksCount || 0,
        embeddingsCount: result.processing?.embeddingsCount || 0,
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      console.error('Upload error:', err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadContent = useCallback(async (
    url: string,
    options?: CrawlerOptions,
    fileName?: string,
  ) => {
    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result: UploadContentResult = await uploadApi.uploadContent({
        sourceType: 'crawler',
        source: url,
        fileName,
        parserType: 'crawler',
        crawlerOptions: options,
        skipEmbeddings: false,
      });

      setUploadResult({
        type: 'crawler',
        name: fileName || url,
        siteId: result.siteId,
        chunksCount: result.chunksCount,
        embeddingsCount: result.embeddingsCount,
        pagesCount: result.pagesCount,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to crawl site';
      setError(errorMessage);
      console.error('Crawl error:', err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setUploadResult(null);
  }, []);

  return {
    isUploading,
    error,
    uploadResult,
    uploadFile,
    uploadContent,
    reset,
  };
};

