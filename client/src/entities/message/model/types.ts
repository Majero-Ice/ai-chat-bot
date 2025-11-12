export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: MessageSource[];
}

export interface MessageSource {
  chunkId: string;
  text: string;
  similarity: number;
  fileId: string;
  chunkIndex: number;
}

