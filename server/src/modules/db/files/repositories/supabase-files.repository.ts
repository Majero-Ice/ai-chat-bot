import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../core/supabase/base.repository';
import { FileEntity } from '../domain/file.entity';
import { FilesRepositoryPort } from './files.repository.port';

@Injectable()
export class SupabaseFilesRepository extends BaseRepository<FileEntity> implements FilesRepositoryPort {
	protected readonly table = 'files';

	async create(file: Pick<FileEntity, 'name'>): Promise<FileEntity> {
		const { data, error } = await this.from().insert({ name: file.name }).select('*').single();
		if (error) throw error;
		return data as FileEntity;
	}

	async findById(id: string): Promise<FileEntity | null> {
		const { data, error } = await this.from().select('*').eq('id', id).maybeSingle();
		if (error) throw error;
		return data as FileEntity | null;
	}

	async list(): Promise<FileEntity[]> {
		const { data, error } = await this.from().select('*').order('uploaded_at', { ascending: false });
		if (error) throw error;
		return (data ?? []) as FileEntity[];
	}

	async deleteById(id: string): Promise<void> {
		const { error } = await this.from().delete().eq('id', id);
		if (error) throw error;
	}
}

