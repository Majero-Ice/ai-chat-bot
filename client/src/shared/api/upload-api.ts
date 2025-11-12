import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

export interface FileUploadResult {
  file: UploadedFile;
  filePath: string;
}

export const uploadApi = {
  uploadFile: async (file: File): Promise<FileUploadResult> => {
    try {
      const formData = new FormData();
      // Явно указываем имя файла для правильной кодировки
      // Браузер автоматически установит правильный Content-Disposition заголовок
      formData.append('file', file, file.name);

      // НЕ устанавливаем Content-Type вручную - axios автоматически установит правильный заголовок
      // с границей (boundary) для multipart/form-data
      const response = await axios.post<FileUploadResult>(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.upload}`,
        formData,
        {
          // Axios автоматически установит правильный Content-Type с boundary
          // При установке вручную boundary не будет установлен, что приведет к ошибке
          headers: {
            'Accept': 'application/json; charset=utf-8',
          },
          // Убеждаемся, что axios правильно обрабатывает ответ как UTF-8
          responseType: 'json',
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || 'Failed to upload file';
        throw new Error(message);
      }
      throw error;
    }
  },
};

