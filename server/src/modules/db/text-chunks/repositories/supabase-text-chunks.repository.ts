import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../core/supabase/base.repository';
import { TextChunksRepositoryPort } from './text-chunks.repository.port';
import { TextChunkEntity } from '../domain/text-chunk.entity';
import { SimilaritySearchResult } from '../domain/similarity-search-result.interface';

@Injectable()
export class SupabaseTextChunksRepository extends BaseRepository<TextChunkEntity> implements TextChunksRepositoryPort {
	protected readonly table = 'text_chunks';

	async insertMany(chunks: Array<Omit<TextChunkEntity, 'id' | 'created_at'>>): Promise<number> {
		if (chunks.length === 0) return 0;
		
		// Логируем информацию о вставляемых чанках
		const chunksWithEmbeddings = chunks.filter((chunk) => chunk.embedding && chunk.embedding.length > 0);
		console.log(`[Insert] Inserting ${chunks.length} chunks, ${chunksWithEmbeddings.length} with embeddings`);
		
		if (chunksWithEmbeddings.length > 0) {
			const firstChunk = chunksWithEmbeddings[0];
			console.log(`[Insert] First chunk embedding length: ${firstChunk.embedding?.length}, type: ${typeof firstChunk.embedding}`);
			console.log(`[Insert] First chunk embedding sample (first 5 values): ${firstChunk.embedding?.slice(0, 5).join(', ')}`);
		}
		
		const { count, error } = await this.from().insert(chunks, { count: 'exact' });
		if (error) {
			console.error('[Insert] Error inserting chunks:', error);
			throw error;
		}
		console.log(`[Insert] Successfully inserted ${count} chunks`);
		return count ?? 0;
	}

	async listByFileId(fileId: string): Promise<TextChunkEntity[]> {
		const { data, error } = await this.from()
			.select('*')
			.eq('file_id', fileId)
			.order('chunk_index', { ascending: true });
		if (error) throw error;
		return (data ?? []) as TextChunkEntity[];
	}

	async deleteByFileId(fileId: string): Promise<void> {
		const { error } = await this.from().delete().eq('file_id', fileId);
		if (error) throw error;
	}

	async findSimilarByEmbedding(
		fileId: string,
		embedding: number[],
		limit: number = 5,
		threshold: number = 0.3,
	): Promise<SimilaritySearchResult[]> {
		console.log(`[RPC] Attempting RPC call for file ${fileId} with threshold ${threshold}`);
		console.log(`[RPC] Query embedding length: ${embedding.length}, first 5 values: ${embedding.slice(0, 5).join(', ')}`);
		
		// Используем RPC функцию для векторного поиска в Supabase с pgvector
		// Предполагается, что в БД есть функция match_chunks или используется встроенный поиск
		const { data, error } = await this.client.rpc('match_text_chunks', {
			query_embedding: embedding,
			match_file_id: fileId,
			match_threshold: threshold,
			match_count: limit,
		});

		if (error) {
			console.warn(`[RPC] RPC function error, using fallback:`, error.message);
			console.warn(`[RPC] Error details:`, error);
			// Если RPC функция не существует, используем альтернативный подход
			// через вычисление cosine similarity в запросе
			return this.findSimilarByEmbeddingFallback(fileId, embedding, limit, threshold);
		}

		console.log(`[RPC] RPC function returned ${data?.length || 0} results`);
		if (data && data.length > 0) {
			console.log(`[RPC] Top result similarity: ${data[0]?.similarity || 'unknown'}`);
		}
		
		// Преобразуем результат RPC в формат SimilaritySearchResult
		return (data || []).map((item: any) => ({
			chunk: {
				id: item.id,
				file_id: item.file_id,
				chunk_index: item.chunk_index,
				text: item.text,
				embedding: item.embedding,
				created_at: item.created_at,
			} as TextChunkEntity,
			similarity: item.similarity || 0,
		}));
	}

