import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface ChatRequest {
  message: string;
  fileId?: string;
  history?: Array<{ role: string; content: string }>;
  maxContextChunks?: number;
  similarityThreshold?: number;
}

export interface ChatSource {
  chunkId: string;
  text: string;
  similarity: number;
  fileId: string;
  chunkIndex: number;
}

export interface ChatResponse {
  message: string;
  sources: ChatSource[];
  model: string;
}

export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    try {
      const response = await axios.post<ChatResponse>(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.chat}`,
        request
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || 'Failed to send message';
        throw new Error(message);
      }
      throw error;
    }
  },
};

