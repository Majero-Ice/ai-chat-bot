import { Inject, Injectable } from '@nestjs/common';
import { ProjectEntity } from './domain/project.entity';
import type { ProjectsRepositoryPort } from './repositories/projects.repository.port';

export const PROJECTS_REPOSITORY = Symbol('PROJECTS_REPOSITORY');

@Injectable()
export class ProjectsService {
	constructor(@Inject(PROJECTS_REPOSITORY) private readonly projects: ProjectsRepositoryPort) {}

	create(input: Pick<ProjectEntity, 'name' | 'description' | 'user_id' | 'slug'>): Promise<ProjectEntity> {
		return this.projects.create(input);
	}

	findById(id: string): Promise<ProjectEntity | null> {
		return this.projects.findById(id);
	}

	findByUserId(userId: string): Promise<ProjectEntity[]> {
		return this.projects.findByUserId(userId);
	}

	findBySlug(slug: string): Promise<ProjectEntity | null> {
		return this.projects.findBySlug(slug);
	}

	update(
		id: string,
		input: Partial<Pick<ProjectEntity, 'name' | 'description' | 'slug'>>,
	): Promise<ProjectEntity> {
		return this.projects.update(id, input);
	}

	deleteById(id: string): Promise<void> {
		return this.projects.deleteById(id);
	}
}
