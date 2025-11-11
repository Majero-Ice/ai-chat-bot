import { TextChunkEntity } from '../domain/text-chunk.entity';
import { SimilaritySearchResult } from '../domain/similarity-search-result.interface';

export interface TextChunksRepositoryPort {
	insertMany(chunks: Array<Omit<TextChunkEntity, 'id' | 'created_at'>>): Promise<number>;
	listByFileId(fileId: string): Promise<TextChunkEntity[]>;
	deleteByFileId(fileId: string): Promise<void>;
	/**
	 * Находит похожие чанки по векторному эмбеддингу
	 * @param fileId ID файла для поиска
	 * @param embedding Вектор эмбеддинга для поиска
	 * @param limit Максимальное количество результатов
	 * @param threshold Минимальный порог схожести (0-1)
	 * @returns Массив похожих чанков с метрикой схожести
	 */
	findSimilarByEmbedding(
		fileId: string,
		embedding: number[],
		limit?: number,
		threshold?: number,
	): Promise<SimilaritySearchResult[]>;

	/**
	 * Находит похожие чанки по всем файлам по векторному эмбеддингу
	 * @param embedding Вектор эмбеддинга для поиска
	 * @param limit Максимальное количество результатов
	 * @param threshold Минимальный порог схожести (0-1)
	 * @returns Массив похожих чанков с метрикой схожести
	 */
	findSimilarByEmbeddingAllFiles(
		embedding: number[],
		limit?: number,
		threshold?: number,
	): Promise<SimilaritySearchResult[]>;
}

