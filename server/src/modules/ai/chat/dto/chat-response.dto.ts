/**
 * DTO для ответа чата
 */
export interface ChatResponseDto {
	/**
	 * Ответ ассистента
	 */
	message: string;

	/**
	 * Использованные источники (чанки) для генерации ответа
	 */
	sources: Array<{
		chunkId: string;
		text: string;
		similarity: number;
		fileId: string;
		chunkIndex: number;
	}>;

	/**
	 * Модель, использованная для генерации ответа
	 */
	model: string;
}


