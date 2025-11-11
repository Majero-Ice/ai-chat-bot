/**
 * DTO для запроса чата
 */
export class ChatRequestDto {
	/**
	 * Сообщение пользователя
	 */
	message: string;

	/**
	 * ID файла для поиска релевантного контекста
	 * Если не указан, поиск будет по всем файлам
	 */
	fileId?: string;

	/**
	 * История сообщений для контекста разговора
	 */
	history?: Array<{ role: string; content: string }>;

	/**
	 * Максимальное количество релевантных чанков для контекста (1-20)
	 */
	maxContextChunks?: number;

	/**
	 * Минимальный порог схожести для поиска чанков (0-1)
	 */
	similarityThreshold?: number;
}

