import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsProvider } from '../../interfaces/ai-provider.interface';
import OpenAI from 'openai';

/**
 * OpenAI провайдер для работы с AI сервисами
 * Предоставляет доступ к OpenAI API клиенту
 */
@Injectable()
export class OpenAIProvider implements EmbeddingsProvider {
	private client: OpenAI;

	constructor(@Inject(ConfigService) private config: ConfigService) {
		const apiKey = config.get<string>('OPENAI_API_KEY');
		if (!apiKey) {
			throw new Error(
				'OpenAI configuration missing: set OPENAI_API_KEY in environment variables.',
			);
		}

		this.client = new OpenAI({
			apiKey: apiKey,
		});
	}

	getName(): string {
		return 'openai';
	}

	async isAvailable(): Promise<boolean> {
		try {
			// Простая проверка доступности через список моделей
			await this.client.models.list();
			return true;
		} catch (error) {
			return false;
		}
	}

	async createEmbeddings(
		texts: string[],
		model: string = 'text-embedding-3-small',
	): Promise<number[][]> {
		if (texts.length === 0) {
			return [];
		}

		try {
			const response = await this.client.embeddings.create({
				model: model,
				input: texts,
			});

			return response.data.map((item) => item.embedding);
		} catch (error) {
			throw new Error(
				`Failed to create embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Возвращает OpenAI клиент для прямого использования
	 */
	getClient(): OpenAI {
		return this.client;
	}
}

