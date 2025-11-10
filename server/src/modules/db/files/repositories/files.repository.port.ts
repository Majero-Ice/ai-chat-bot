import { FileEntity } from '../domain/file.entity';

export interface FilesRepositoryPort {
	create(input: Pick<FileEntity, 'name'>): Promise<FileEntity>;
	findById(id: string): Promise<FileEntity | null>;
	list(): Promise<FileEntity[]>;
	deleteById(id: string): Promise<void>;
}

