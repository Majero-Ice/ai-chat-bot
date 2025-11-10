import { Inject, Injectable } from '@nestjs/common';
import { TextChunkEntity } from './domain/text-chunk.entity';
import type { TextChunksRepositoryPort } from './repositories/text-chunks.repository.port';

export const TEXT_CHUNKS_REPOSITORY = Symbol('TEXT_CHUNKS_REPOSITORY');

@Injectable()
export class TextChunksService {
	constructor(@Inject(TEXT_CHUNKS_REPOSITORY) private readonly chunks: TextChunksRepositoryPort) {}

	insertMany(chunks: Array<Omit<TextChunkEntity, 'id' | 'created_at'>>): Promise<number> {
		return this.chunks.insertMany(chunks);
	}

	listByFileId(fileId: string): Promise<TextChunkEntity[]> {
		return this.chunks.listByFileId(fileId);
	}

	deleteByFileId(fileId: string): Promise<void> {
		return this.chunks.deleteByFileId(fileId);
	}
}

