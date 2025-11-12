import { useState, useCallback } from 'react';
import { uploadApi } from '../../../shared/api/upload-api';

export const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; path: string } | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadedFile(null);

    try {
      const result = await uploadApi.uploadFile(file);
      setUploadedFile({
        name: result.file.originalname,
        path: result.filePath,
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

  const reset = useCallback(() => {
    setError(null);
    setUploadedFile(null);
  }, []);

  return {
    isUploading,
    error,
    uploadedFile,
    uploadFile,
    reset,
  };
};

