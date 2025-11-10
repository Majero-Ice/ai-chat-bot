import { TextChunkEntity } from '../domain/text-chunk.entity';

export interface TextChunksRepositoryPort {
	insertMany(chunks: Array<Omit<TextChunkEntity, 'id' | 'created_at'>>): Promise<number>;
	listByFileId(fileId: string): Promise<TextChunkEntity[]>;
	deleteByFileId(fileId: string): Promise<void>;
}

