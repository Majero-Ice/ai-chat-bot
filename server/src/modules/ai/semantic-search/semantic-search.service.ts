import { Injectable } from '@nestjs/common';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { TextChunksService, FindSimilarChunksOptions } from '../../db/text-chunks/text-chunks.service';
import { SimilaritySearchResult } from '../../db/text-chunks/domain/similarity-search-result.interface';

/**
 * Сервис для семантического поиска по текстовым чанкам
 * Высокоуровневая бизнес-логика поиска похожих текстов
 */
@Injectable()
export class SemanticSearchService {
	constructor(
		private readonly embeddingsService: EmbeddingsService,
		private readonly textChunksService: TextChunksService,
	) {}

	/**
	 * Находит похожие чанки по текстовому запросу
	 * Автоматически создает эмбеддинг для запроса и ищет похожие чанки
	 * @param fileId ID файла для поиска
	 * @param query Текстовый запрос для поиска
	 * @param options Опции поиска (limit, threshold)
	 * @returns Массив похожих чанков с метрикой схожести
	 */
	async searchByText(
		fileId: string,
		query: string,
		options: FindSimilarChunksOptions = {},
	): Promise<SimilaritySearchResult[]> {
		if (!query || query.trim().length === 0) {
			throw new Error('Search query cannot be empty');
		}

		// Создаем эмбеддинг для запроса
		const queryEmbedding = await this.embeddingsService.createEmbedding(query);

		// Ищем похожие чанки
		return this.textChunksService.findSimilarChunks(fileId, queryEmbedding, options);
	}

	/**
	 * Находит похожие чанки по векторному эмбеддингу
	 * @param fileId ID файла для поиска
	 * @param embedding Вектор эмбеддинга для поиска
	 * @param options Опции поиска (limit, threshold)
	 * @returns Массив похожих чанков с метрикой схожести
	 */
	async searchByEmbedding(
		fileId: string,
		embedding: number[],
		options: FindSimilarChunksOptions = {},
	): Promise<SimilaritySearchResult[]> {
		return this.textChunksService.findSimilarChunks(fileId, embedding, options);
	}

	/**
	 * Находит похожие чанки по тексту и возвращает только тексты (без метаданных)
	 * @param fileId ID файла для поиска
	 * @param query Текстовый запрос для поиска
	 * @param options Опции поиска (limit, threshold)
	 * @returns Массив текстов похожих чанков, отсортированных по схожести
	 */
	async searchTextsOnly(
		fileId: string,
		query: string,
		options: FindSimilarChunksOptions = {},
	): Promise<string[]> {
		const results = await this.searchByText(fileId, query, options);
		return results.map((result) => result.chunk.text);
	}

	/**
	 * Находит похожие чанки по текстовому запросу во всех файлах
	 * @param query Текстовый запрос для поиска
	 * @param options Опции поиска (limit, threshold)
	 * @returns Массив похожих чанков с метрикой схожести
	 */
	async searchByTextAllFiles(
		query: string,
		options: FindSimilarChunksOptions = {},
	): Promise<SimilaritySearchResult[]> {
		if (!query || query.trim().length === 0) {
			throw new Error('Search query cannot be empty');
		}

		// Создаем эмбеддинг для запроса
		const queryEmbedding = await this.embeddingsService.createEmbedding(query);

		// Ищем похожие чанки во всех файлах
		return this.textChunksService.findSimilarChunksAllFiles(queryEmbedding, options);
	}
}

