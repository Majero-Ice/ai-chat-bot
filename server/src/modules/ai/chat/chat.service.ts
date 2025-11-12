import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { SemanticSearchService } from '../semantic-search/semantic-search.service';
import { AI_PROVIDER } from '../../../core/ai/ai.constants';
import type { ChatProvider } from '../../../core/ai/interfaces/ai-provider.interface';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { ChatMessage, ChatRole } from './interfaces/chat-message.interface';

/**
 * Опции для генерации ответа
 */
interface ChatOptions {
	maxContextChunks?: number;
	similarityThreshold?: number;
	model?: string;
}

/**
 * Сервис для чата с ИИ с поддержкой RAG (Retrieval Augmented Generation)
 * Использует семантический поиск для нахождения релевантного контекста
 */
@Injectable()
export class ChatService {
	constructor(
		private readonly embeddingsService: EmbeddingsService,
		private readonly semanticSearchService: SemanticSearchService,
		@Inject(AI_PROVIDER) private readonly aiProvider: ChatProvider,
	) {}

	/**
	 * Генерирует ответ на основе сообщения пользователя с использованием RAG
	 * @param request Запрос чата с сообщением и опциями
	 * @returns Ответ ассистента с источниками
	 */
	async chat(request: ChatRequestDto): Promise<ChatResponseDto> {
		if (!request.message || request.message.trim().length === 0) {
			throw new BadRequestException('Message cannot be empty');
		}

		const options: ChatOptions = {
			maxContextChunks: request.maxContextChunks ?? 5,
			// Снижаем порог по умолчанию до 0.3 для более гибкого поиска
			// Cosine similarity для эмбеддингов обычно дает значения от 0.7 до 1.0 для похожих текстов
			// Порог 0.3 позволяет находить более широкий спектр релевантных результатов
			similarityThreshold: request.similarityThreshold ?? 0.3,
			model: 'gpt-4o-mini',
		};

		// Шаг 1: Находим релевантные чанки через семантический поиск
		const relevantChunks = await this.findRelevantContext(
			request.message,
			options,
			request.fileId,
		);

		// Шаг 2: Формируем контекст из найденных чанков
		const context = this.buildContext(relevantChunks);

		// Шаг 3: Формируем промпт с контекстом
		const systemPrompt = this.buildSystemPrompt();
		const userPrompt = this.buildUserPrompt(request.message, context);

		// Шаг 4: Формируем историю сообщений
		const messages = this.buildMessages(systemPrompt, userPrompt, request.history);

		// Шаг 5: Генерируем ответ через AI провайдер
		const response = await this.aiProvider.chat(messages, options.model);

		// Шаг 6: Формируем ответ с источниками
		return {
			message: response,
			sources: relevantChunks.map((chunk) => ({
				chunkId: chunk.chunk.id,
				text: chunk.chunk.text,
				similarity: chunk.similarity,
				fileId: chunk.chunk.file_id,
				chunkIndex: chunk.chunk.chunk_index,
			})),
			model: options.model || 'gpt-4o-mini',
		};
	}

