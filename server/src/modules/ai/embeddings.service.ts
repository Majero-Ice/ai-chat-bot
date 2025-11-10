import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER } from '../../core/ai/ai.constants';
import type { EmbeddingsProvider } from '../../core/ai/interfaces/ai-provider.interface';

/**
 * Сервис для создания векторных эмбеддингов
 * Бизнес-логика работы с эмбеддингами
 */
@Injectable()
export class EmbeddingsService {
	constructor(
		@Inject(AI_PROVIDER) private readonly aiProvider: EmbeddingsProvider,
	) {}

	/**
	 * Создает векторные эмбеддинги для массива текстов
	 * @param texts Массив текстов для создания эмбеддингов
	 * @param model Модель для создания эмбеддингов (по умолчанию text-embedding-3-small)
	 * @returns Массив векторов эмбеддингов
	 */
	async createEmbeddings(
		texts: string[],
		model: string = 'text-embedding-3-small',
	): Promise<number[][]> {
		if (texts.length === 0) {
			return [];
		}

		return this.aiProvider.createEmbeddings(texts, model);
	}

	/**
	 * Создает векторный эмбеддинг для одного текста
	 * @param text Текст для создания эмбеддинга
	 * @param model Модель для создания эмбеддингов (по умолчанию text-embedding-3-small)
	 * @returns Вектор эмбеддинга
	 */
	async createEmbedding(
		text: string,
		model: string = 'text-embedding-3-small',
	): Promise<number[]> {
		const embeddings = await this.createEmbeddings([text], model);
		return embeddings[0];
	}
}

