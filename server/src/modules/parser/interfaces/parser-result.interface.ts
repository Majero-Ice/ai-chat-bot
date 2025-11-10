export interface TextChunk {
  index: number;
  content: string;
  startPosition: number;
  endPosition: number;
  length: number;
}

export interface FileParseResult {
  chunks: TextChunk[];
  totalChunks: number;
  totalLength: number;
  type: 'file';
}