	/**
	 * Находит релевантные чанки для контекста
	 */
	private async findRelevantContext(
		query: string,
		options: ChatOptions,
		fileId?: string,
	): Promise<Array<{ chunk: any; similarity: number }>> {
		try {
			if (fileId) {
				// Поиск в конкретном файле
				console.log(`[Chat] Searching in file: ${fileId} with query: "${query.substring(0, 50)}..."`);
				console.log(`[Chat] Search options: limit=${options.maxContextChunks}, threshold=${options.similarityThreshold}`);
				const results = await this.semanticSearchService.searchByText(fileId, query, {
					limit: options.maxContextChunks,
					threshold: options.similarityThreshold,
				});
				console.log(`[Chat] Found ${results.length} relevant chunks in file ${fileId}`);
				if (results.length > 0) {
					console.log(`[Chat] Top similarity: ${results[0].similarity.toFixed(4)}`);
				}
				return results;
			}

			// Поиск по всем файлам
			console.log(`[Chat] Searching across all files with query: "${query.substring(0, 50)}..."`);
			console.log(`[Chat] Search options: limit=${options.maxContextChunks}, threshold=${options.similarityThreshold}`);
			const results = await this.semanticSearchService.searchByTextAllFiles(query, {
				limit: options.maxContextChunks,
				threshold: options.similarityThreshold,
			});
			console.log(`[Chat] Found ${results.length} relevant chunks across all files`);
			if (results.length > 0) {
				console.log(`[Chat] Top similarity: ${results[0].similarity.toFixed(4)}`);
				console.log(`[Chat] Top chunk preview: "${results[0].chunk.text.substring(0, 100)}..."`);
			} else {
				const currentThreshold = options.similarityThreshold ?? 0.3;
				const currentLimit = options.maxContextChunks ?? 5;
				console.warn(`[Chat] No chunks found above threshold ${currentThreshold}`);
				// Если ничего не найдено, пробуем с еще более низким порогом
				if (currentThreshold > 0.1) {
					console.log(`[Chat] Trying with lower threshold: 0.1`);
					const lowerThresholdResults = await this.semanticSearchService.searchByTextAllFiles(query, {
						limit: currentLimit * 2, // Увеличиваем лимит для более широкого поиска
						threshold: 0.1,
					});
					if (lowerThresholdResults.length > 0) {
						console.log(`[Chat] Found ${lowerThresholdResults.length} chunks with lower threshold (0.1)`);
						// Возвращаем топ результаты, отфильтрованные по более высокому порогу
						return lowerThresholdResults.slice(0, currentLimit);
					}
				}
			}
			return results;
		} catch (error) {
			console.error('[Chat] Error finding relevant context:', error);
			if (error instanceof Error) {
				console.error('[Chat] Error message:', error.message);
				console.error('[Chat] Error stack:', error.stack);
			}
			// В случае ошибки возвращаем пустой массив, чтобы чат мог работать без контекста
			return [];
		}
	}

	/**
	 * Формирует контекст из найденных чанков
	 */
	private buildContext(chunks: Array<{ chunk: any; similarity: number }>): string {
		if (chunks.length === 0) {
			return 'No relevant context found.';
		}

		const contextParts = chunks.map((item, index) => {
			return `[Source ${index + 1}]:\n${item.chunk.text}`;
		});

		return contextParts.join('\n\n---\n\n');
	}

	/**
	 * Формирует системный промпт
	 */
	private buildSystemPrompt(): string {
		return `You are a helpful AI assistant that answers questions based on the provided context from documents.
Your task is to:
1. Use only the information provided in the context to answer questions
2. If the context doesn't contain enough information, say so clearly
3. Cite sources when possible (e.g., "According to Source 1...")
4. Be concise and accurate
5. If asked about something not in the context, politely explain that you don't have that information

Always base your answers on the provided context and be honest when you don't know something.`;
	}

	/**
	 * Формирует пользовательский промпт с контекстом
	 */
	private buildUserPrompt(message: string, context: string): string {
		return `Context from documents:
${context}

---
User question: ${message}

Please provide a helpful answer based on the context above.`;
	}

	/**
	 * Формирует массив сообщений для API
	 */
	private buildMessages(
		systemPrompt: string,
		userPrompt: string,
		history?: Array<{ role: string; content: string }>,
	): Array<{ role: string; content: string }> {
		const messages: Array<{ role: string; content: string }> = [];

		// Добавляем системный промпт
		messages.push({
			role: ChatRole.SYSTEM,
			content: systemPrompt,
		});

		// Добавляем историю, если есть (исключаем системные сообщения из истории)
		if (history && history.length > 0) {
			const filteredHistory = history.filter((msg) => msg.role !== ChatRole.SYSTEM);
			messages.push(...filteredHistory);
		}

		// Добавляем текущий запрос пользователя
		messages.push({
			role: ChatRole.USER,
			content: userPrompt,
		});

		return messages;
	}
}

