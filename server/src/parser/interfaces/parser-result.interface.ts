/**
 * Интерфейс для чанка текста
 */
export interface TextChunk {
  /** Индекс чанка (начиная с 0) */
  index: number;
  /** Содержимое чанка */
  content: string;
  /** Начальная позиция в исходном тексте */
  startPosition: number;
  /** Конечная позиция в исходном тексте */
  endPosition: number;
  /** Длина чанка в символах */
  length: number;
}

/**
 * Результат парсинга текстового файла
 */
export interface FileParseResult {
  /** Массив чанков текста */
  chunks: TextChunk[];
  /** Общее количество чанков */
  totalChunks: number;
  /** Общая длина исходного текста */
  totalLength: number;
  /** Тип парсера */
  type: 'file';
}

