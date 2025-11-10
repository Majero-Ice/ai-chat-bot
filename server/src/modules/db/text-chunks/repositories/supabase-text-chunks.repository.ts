import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../core/supabase/base.repository';
import { TextChunksRepositoryPort } from './text-chunks.repository.port';
import { TextChunkEntity } from '../domain/text-chunk.entity';

@Injectable()
export class SupabaseTextChunksRepository extends BaseRepository<TextChunkEntity> implements TextChunksRepositoryPort {
	protected readonly table = 'text_chunks';

	async insertMany(chunks: Array<Omit<TextChunkEntity, 'id' | 'created_at'>>): Promise<number> {
		if (chunks.length === 0) return 0;
		const { count, error } = await this.from().insert(chunks, { count: 'exact' });
		if (error) throw error;
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
}

