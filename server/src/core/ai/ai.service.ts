import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER } from './ai.constants';
import type { EmbeddingsProvider } from './interfaces/ai-provider.interface';

/**
 * Основной сервис для работы с AI инфраструктурой
 * Предоставляет доступ к текущему AI провайдеру
 */
@Injectable()
export class AiService {
	constructor(@Inject(AI_PROVIDER) private readonly provider: EmbeddingsProvider) {}

	/**
	 * Возвращает текущий AI провайдер
	 */
	getProvider(): EmbeddingsProvider {
		return this.provider;
	}

	/**
	 * Возвращает имя текущего провайдера
	 */
	getProviderName(): string {
		return this.provider.getName();
	}
}

