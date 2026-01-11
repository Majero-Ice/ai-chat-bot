import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../core/supabase/base.repository';
import { ProjectEntity } from '../domain/project.entity';
import { ProjectsRepositoryPort } from './projects.repository.port';

@Injectable()
export class SupabaseProjectsRepository extends BaseRepository<ProjectEntity> implements ProjectsRepositoryPort {
	protected readonly table = 'projects';

	async create(project: Pick<ProjectEntity, 'name' | 'description' | 'user_id' | 'slug'>): Promise<ProjectEntity> {
		const { data, error } = await this.from()
			.insert({
				name: project.name,
				description: project.description || null,
				user_id: project.user_id,
				slug: project.slug || null,
			})
			.select('*')
			.single();
		if (error) {
			console.error('Supabase error creating project:', error);
			throw error;
		}
		return data as ProjectEntity;
	}

	async findById(id: string): Promise<ProjectEntity | null> {
		const { data, error } = await this.from().select('*').eq('id', id).maybeSingle();
		if (error) throw error;
		return data as ProjectEntity | null;
	}

	async findByUserId(userId: string): Promise<ProjectEntity[]> {
		const { data, error } = await this.from()
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });
		if (error) throw error;
		return (data ?? []) as ProjectEntity[];
	}

	async findBySlug(slug: string): Promise<ProjectEntity | null> {
		const { data, error } = await this.from().select('*').eq('slug', slug).maybeSingle();
		if (error) throw error;
		return data as ProjectEntity | null;
	}

	async update(
		id: string,
		input: Partial<Pick<ProjectEntity, 'name' | 'description' | 'slug'>>,
	): Promise<ProjectEntity> {
		const { data, error } = await this.from()
			.update({ ...input, updated_at: new Date().toISOString() })
			.eq('id', id)
			.select('*')
			.single();
		if (error) throw error;
		return data as ProjectEntity;
	}

	async deleteById(id: string): Promise<void> {
		const { error } = await this.from().delete().eq('id', id);
		if (error) throw error;
	}
}
