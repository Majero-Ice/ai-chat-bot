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
  processing?: {
    fileId: string;
    chunksCount: number;
    embeddingsCount: number;
  };
}

export interface CrawlerOptions {
  maxDepth?: number;
  maxPages?: number;
  timeout?: number;
  waitForContent?: number;
  contentSelector?: string;
  sameDomainOnly?: boolean;
  excludePatterns?: string[];
  includePatterns?: string[];
}

export interface UploadContentDto {
  sourceType: 'file' | 'crawler';
  source: string;
  fileName?: string;
  parserType?: 'file' | 'json' | 'crawler';
  crawlerOptions?: CrawlerOptions;
  skipEmbeddings?: boolean;
}

export interface UploadContentResult {
  success: boolean;
  fileId?: string;
  siteId?: string;
  chunksCount: number;
  embeddingsCount: number;
  pagesCount?: number;
}

export const uploadApi = {
  uploadFile: async (file: File): Promise<FileUploadResult> => {
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await axios.post<FileUploadResult>(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.uploadFile}`,
        formData,
        {
          headers: {
            'Accept': 'application/json; charset=utf-8',
          },
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

  uploadContent: async (dto: UploadContentDto): Promise<UploadContentResult> => {
    try {
      const response = await axios.post<UploadContentResult>(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.uploadContent}`,
        dto,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json; charset=utf-8',
          },
          responseType: 'json',
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || 'Failed to upload content';
        throw new Error(message);
      }
      throw error;
    }
  },
};