	/**
	 * Альтернативный метод поиска, если RPC функция не настроена
	 * Выполняет поиск через фильтрацию и вычисление схожести на клиенте
	 */
	private async findSimilarByEmbeddingFallback(
		fileId: string,
		embedding: number[],
		limit: number,
		threshold: number,
	): Promise<SimilaritySearchResult[]> {
		console.log(`[Fallback] Searching in file ${fileId} with embedding length: ${embedding.length}`);
		console.log(`[Fallback] Threshold: ${threshold}, Limit: ${limit}`);
		
		// Получаем все чанки файла с эмбеддингами
		const { data, error } = await this.from()
			.select('*')
			.eq('file_id', fileId)
			.not('embedding', 'is', null);

		if (error) {
			console.error('[Fallback] Error fetching chunks:', error);
			throw error;
		}
		
		console.log(`[Fallback] Found ${data?.length || 0} chunks with embeddings in file ${fileId}`);
		
		if (!data || data.length === 0) {
			console.warn(`[Fallback] No chunks with embeddings found for file ${fileId}`);
			return [];
		}

		// Вычисляем cosine similarity для каждого чанка
		const results: SimilaritySearchResult[] = data
			.map((chunk: any, index: number) => {
				// Эмбеддинг может быть в разных форматах: массив, строка JSON, или векторный тип
				let chunkEmbedding: number[];
				
				if (Array.isArray(chunk.embedding)) {
					chunkEmbedding = chunk.embedding;
				} else if (typeof chunk.embedding === 'string') {
					try {
						// Пробуем распарсить как JSON
						chunkEmbedding = JSON.parse(chunk.embedding);
					} catch (e) {
						// Если не JSON, возможно это строка в формате "[1,2,3]"
						try {
							// Убираем квадратные скобки и парсим как массив
							const cleanStr = chunk.embedding.trim().replace(/^\[|\]$/g, '');
							chunkEmbedding = cleanStr.split(',').map(Number);
						} catch (e2) {
							if (index < 3) {
								console.warn(`[Fallback] Cannot parse embedding for chunk ${chunk.id}:`, e, e2);
							}
							return null;
						}
					}
				} else if (chunk.embedding && typeof chunk.embedding === 'object' && 'toArray' in chunk.embedding) {
					// Если это специальный векторный тип pgvector
					chunkEmbedding = (chunk.embedding as any).toArray();
				} else {
					if (index < 3) {
						console.warn(`[Fallback] Unknown embedding format for chunk ${chunk.id}:`, typeof chunk.embedding, chunk.embedding?.constructor?.name);
					}
					return null;
				}

				if (!chunkEmbedding || chunkEmbedding.length !== embedding.length) {
					if (index < 3) {
						console.warn(
							`[Fallback] Chunk ${chunk.id} embedding length mismatch: ${chunkEmbedding?.length} vs ${embedding.length}`,
						);
					}
					return null;
				}

				const similarity = this.cosineSimilarity(embedding, chunkEmbedding);
				
				// Логируем первые несколько результатов для отладки
				if (index < 5) {
					console.log(`[Fallback] Chunk ${chunk.id} similarity: ${similarity.toFixed(4)}`);
				}
				
				return {
					chunk: chunk as TextChunkEntity,
					similarity,
				};
			})
			.filter((result): result is SimilaritySearchResult => {
				if (result === null) return false;
				const passes = result.similarity >= threshold;
				if (!passes && result.similarity > 0.5) {
					console.log(
						`[Fallback] Chunk ${result.chunk.id} similarity ${result.similarity.toFixed(4)} below threshold ${threshold}`,
					);
				}
				return passes;
			})
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, limit);

