import { TextChunkEntity } from './text-chunk.entity';

/**
 * Результат поиска похожих чанков с метрикой схожести
 */
export interface SimilaritySearchResult {
	/**
	 * Чанк текста
	 */
	chunk: TextChunkEntity;
	/**
	 * Метрика схожести (cosine similarity, обычно от 0 до 1)
	 * Чем ближе к 1, тем более похож чанк
	 */
	similarity: number;
}

