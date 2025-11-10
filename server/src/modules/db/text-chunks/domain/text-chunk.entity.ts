export interface TextChunkEntity {
	id: string;
	file_id: string;
	chunk_index: number;
	text: string;
	embedding?: number[] | null;
	created_at: string;
}