		console.log(`[Fallback] Returning ${results.length} results above threshold ${threshold}`);
		return results;
	}

	/**
	 * Находит похожие чанки по всем файлам
	 */
	async findSimilarByEmbeddingAllFiles(
		embedding: number[],
		limit: number = 5,
		threshold: number = 0.3,
	): Promise<SimilaritySearchResult[]> {
		console.log(`[RPC All Files] Attempting RPC call for all files with threshold ${threshold}`);
		console.log(`[RPC All Files] Query embedding length: ${embedding.length}, first 5 values: ${embedding.slice(0, 5).join(', ')}`);
		
		// Пытаемся использовать RPC функцию для поиска по всем файлам
		const { data, error } = await this.client.rpc('match_text_chunks_all_files', {
			query_embedding: embedding,
			match_threshold: threshold,
			match_count: limit,
		});

		if (error) {
			console.warn(`[RPC All Files] RPC function error, using fallback:`, error.message);
			console.warn(`[RPC All Files] Error details:`, error);
			// Если RPC функция не существует, используем альтернативный подход
			return this.findSimilarByEmbeddingAllFilesFallback(embedding, limit, threshold);
		}

		console.log(`[RPC All Files] RPC function returned ${data?.length || 0} results`);
		if (data && data.length > 0) {
			console.log(`[RPC All Files] Top result similarity: ${data[0]?.similarity || 'unknown'}`);
		} else if (data && data.length === 0) {
			console.warn(`[RPC All Files] RPC function returned 0 results, trying fallback method`);
			// Если RPC вернул 0 результатов, пробуем fallback метод
			// Возможно, проблема в настройке RPC функции или пороге
			return this.findSimilarByEmbeddingAllFilesFallback(embedding, limit, threshold);
		}
		
		// Преобразуем результат RPC в формат SimilaritySearchResult
		return (data || []).map((item: any) => ({
			chunk: {
				id: item.id,
				file_id: item.file_id,
				chunk_index: item.chunk_index,
				text: item.text,
				embedding: item.embedding,
				created_at: item.created_at,
			} as TextChunkEntity,
			similarity: item.similarity || 0,
		}));
	}

	/**
	 * Альтернативный метод поиска по всем файлам, если RPC функция не настроена
	 */
	private async findSimilarByEmbeddingAllFilesFallback(
		embedding: number[],
		limit: number,
		threshold: number,
	): Promise<SimilaritySearchResult[]> {
		console.log(`[Fallback All Files] Searching with embedding length: ${embedding.length}`);
		console.log(`[Fallback All Files] Threshold: ${threshold}, Limit: ${limit}`);
		
		// Получаем все чанки с эмбеддингами
		const { data, error } = await this.from()
			.select('*')
			.not('embedding', 'is', null);

		if (error) {
			console.error('[Fallback All Files] Error fetching chunks:', error);
			throw error;
		}
		
		console.log(`[Fallback All Files] Found ${data?.length || 0} total chunks with embeddings`);
		
		if (!data || data.length === 0) {
			console.warn('[Fallback All Files] No chunks with embeddings found in database');
			return [];
		}

		// Вычисляем cosine similarity для каждого чанка
		const similarities: Array<{ chunk: any; similarity: number }> = [];
		
		for (let index = 0; index < data.length; index++) {
			const chunk: any = data[index];
			
			// Эмбеддинг может быть в разных форматах: массив, строка JSON, или векторный тип
			let chunkEmbedding: number[];
			
			try {
				if (Array.isArray(chunk.embedding)) {
					chunkEmbedding = chunk.embedding;
				} else if (typeof chunk.embedding === 'string') {
					try {
						// Пробуем распарсить как JSON
						chunkEmbedding = JSON.parse(chunk.embedding);
					} catch (e) {
						// Если не JSON, возможно это строка в формате "[1,2,3]"
						try {
							// Убираем квадратные скобки и парсим как массив
							const cleanStr = chunk.embedding.trim().replace(/^\[|\]$/g, '');
							chunkEmbedding = cleanStr.split(',').map(Number);
						} catch (e2) {
							if (index < 3) {
								console.warn(`[Fallback All Files] Cannot parse embedding for chunk ${chunk.id}:`, e, e2);
							}
							continue;
						}
					}
				} else if (chunk.embedding && typeof chunk.embedding === 'object' && 'toArray' in chunk.embedding) {
					// Если это специальный векторный тип pgvector
					chunkEmbedding = (chunk.embedding as any).toArray();
				} else {
					if (index < 3) {
						console.warn(`[Fallback All Files] Unknown embedding format for chunk ${chunk.id}:`, typeof chunk.embedding, chunk.embedding?.constructor?.name);
					}
					continue;
				}

				if (!chunkEmbedding || chunkEmbedding.length !== embedding.length) {
					if (index < 3) {
						console.warn(
							`[Fallback All Files] Chunk ${chunk.id} embedding length mismatch: ${chunkEmbedding?.length} vs ${embedding.length}`,
						);
					}
					continue;
				}

				const similarity = this.cosineSimilarity(embedding, chunkEmbedding);
				
				// Логируем топ результаты
				if (index < 10) {
					console.log(`[Fallback All Files] Chunk ${chunk.id} (file: ${chunk.file_id}) similarity: ${similarity.toFixed(4)}`);
				}
				
				similarities.push({
					chunk: chunk as TextChunkEntity,
					similarity,
				});
			} catch (error) {
				if (index < 3) {
					console.warn(`[Fallback All Files] Error processing chunk ${chunk.id}:`, error);
				}
				continue;
			}
		}
		
		// Сортируем по схожести и фильтруем по порогу
		const results: SimilaritySearchResult[] = similarities
			.filter((result) => {
				const passes = result.similarity >= threshold;
				if (!passes && result.similarity > 0.2) {
					console.log(
						`[Fallback All Files] Chunk ${result.chunk.id} similarity ${result.similarity.toFixed(4)} below threshold ${threshold}`,
					);
				}
				return passes;
			})
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, limit)
			.map((result) => ({
				chunk: result.chunk,
				similarity: result.similarity,
			}));

		console.log(`[Fallback All Files] Processed ${similarities.length} chunks, found ${results.length} results above threshold ${threshold}`);
		if (similarities.length > 0) {
			const topSimilarity = Math.max(...similarities.map(s => s.similarity));
			console.log(`[Fallback All Files] Top similarity among all chunks: ${topSimilarity.toFixed(4)}`);
		}
		if (results.length > 0) {
			console.log(`[Fallback All Files] Returning ${results.length} results, top similarity: ${results[0].similarity.toFixed(4)}`);
		} else if (similarities.length > 0) {
			console.warn(`[Fallback All Files] No results above threshold ${threshold}, but found chunks with similarities up to ${Math.max(...similarities.map(s => s.similarity)).toFixed(4)}`);
		}
		return results;
	}

	/**
	 * Вычисляет cosine similarity между двумя векторами
	 */
	private cosineSimilarity(vecA: number[], vecB: number[]): number {
		if (vecA.length !== vecB.length) {
			throw new Error('Vectors must have the same length');
		}

		let dotProduct = 0;
		let normA = 0;
		let normB = 0;

		for (let i = 0; i < vecA.length; i++) {
			dotProduct += vecA[i] * vecB[i];
			normA += vecA[i] * vecA[i];
			normB += vecB[i] * vecB[i];
		}

		const denominator = Math.sqrt(normA) * Math.sqrt(normB);
		if (denominator === 0) return 0;

		return dotProduct / denominator;
	}
}

