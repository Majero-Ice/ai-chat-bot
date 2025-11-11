import { Inject, Injectable } from '@nestjs/common';
import { TextChunkEntity } from './domain/text-chunk.entity';
import type { TextChunksRepositoryPort } from './repositories/text-chunks.repository.port';
import { SimilaritySearchResult } from './domain/similarity-search-result.interface';

export const TEXT_CHUNKS_REPOSITORY = Symbol('TEXT_CHUNKS_REPOSITORY');

/**
 * Опции для поиска похожих чанков
 */
export interface FindSimilarChunksOptions {
	/**
	 * Максимальное количество результатов (по умолчанию 5)
	 */
	limit?: number;
	/**
	 * Минимальный порог схожести от 0 до 1 (по умолчанию 0.7)
	 */
	threshold?: number;
}

@Injectable()
export class TextChunksService {
	constructor(@Inject(TEXT_CHUNKS_REPOSITORY) private readonly chunks: TextChunksRepositoryPort) {}

	insertMany(chunks: Array<Omit<TextChunkEntity, 'id' | 'created_at'>>): Promise<number> {
		return this.chunks.insertMany(chunks);
	}

	listByFileId(fileId: string): Promise<TextChunkEntity[]> {
		return this.chunks.listByFileId(fileId);
	}

	deleteByFileId(fileId: string): Promise<void> {
		return this.chunks.deleteByFileId(fileId);
	}

	/**
	 * Находит похожие чанки по векторному эмбеддингу
	 * @param fileId ID файла для поиска
	 * @param embedding Вектор эмбеддинга для поиска
	 * @param options Опции поиска (limit, threshold)
	 * @returns Массив похожих чанков с метрикой схожести, отсортированный по убыванию схожести
	 */
	async findSimilarChunks(
		fileId: string,
		embedding: number[],
		options: FindSimilarChunksOptions = {},
	): Promise<SimilaritySearchResult[]> {
		const { limit = 5, threshold = 0.5 } = options;

		if (!embedding || embedding.length === 0) {
			throw new Error('Embedding vector cannot be empty');
		}

		return this.chunks.findSimilarByEmbedding(fileId, embedding, limit, threshold);
	}

	/**
	 * Находит похожие чанки по всем файлам по векторному эмбеддингу
	 * @param embedding Вектор эмбеддинга для поиска
	 * @param options Опции поиска (limit, threshold)
	 * @returns Массив похожих чанков с метрикой схожести, отсортированный по убыванию схожести
	 */
	async findSimilarChunksAllFiles(
		embedding: number[],
		options: FindSimilarChunksOptions = {},
	): Promise<SimilaritySearchResult[]> {
		const { limit = 5, threshold = 0.5 } = options;

		if (!embedding || embedding.length === 0) {
			throw new Error('Embedding vector cannot be empty');
		}

		return this.chunks.findSimilarByEmbeddingAllFiles(embedding, limit, threshold);
	}
}

