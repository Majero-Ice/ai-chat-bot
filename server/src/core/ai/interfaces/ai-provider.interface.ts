/**
 * Базовый интерфейс для AI провайдеров
 * Все провайдеры должны реализовывать этот интерфейс
 */
export interface AiProvider {
	/**
	 * Возвращает имя провайдера
	 */
	getName(): string;

	/**
	 * Проверяет доступность провайдера
	 */
	isAvailable(): Promise<boolean>;
}

/**
 * Интерфейс для провайдеров, поддерживающих создание эмбеддингов
 */
export interface EmbeddingsProvider extends AiProvider {
	/**
	 * Создает векторные эмбеддинги для массива текстов
	 * @param texts Массив текстов для создания эмбеддингов
	 * @param model Модель для создания эмбеддингов
	 * @returns Массив векторов эмбеддингов
	 */
	createEmbeddings(texts: string[], model?: string): Promise<number[][]>;
}

/**
 * Интерфейс для провайдеров, поддерживающих чат/комплетишн
 * Можно использовать в будущем для добавления функциональности чата
 */
export interface ChatProvider extends AiProvider {
	/**
	 * Создает ответ на основе сообщений
	 * @param messages Массив сообщений для контекста
	 * @param model Модель для генерации ответа
	 * @returns Ответ модели
	 */
	chat(messages: Array<{ role: string; content: string }>, model?: string): Promise<string>;
}

/**
 * Интерфейс для провайдеров, поддерживающих комплетишн
 * Можно использовать в будущем для добавления функциональности генерации текста
 */
export interface CompletionProvider extends AiProvider {
	/**
	 * Создает комплетишн на основе промпта
	 * @param prompt Промпт для генерации
	 * @param model Модель для генерации
	 * @returns Сгенерированный текст
	 */
	complete(prompt: string, model?: string): Promise<string>;
}

