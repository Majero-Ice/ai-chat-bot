import { Inject, Injectable } from '@nestjs/common';
import { FileEntity } from './domain/file.entity';
import type { FilesRepositoryPort } from './repositories/files.repository.port';

export const FILES_REPOSITORY = Symbol('FILES_REPOSITORY');

@Injectable()
export class FilesService {
	constructor(@Inject(FILES_REPOSITORY) private readonly files: FilesRepositoryPort) {}

	create(name: string): Promise<FileEntity> {
		return this.files.create({ name });
	}

	findById(id: string): Promise<FileEntity | null> {
		return this.files.findById(id);
	}

	list(): Promise<FileEntity[]> {
		return this.files.list();
	}

	deleteById(id: string): Promise<void> {
		return this.files.deleteById(id);
	}
}

